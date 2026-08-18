import { and, asc, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {
  accountingPeriodActions,
  accountingPeriods,
  accessDelegationActions,
  accessInvitations,
  cashAttachments,
  cashTransactions,
  clients,
  expenses,
  legalMatters,
  reportApprovalActions,
  reportApprovalRequests,
  revenues,
  type InsertUser,
  userPermissionGrants,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { sendAccessInvitationEmail } from "./accessEmail";
import { DELEGABLE_PERMISSIONS, type DelegablePermission } from "./permissions";

export type AccountingPeriodStatus = "open" | "pending_approval" | "rejected" | "approved" | "locked";
export type ReportApprovalStatus = "pending_level_1" | "pending_level_2" | "rejected" | "internally_attested";
export type UserRole = "owner" | "admin" | "staff";

type PeriodAction = "request" | "approve" | "reject" | "lock" | "reopen";
type ReportApprovalAction = "request" | "approve_level_1" | "approve_level_2" | "reject";

let _db: ReturnType<typeof drizzle> | null = null;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parsePermissions(value: string) {
  try {
    const parsed = JSON.parse(value);
    const values = Array.isArray(parsed) ? parsed : parsed?.permissions;
    return Array.isArray(values) ? values.filter((permission): permission is DelegablePermission => DELEGABLE_PERMISSIONS.includes(permission)) : [];
  } catch {
    return [];
  }
}

function parsePermissionExpiries(value: string): Partial<Record<DelegablePermission, Date | null>> {
  try {
    const entries = JSON.parse(value)?.permissionExpiries;
    if (!entries || typeof entries !== "object") return {};
    return Object.fromEntries(Object.entries(entries).filter(([permission]) => DELEGABLE_PERMISSIONS.includes(permission as DelegablePermission)).map(([permission, expiry]) => [permission, expiry ? new Date(String(expiry)) : null])) as Partial<Record<DelegablePermission, Date | null>>;
  } catch { return {}; }
}

function isOwnerOpenId(openId: string) {
  return openId === ENV.ownerOpenId;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    lastSignedIn: new Date(),
    role: isOwnerOpenId(user.openId) ? "owner" : user.role ?? "staff",
  };
  await db.insert(users).values(values).onDuplicateKeyUpdate({
    set: {
      name: values.name,
      email: values.email,
      loginMethod: values.loginMethod,
      lastSignedIn: new Date(),
      ...(isOwnerOpenId(user.openId) ? { role: "owner" } : {}),
    },
  });
  if (!user.email || isOwnerOpenId(user.openId)) return;
  const savedUser = await getUserByOpenId(user.openId);
  if (!savedUser) return;
  const invitation = (await db.select().from(accessInvitations).where(and(eq(accessInvitations.email, normalizeEmail(user.email)), eq(accessInvitations.status, "pending"))).limit(1))[0];
  if (!invitation) return;
  const permissions = parsePermissions(invitation.permissionsJson);
  await db.update(users).set({ role: invitation.role }).where(eq(users.id, savedUser.id));
  await synchronizeUserPermissions(savedUser.id, permissions, invitation.invitedBy, false, invitation.grantExpiresAt, parsePermissionExpiries(invitation.permissionsJson));
  await db.update(accessInvitations).set({ status: "activated", activatedUserId: savedUser.id, activatedAt: new Date() }).where(eq(accessInvitations.id, invitation.id));
  await recordAccessAction({ action: "activate_invitation", targetUserId: savedUser.id, targetEmail: invitation.email, actorId: invitation.invitedBy, nextValue: invitation.role });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserAccessProfile(user: { id: number; openId: string; role: UserRole }) {
  const isOwner = isOwnerOpenId(user.openId);
  if (isOwner) return { isOwner: true, role: "owner" as const, permissions: [...DELEGABLE_PERMISSIONS] };
  const db = await getDb();
  if (!db || user.role !== "admin") return { isOwner: false, role: user.role, permissions: [] as DelegablePermission[] };
  const now = new Date();
  const rows = await db.select({ permission: userPermissionGrants.permission, expiresAt: userPermissionGrants.expiresAt }).from(userPermissionGrants).where(and(eq(userPermissionGrants.userId, user.id), isNull(userPermissionGrants.revokedAt)));
  return { isOwner: false, role: user.role, permissions: rows.filter(row => !row.expiresAt || row.expiresAt > now).map(row => row.permission) as DelegablePermission[] };
}

export async function listAccessDirectory() {
  const db = await getDb();
  if (!db) return { users: [], invitations: [], actions: [] };
  const [accountRows, grantRows, invitationRows, actionRows] = await Promise.all([
    db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn }).from(users).orderBy(asc(users.name), asc(users.id)),
    db.select({ userId: userPermissionGrants.userId, permission: userPermissionGrants.permission, expiresAt: userPermissionGrants.expiresAt }).from(userPermissionGrants).where(isNull(userPermissionGrants.revokedAt)),
    db.select().from(accessInvitations).orderBy(desc(accessInvitations.invitedAt)),
    db.select({ id: accessDelegationActions.id, action: accessDelegationActions.action, targetEmail: accessDelegationActions.targetEmail, permission: accessDelegationActions.permission, actorName: users.name, createdAt: accessDelegationActions.createdAt }).from(accessDelegationActions).leftJoin(users, eq(accessDelegationActions.actorId, users.id)).orderBy(desc(accessDelegationActions.createdAt)).limit(20),
  ]);
  return {
    users: accountRows.map(account => {
      const grants = grantRows.filter(grant => grant.userId === account.id && (!grant.expiresAt || grant.expiresAt > new Date()));
      return { ...account, isOwner: isOwnerOpenId(account.openId), permissions: grants.map(grant => grant.permission) as DelegablePermission[], grants: grants.map(grant => ({ permission: grant.permission as DelegablePermission, expiresAt: grant.expiresAt })) };
    }),
    invitations: invitationRows.map(invitation => ({ ...invitation, permissions: parsePermissions(invitation.permissionsJson), permissionExpiries: parsePermissionExpiries(invitation.permissionsJson) })),
    actions: actionRows,
  };
}

async function recordAccessAction(input: { action: "invite" | "role_change" | "grant" | "revoke" | "expire" | "activate_invitation"; targetUserId?: number; targetEmail?: string; permission?: DelegablePermission; previousValue?: string; nextValue?: string; actorId: number }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(accessDelegationActions).values({ ...input, targetUserId: input.targetUserId ?? null, targetEmail: input.targetEmail ?? null, permission: input.permission ?? null, previousValue: input.previousValue ?? null, nextValue: input.nextValue ?? null });
}

async function synchronizeUserPermissions(userId: number, permissions: DelegablePermission[], actorId: number, recordActions = true, expiresAt?: Date | null, permissionExpiries?: Partial<Record<DelegablePermission, Date | null>>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const wanted = new Set(permissions);
  const existing = await db.select().from(userPermissionGrants).where(eq(userPermissionGrants.userId, userId));
  for (const permission of DELEGABLE_PERMISSIONS) {
    const grant = existing.find(row => row.permission === permission);
    const permissionExpiry = permissionExpiries?.[permission] ?? expiresAt ?? null;
    if (wanted.has(permission) && (!grant || grant.revokedAt)) {
      if (grant) await db.update(userPermissionGrants).set({ revokedAt: null, revokedBy: null, grantedBy: actorId, grantedAt: new Date(), expiresAt: permissionExpiry }).where(eq(userPermissionGrants.id, grant.id));
      else await db.insert(userPermissionGrants).values({ userId, permission, grantedBy: actorId, expiresAt: permissionExpiry });
      if (recordActions) await recordAccessAction({ action: "grant", targetUserId: userId, permission, actorId, nextValue: permissionExpiry ? `active_until:${permissionExpiry.toISOString()}` : "active_indefinitely" });
    } else if (wanted.has(permission) && grant && !grant.revokedAt) {
      await db.update(userPermissionGrants).set({ expiresAt: permissionExpiry }).where(eq(userPermissionGrants.id, grant.id));
    }
    if (!wanted.has(permission) && grant && !grant.revokedAt) {
      await db.update(userPermissionGrants).set({ revokedAt: new Date(), revokedBy: actorId }).where(eq(userPermissionGrants.id, grant.id));
      if (recordActions) await recordAccessAction({ action: "revoke", targetUserId: userId, permission, actorId, previousValue: "active" });
    }
  }
}

export async function setUserAccessProfile(input: { userId: number; role: "admin" | "staff"; permissions: DelegablePermission[]; actorId: number; expiresAt?: Date | null; permissionExpiries?: Partial<Record<DelegablePermission, Date | null>> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const target = (await db.select().from(users).where(eq(users.id, input.userId)).limit(1))[0];
  if (!target) throw new Error("Không tìm thấy tài khoản cần cập nhật.");
  if (isOwnerOpenId(target.openId)) throw new Error("Không thể thay đổi vai trò hoặc thẩm quyền của chủ sở hữu dự án.");
  if (input.role === "staff" && input.permissions.length) throw new Error("Chỉ quản trị viên mới có thể nhận thẩm quyền phê duyệt hoặc kiểm soát dữ liệu.");
  const cleanPermissions = Array.from(new Set(input.permissions));
  await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
  await recordAccessAction({ action: "role_change", targetUserId: input.userId, targetEmail: target.email ?? undefined, actorId: input.actorId, previousValue: target.role, nextValue: input.role });
  await synchronizeUserPermissions(input.userId, input.role === "admin" ? cleanPermissions : [], input.actorId, true, input.expiresAt, input.permissionExpiries);
  return { success: true };
}

export async function inviteUserByEmail(input: { email: string; role: "admin" | "staff"; permissions: DelegablePermission[]; actorId: number; expiresAt?: Date | null; permissionExpiries?: Partial<Record<DelegablePermission, Date | null>> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const email = normalizeEmail(input.email);
  if (input.role === "staff" && input.permissions.length) throw new Error("Chỉ quản trị viên mới có thể nhận thẩm quyền phê duyệt hoặc kiểm soát dữ liệu.");
  const permissions = Array.from(new Set(input.permissions));
  const existingUser = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
  if (existingUser) {
    if (isOwnerOpenId(existingUser.openId)) throw new Error("Không thể thay đổi tài khoản chủ sở hữu bằng lời mời email.");
    await setUserAccessProfile({ userId: existingUser.id, role: input.role, permissions, actorId: input.actorId, expiresAt: input.expiresAt, permissionExpiries: input.permissionExpiries });
    return { state: "updated_existing" as const };
  }
  const invitationPermissions = JSON.stringify({ permissions, permissionExpiries: Object.fromEntries(Object.entries(input.permissionExpiries ?? {}).map(([permission, expiry]) => [permission, expiry?.toISOString() ?? null])) });
  await db.insert(accessInvitations).values({ email, role: input.role, permissionsJson: invitationPermissions, grantExpiresAt: input.expiresAt ?? null, status: "pending", invitedBy: input.actorId }).onDuplicateKeyUpdate({ set: { role: input.role, permissionsJson: invitationPermissions, grantExpiresAt: input.expiresAt ?? null, status: "pending", invitedBy: input.actorId, invitedAt: new Date(), activatedUserId: null, activatedAt: null, emailDeliveryStatus: "pending", emailSentAt: null, emailError: null } });
  let emailStatus: "sent" | "failed" = "sent";
  let emailError: string | null = null;
  try { await sendAccessInvitationEmail({ recipient: email, role: input.role, permissions, expiresAt: input.expiresAt }); }
  catch (error) { emailStatus = "failed"; emailError = error instanceof Error ? error.message.slice(0, 1000) : "Không thể gửi email mời."; }
  await db.update(accessInvitations).set({ emailDeliveryStatus: emailStatus, emailSentAt: emailStatus === "sent" ? new Date() : null, emailError }).where(eq(accessInvitations.email, email));
  await recordAccessAction({ action: "invite", targetEmail: email, actorId: input.actorId, nextValue: `${input.role}:${permissions.join(",")}:${emailStatus}` });
  return { state: "pending_email_login" as const, emailStatus, emailError };
}

export async function revokeExpiredPermissions() {
  const db = await getDb();
  if (!db) return { revoked: 0 };
  const now = new Date();
  const expired = (await db.select().from(userPermissionGrants).where(isNull(userPermissionGrants.revokedAt))).filter(grant => !!grant.expiresAt && grant.expiresAt <= now);
  if (!expired.length) return { revoked: 0 };
  const owner = (await db.select().from(users).where(eq(users.openId, ENV.ownerOpenId)).limit(1))[0];
  for (const grant of expired) {
    await db.update(userPermissionGrants).set({ revokedAt: now, revokedBy: owner?.id ?? null }).where(eq(userPermissionGrants.id, grant.id));
    if (owner) await recordAccessAction({ action: "expire", targetUserId: grant.userId, permission: grant.permission as DelegablePermission, actorId: owner.id, previousValue: grant.expiresAt?.toISOString(), nextValue: "expired" });
  }
  return { revoked: expired.length };
}

export function toPeriodKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isPeriodMutableStatus(status?: AccountingPeriodStatus) {
  return !status || status === "open" || status === "rejected";
}

export function getPeriodBounds(periodKey: string) {
  const matched = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodKey);
  if (!matched) throw new Error("Kỳ kế toán phải có định dạng YYYY-MM.");
  const year = Number(matched[1]);
  const monthIndex = Number(matched[2]) - 1;
  return {
    start: new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999)),
  };
}

async function getPeriodByKey(periodKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(accountingPeriods).where(eq(accountingPeriods.periodKey, periodKey)).limit(1);
  return rows[0];
}

async function ensurePeriod(periodKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await getPeriodByKey(periodKey);
  if (existing) return existing;
  await db.insert(accountingPeriods).values({ periodKey, status: "open" });
  const created = await getPeriodByKey(periodKey);
  if (!created) throw new Error("Không thể khởi tạo kỳ kế toán.");
  return created;
}

export async function assertPeriodMutable(date: Date) {
  const period = await getPeriodByKey(toPeriodKey(date));
  if (period && !isPeriodMutableStatus(period.status)) {
    throw new Error(`Kỳ ${period.periodKey} đang ở trạng thái ${period.status}; không thể thay đổi dữ liệu trước khi bị từ chối hoặc mở lại.`);
  }
}

function isPeriodReady(control: { unreconciledCashCount: number; otherReferenceCount: number; receiptDifference: number; paymentDifference: number; missingDocumentCount: number }) {
  return control.unreconciledCashCount === 0 && control.otherReferenceCount === 0 && control.receiptDifference === 0 && control.paymentDifference === 0 && control.missingDocumentCount === 0;
}

export async function getAccountingPeriodOverview(periodKey: string) {
  const { start, end } = getPeriodBounds(periodKey);
  const [period, actions, matterRows, revenueRows, expenseRows, cashRows] = await Promise.all([
    getPeriodByKey(periodKey),
    (async () => {
      const current = await getPeriodByKey(periodKey);
      const db = await getDb();
      if (!current || !db) return [];
      return db.select({
        id: accountingPeriodActions.id,
        action: accountingPeriodActions.action,
        reason: accountingPeriodActions.reason,
        actorId: accountingPeriodActions.actorId,
        actorName: users.name,
        createdAt: accountingPeriodActions.createdAt,
      }).from(accountingPeriodActions).leftJoin(users, eq(accountingPeriodActions.actorId, users.id)).where(eq(accountingPeriodActions.periodId, current.id)).orderBy(desc(accountingPeriodActions.createdAt));
    })(),
    listMatters(), listRevenues(), listExpenses(), listCashTransactions(),
  ]);
  const metrics = calculateDashboardMetrics({ matterRows, revenueRows, expenseRows, cashRows }, start, end);
  const cashInPeriod = cashRows.filter(row => row.transactionDate >= start && row.transactionDate <= end);
  const control = {
    ...metrics.reconciliation,
    missingDocumentCount: cashInPeriod.filter(row => !row.documentNumber).length,
  };
  return {
    period: period ?? { id: null, periodKey, status: "open" as AccountingPeriodStatus, requestedBy: null, requestedAt: null, approvedBy: null, approvedAt: null, lockedBy: null, lockedAt: null, note: null },
    actions,
    control: { ...control, isReadyForApproval: isPeriodReady(control) },
  };
}

async function recordPeriodAction(periodId: number, action: PeriodAction, actorId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(accountingPeriodActions).values({ periodId, action, actorId, reason: reason || null });
}

export async function requestPeriodApproval(periodKey: string, actorId: number, note?: string) {
  const overview = await getAccountingPeriodOverview(periodKey);
  if (!overview.control.isReadyForApproval) throw new Error("Không thể gửi phê duyệt khi kỳ còn giao dịch chưa đối chiếu, chưa phân loại, thiếu số chứng từ hoặc chênh lệch liên sổ.");
  const period = await ensurePeriod(periodKey);
  if (period.status !== "open" && period.status !== "rejected") throw new Error("Kỳ này không ở trạng thái có thể gửi phê duyệt.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(accountingPeriods).set({ status: "pending_approval", requestedBy: actorId, requestedAt: new Date(), note: note || null }).where(eq(accountingPeriods.id, period.id));
  await recordPeriodAction(period.id, "request", actorId, note);
  return getAccountingPeriodOverview(periodKey);
}

export async function approvePeriod(periodKey: string, actorId: number, note?: string) {
  const period = await getPeriodByKey(periodKey);
  if (!period || period.status !== "pending_approval") throw new Error("Kỳ này chưa ở trạng thái chờ phê duyệt.");
  if (period.requestedBy === actorId) throw new Error("Người tạo yêu cầu không được tự phê duyệt kỳ kế toán.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(accountingPeriods).set({ status: "approved", approvedBy: actorId, approvedAt: new Date(), note: note || period.note }).where(eq(accountingPeriods.id, period.id));
  await recordPeriodAction(period.id, "approve", actorId, note);
  return getAccountingPeriodOverview(periodKey);
}

export async function rejectPeriod(periodKey: string, actorId: number, reason: string) {
  const period = await getPeriodByKey(periodKey);
  if (!period || period.status !== "pending_approval") throw new Error("Kỳ này chưa ở trạng thái chờ phê duyệt.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(accountingPeriods).set({ status: "rejected", note: reason }).where(eq(accountingPeriods.id, period.id));
  await recordPeriodAction(period.id, "reject", actorId, reason);
  return getAccountingPeriodOverview(periodKey);
}

export async function lockPeriod(periodKey: string, actorId: number, note?: string) {
  const period = await getPeriodByKey(periodKey);
  if (!period || period.status !== "approved") throw new Error("Chỉ kỳ đã phê duyệt mới được khóa sổ.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(accountingPeriods).set({ status: "locked", lockedBy: actorId, lockedAt: new Date(), note: note || period.note }).where(eq(accountingPeriods.id, period.id));
  await recordPeriodAction(period.id, "lock", actorId, note);
  return getAccountingPeriodOverview(periodKey);
}

export async function reopenPeriod(periodKey: string, actorId: number, reason: string) {
  const period = await getPeriodByKey(periodKey);
  if (!period || period.status !== "locked") throw new Error("Chỉ kỳ đã khóa mới được mở lại.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(accountingPeriods).set({ status: "open", note: reason }).where(eq(accountingPeriods.id, period.id));
  await recordPeriodAction(period.id, "reopen", actorId, reason);
  return getAccountingPeriodOverview(periodKey);
}

export async function listMatters() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: legalMatters.id,
      code: legalMatters.code,
      title: legalMatters.title,
      serviceType: legalMatters.serviceType,
      lawyerName: legalMatters.lawyerName,
      contractNumber: legalMatters.contractNumber,
      contractDate: legalMatters.contractDate,
      contractValue: legalMatters.contractValue,
      status: legalMatters.status,
      notes: legalMatters.notes,
      clientName: clients.name,
      clientTaxCode: clients.taxCode,
      clientId: clients.id,
      updatedAt: legalMatters.updatedAt,
    })
    .from(legalMatters)
    .innerJoin(clients, eq(legalMatters.clientId, clients.id))
    .orderBy(desc(legalMatters.updatedAt));
}

export async function createMatter(input: {
  code: string;
  title: string;
  clientName: string;
  clientTaxCode?: string;
  serviceType: string;
  lawyerName: string;
  contractNumber?: string;
  contractDate?: Date;
  contractValue: number;
  status: "draft" | "active" | "on_hold" | "completed" | "closed";
  notes?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(clients).where(eq(clients.name, input.clientName)).limit(1);
  let clientId = existing[0]?.id;
  if (!clientId) {
    await db.insert(clients).values({ name: input.clientName, taxCode: input.clientTaxCode || null });
    const createdClient = await db.select().from(clients).where(eq(clients.name, input.clientName)).limit(1);
    clientId = createdClient[0]?.id;
  }
  if (!clientId) throw new Error("Không thể tạo khách hàng");
  await db.insert(legalMatters).values({
    code: input.code,
    title: input.title,
    clientId,
    serviceType: input.serviceType,
    lawyerName: input.lawyerName,
    contractNumber: input.contractNumber || null,
    contractDate: input.contractDate ?? null,
    contractValue: input.contractValue.toFixed(2),
    status: input.status,
    notes: input.notes || null,
    createdBy: input.createdBy,
  });
  return { success: true };
}

export async function updateMatter(id: number, input: Partial<{
  title: string; serviceType: string; lawyerName: string; contractNumber: string; contractDate: Date | null;
  contractValue: number; status: "draft" | "active" | "on_hold" | "completed" | "closed"; notes: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { contractValue, ...rest } = input;
  await db.update(legalMatters).set({
    ...rest,
    ...(contractValue !== undefined ? { contractValue: contractValue.toFixed(2) } : {}),
  }).where(eq(legalMatters.id, id));
}

export async function listRevenues() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: revenues.id, matterId: revenues.matterId, invoiceNumber: revenues.invoiceNumber, invoiceDate: revenues.invoiceDate,
    serviceDate: revenues.serviceDate, accountCode: revenues.accountCode, category: revenues.category,
    amountBeforeTax: revenues.amountBeforeTax, vatRate: revenues.vatRate,
    vatOutput: revenues.vatOutput, totalAmount: revenues.totalAmount, collectedAmount: revenues.collectedAmount,
    dueDate: revenues.dueDate, status: revenues.status, notes: revenues.notes, matterCode: legalMatters.code,
    matterTitle: legalMatters.title, clientName: clients.name, updatedAt: revenues.updatedAt,
  }).from(revenues)
    .leftJoin(legalMatters, eq(revenues.matterId, legalMatters.id))
    .leftJoin(clients, eq(legalMatters.clientId, clients.id))
    .orderBy(desc(revenues.serviceDate));
}

function revenueStatus(total: number, collected: number, dueDate?: Date | null) {
  if (collected >= total && total > 0) return "collected" as const;
  if (collected > 0) return "partial" as const;
  if (dueDate && dueDate.getTime() < Date.now()) return "overdue" as const;
  return "issued" as const;
}

export async function createRevenue(input: {
  matterId?: number | null; invoiceNumber?: string; invoiceDate?: Date | null; serviceDate: Date;
  accountCode: string; category: string; amountBeforeTax: number; vatRate: number; collectedAmount: number; dueDate?: Date | null; notes?: string; createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertPeriodMutable(input.serviceDate);
  const vatOutput = input.amountBeforeTax * input.vatRate;
  const totalAmount = input.amountBeforeTax + vatOutput;
  await db.insert(revenues).values({
    matterId: input.matterId ?? null, invoiceNumber: input.invoiceNumber || null, invoiceDate: input.invoiceDate ?? null,
    serviceDate: input.serviceDate, accountCode: input.accountCode, category: input.category,
    amountBeforeTax: input.amountBeforeTax.toFixed(2), vatRate: input.vatRate.toFixed(4),
    vatOutput: vatOutput.toFixed(2), totalAmount: totalAmount.toFixed(2), collectedAmount: input.collectedAmount.toFixed(2),
    dueDate: input.dueDate ?? null, status: revenueStatus(totalAmount, input.collectedAmount, input.dueDate),
    notes: input.notes || null, createdBy: input.createdBy,
  });
  return { success: true };
}

export async function updateRevenue(id: number, input: Partial<{
  matterId: number | null; invoiceNumber: string; invoiceDate: Date | null; serviceDate: Date; amountBeforeTax: number;
  accountCode: string; category: string; vatRate: number; collectedAmount: number; dueDate: Date | null; notes: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(revenues).where(eq(revenues.id, id)).limit(1);
  if (!current[0]) throw new Error("Không tìm thấy dòng doanh thu");
  await assertPeriodMutable(current[0].serviceDate);
  if (input.serviceDate) await assertPeriodMutable(input.serviceDate);
  const amountBeforeTax = input.amountBeforeTax ?? Number(current[0].amountBeforeTax);
  const vatRate = input.vatRate ?? Number(current[0].vatRate);
  const totalAmount = amountBeforeTax * (1 + vatRate);
  const collectedAmount = input.collectedAmount ?? Number(current[0].collectedAmount);
  const dueDate = input.dueDate ?? current[0].dueDate;
  await db.update(revenues).set({
    ...input,
    amountBeforeTax: amountBeforeTax.toFixed(2), vatRate: vatRate.toFixed(4), vatOutput: (amountBeforeTax * vatRate).toFixed(2),
    totalAmount: totalAmount.toFixed(2), collectedAmount: collectedAmount.toFixed(2), status: revenueStatus(totalAmount, collectedAmount, dueDate),
  }).where(eq(revenues.id, id));
}

export async function listExpenses() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: expenses.id, matterId: expenses.matterId, supplierName: expenses.supplierName, category: expenses.category,
    accountCode: expenses.accountCode, categoryCode: expenses.categoryCode,
    expenseDate: expenses.expenseDate, invoiceNumber: expenses.invoiceNumber, invoiceDate: expenses.invoiceDate,
    amountBeforeTax: expenses.amountBeforeTax, vatRate: expenses.vatRate, vatInput: expenses.vatInput,
    totalAmount: expenses.totalAmount, paidAmount: expenses.paidAmount, dueDate: expenses.dueDate,
    paymentStatus: expenses.paymentStatus, deductibility: expenses.deductibility, notes: expenses.notes,
    matterCode: legalMatters.code, matterTitle: legalMatters.title, updatedAt: expenses.updatedAt,
  }).from(expenses).leftJoin(legalMatters, eq(expenses.matterId, legalMatters.id)).orderBy(desc(expenses.expenseDate));
}

function expenseStatus(total: number, paid: number) {
  if (paid >= total && total > 0) return "paid" as const;
  if (paid > 0) return "partial" as const;
  return "unpaid" as const;
}

export async function createExpense(input: {
  matterId?: number | null; supplierName: string; category: string; expenseDate: Date; invoiceNumber?: string;
  accountCode: string; categoryCode: string; invoiceDate?: Date | null; amountBeforeTax: number; vatRate: number; paidAmount: number; dueDate?: Date | null;
  deductibility: "deductible" | "non_deductible" | "pending"; notes?: string; createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertPeriodMutable(input.expenseDate);
  const vatInput = input.amountBeforeTax * input.vatRate;
  const totalAmount = input.amountBeforeTax + vatInput;
  await db.insert(expenses).values({
    matterId: input.matterId ?? null, supplierName: input.supplierName, category: input.category, accountCode: input.accountCode,
    categoryCode: input.categoryCode, expenseDate: input.expenseDate,
    invoiceNumber: input.invoiceNumber || null, invoiceDate: input.invoiceDate ?? null, amountBeforeTax: input.amountBeforeTax.toFixed(2),
    vatRate: input.vatRate.toFixed(4), vatInput: vatInput.toFixed(2), totalAmount: totalAmount.toFixed(2),
    paidAmount: input.paidAmount.toFixed(2), dueDate: input.dueDate ?? null, paymentStatus: expenseStatus(totalAmount, input.paidAmount),
    deductibility: input.deductibility, notes: input.notes || null, createdBy: input.createdBy,
  });
  return { success: true };
}

export async function updateExpense(id: number, input: Partial<{
  matterId: number | null; supplierName: string; category: string; expenseDate: Date; invoiceNumber: string; invoiceDate: Date | null;
  accountCode: string; categoryCode: string; amountBeforeTax: number; vatRate: number; paidAmount: number; dueDate: Date | null;
  deductibility: "deductible" | "non_deductible" | "pending"; notes: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  if (!current[0]) throw new Error("Không tìm thấy dòng chi phí");
  await assertPeriodMutable(current[0].expenseDate);
  if (input.expenseDate) await assertPeriodMutable(input.expenseDate);
  const amountBeforeTax = input.amountBeforeTax ?? Number(current[0].amountBeforeTax);
  const vatRate = input.vatRate ?? Number(current[0].vatRate);
  const totalAmount = amountBeforeTax * (1 + vatRate);
  const paidAmount = input.paidAmount ?? Number(current[0].paidAmount);
  await db.update(expenses).set({
    ...input,
    amountBeforeTax: amountBeforeTax.toFixed(2), vatRate: vatRate.toFixed(4), vatInput: (amountBeforeTax * vatRate).toFixed(2),
    totalAmount: totalAmount.toFixed(2), paidAmount: paidAmount.toFixed(2), paymentStatus: expenseStatus(totalAmount, paidAmount),
  }).where(eq(expenses.id, id));
}

export async function listCashTransactions() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: cashTransactions.id, transactionDate: cashTransactions.transactionDate, type: cashTransactions.type,
    amount: cashTransactions.amount, paymentMethod: cashTransactions.paymentMethod, accountCode: cashTransactions.accountCode,
    category: cashTransactions.category, referenceType: cashTransactions.referenceType,
    referenceId: cashTransactions.referenceId, matterId: cashTransactions.matterId, documentNumber: cashTransactions.documentNumber,
    description: cashTransactions.description, reconciled: cashTransactions.reconciled, matterCode: legalMatters.code,
    matterTitle: legalMatters.title, updatedAt: cashTransactions.updatedAt,
  }).from(cashTransactions).leftJoin(legalMatters, eq(cashTransactions.matterId, legalMatters.id)).orderBy(desc(cashTransactions.transactionDate));
}

export async function createCashTransaction(input: {
  transactionDate: Date; type: "receipt" | "payment"; amount: number;
  paymentMethod: "bank" | "cash" | "transfer" | "other"; accountCode: string; category: string;
  referenceType: "revenue" | "expense" | "other";
  referenceId?: number | null; matterId?: number | null; documentNumber?: string; description: string; reconciled: boolean; createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertPeriodMutable(input.transactionDate);
  await db.insert(cashTransactions).values({
    ...input, amount: input.amount.toFixed(2), referenceId: input.referenceId ?? null, matterId: input.matterId ?? null,
    documentNumber: input.documentNumber || null,
  });
  return { success: true };
}

export async function updateCashTransaction(id: number, input: Partial<{
  transactionDate: Date; type: "receipt" | "payment"; amount: number;
  paymentMethod: "bank" | "cash" | "transfer" | "other"; accountCode: string; category: string;
  referenceType: "revenue" | "expense" | "other"; referenceId: number | null; matterId: number | null;
  documentNumber: string; description: string; reconciled: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(cashTransactions).where(eq(cashTransactions.id, id)).limit(1);
  if (!current[0]) throw new Error("Không tìm thấy giao dịch thu–chi");
  await assertPeriodMutable(current[0].transactionDate);
  if (input.transactionDate) await assertPeriodMutable(input.transactionDate);
  const { amount, documentNumber, ...rest } = input;
  await db.update(cashTransactions).set({
    ...rest,
    ...(amount !== undefined ? { amount: amount.toFixed(2) } : {}),
    ...(documentNumber !== undefined ? { documentNumber: documentNumber || null } : {}),
  }).where(eq(cashTransactions.id, id));
  return { success: true };
}

export async function getCashTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ id: cashTransactions.id, transactionDate: cashTransactions.transactionDate }).from(cashTransactions).where(eq(cashTransactions.id, id)).limit(1);
  return rows[0];
}

export async function listCashAttachments(cashTransactionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: cashAttachments.id,
    originalFileName: cashAttachments.originalFileName,
    contentType: cashAttachments.contentType,
    storageUrl: cashAttachments.storageUrl,
    fileSize: cashAttachments.fileSize,
    createdAt: cashAttachments.createdAt,
  }).from(cashAttachments).where(eq(cashAttachments.cashTransactionId, cashTransactionId)).orderBy(desc(cashAttachments.createdAt));
}

export async function createCashAttachment(input: {
  cashTransactionId: number;
  originalFileName: string;
  contentType: string;
  storageKey: string;
  storageUrl: string;
  fileSize: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const transaction = await getCashTransactionById(input.cashTransactionId);
  if (!transaction) throw new Error("Không tìm thấy giao dịch thu–chi");
  await assertPeriodMutable(transaction.transactionDate);
  await db.insert(cashAttachments).values(input);
  return { success: true };
}

type DashboardSource = {
  matterRows: Array<{ status: string }>;
  revenueRows: Array<{ status: string; serviceDate: Date; updatedAt: Date; amountBeforeTax: string | number; totalAmount: string | number; collectedAmount: string | number }>;
  expenseRows: Array<{ expenseDate: Date; updatedAt: Date; amountBeforeTax: string | number; totalAmount: string | number; paidAmount: string | number }>;
  cashRows: Array<{ transactionDate: Date; updatedAt: Date; type: "receipt" | "payment"; amount: string | number; referenceType?: "revenue" | "expense" | "other"; reconciled?: boolean }>;
};

export function calculateDashboardMetrics(source: DashboardSource, start?: Date, end?: Date) {
  const { matterRows, revenueRows, expenseRows, cashRows } = source;
  const inRange = (date: Date | null, fallback: Date) => {
    const value = date ?? fallback;
    return (!start || value >= start) && (!end || value <= end);
  };
  const selectedRevenues = revenueRows.filter(row => row.status !== "void" && inRange(row.serviceDate, row.updatedAt));
  const selectedExpenses = expenseRows.filter(row => inRange(row.expenseDate, row.updatedAt));
  const selectedCash = cashRows.filter(row => inRange(row.transactionDate, row.updatedAt));
  const sum = <T>(rows: T[], getValue: (row: T) => number) => rows.reduce((total, row) => total + getValue(row), 0);
  const totalRevenue = sum(selectedRevenues, row => Number(row.amountBeforeTax));
  const receivable = sum(selectedRevenues, row => Math.max(0, Number(row.totalAmount) - Number(row.collectedAmount)));
  const payable = sum(selectedExpenses, row => Math.max(0, Number(row.totalAmount) - Number(row.paidAmount)));
  const actualReceipts = sum(selectedCash.filter(row => row.type === "receipt"), row => Number(row.amount));
  const actualPayments = sum(selectedCash.filter(row => row.type === "payment"), row => Number(row.amount));
  const totalExpenses = sum(selectedExpenses, row => Number(row.amountBeforeTax));
  const declaredReceipts = sum(selectedRevenues, row => Number(row.collectedAmount));
  const declaredPayments = sum(selectedExpenses, row => Number(row.paidAmount));
  const monthly = new Map<string, { month: string; revenue: number; expense: number; cashFlow: number }>();
  const registerMonth = (date: Date, key: "revenue" | "expense" | "cashFlow", amount: number) => {
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = monthly.get(month) ?? { month, revenue: 0, expense: 0, cashFlow: 0 };
    current[key] += amount;
    monthly.set(month, current);
  };
  selectedRevenues.forEach(row => registerMonth(row.serviceDate, "revenue", Number(row.amountBeforeTax)));
  selectedExpenses.forEach(row => registerMonth(row.expenseDate, "expense", Number(row.amountBeforeTax)));
  selectedCash.forEach(row => registerMonth(row.transactionDate, "cashFlow", row.type === "receipt" ? Number(row.amount) : -Number(row.amount)));
  return {
    kpis: { totalRevenue, actualReceipts, actualPayments, cashBalance: actualReceipts - actualPayments, profit: totalRevenue - totalExpenses, receivable, payable },
    reconciliation: {
      declaredReceipts,
      cashReceipts: actualReceipts,
      receiptDifference: actualReceipts - declaredReceipts,
      declaredPayments,
      cashPayments: actualPayments,
      paymentDifference: actualPayments - declaredPayments,
      otherReferenceCount: selectedCash.filter(row => row.referenceType === "other").length,
      unreconciledCashCount: selectedCash.filter(row => !row.reconciled).length,
    },
    monthly: Array.from(monthly.values()).sort((a, b) => a.month.localeCompare(b.month)),
    counts: { matters: matterRows.length, activeMatters: matterRows.filter(row => row.status === "active").length, overdueRevenue: revenueRows.filter(row => row.status === "overdue").length },
  };
}

export async function getDashboardData(start?: Date, end?: Date) {
  const [matterRows, revenueRows, expenseRows, cashRows] = await Promise.all([listMatters(), listRevenues(), listExpenses(), listCashTransactions()]);
  return calculateDashboardMetrics({ matterRows, revenueRows, expenseRows, cashRows }, start, end);
}

export async function getReconciliationReport(periodKey: string) {
  const { start, end } = getPeriodBounds(periodKey);
  const [overview, cashRows] = await Promise.all([getAccountingPeriodOverview(periodKey), listCashTransactions()]);
  const scopedRows = cashRows.filter(row => row.transactionDate >= start && row.transactionDate <= end);
  const rows = await Promise.all(scopedRows.map(async row => ({
    ...row,
    attachmentCount: (await listCashAttachments(row.id)).length,
  })));
  return {
    periodKey,
    status: overview.period.status,
    control: overview.control,
    rows,
  };
}

function stableStringify(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

async function buildApprovalSnapshot(periodKey: string) {
  const [overview, reconciliation] = await Promise.all([getAccountingPeriodOverview(periodKey), getReconciliationReport(periodKey)]);
  const snapshot = {
    schemaVersion: 1,
    periodKey,
    periodStatus: overview.period.status,
    lockedAt: overview.period.lockedAt,
    control: reconciliation.control,
    rows: reconciliation.rows.map(row => ({
      id: row.id,
      transactionDate: row.transactionDate,
      type: row.type,
      amount: String(row.amount),
      documentNumber: row.documentNumber,
      description: row.description,
      referenceType: row.referenceType,
      reconciled: row.reconciled,
      attachmentCount: row.attachmentCount,
      updatedAt: row.updatedAt,
    })),
  };
  const snapshotJson = stableStringify(snapshot);
  return { snapshotJson, reportHash: createHash("sha256").update(snapshotJson).digest("hex") };
}

async function getLatestReportApproval(periodId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(reportApprovalRequests).where(eq(reportApprovalRequests.periodId, periodId)).orderBy(desc(reportApprovalRequests.requestedAt)).limit(1);
  return rows[0];
}

async function getPeriodKeyById(periodId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ periodKey: accountingPeriods.periodKey }).from(accountingPeriods).where(eq(accountingPeriods.id, periodId)).limit(1);
  if (!rows[0]) throw new Error("Không tìm thấy kỳ kế toán của yêu cầu.");
  return rows[0].periodKey;
}

async function recordReportApprovalAction(requestId: number, action: ReportApprovalAction, actorId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(reportApprovalActions).values({ requestId, action, actorId, reason: reason || null });
}

export async function getReportApprovalOverview(periodKey: string) {
  const period = await getPeriodByKey(periodKey);
  if (!period) return { period: { periodKey, status: "open" as AccountingPeriodStatus }, report: null, actions: [] };
  const [report, db] = await Promise.all([getLatestReportApproval(period.id), getDb()]);
  if (!report || !db) return { period, report: null, actions: [] };
  const actions = await db.select({
    id: reportApprovalActions.id,
    action: reportApprovalActions.action,
    reason: reportApprovalActions.reason,
    actorId: reportApprovalActions.actorId,
    actorName: users.name,
    createdAt: reportApprovalActions.createdAt,
  }).from(reportApprovalActions).leftJoin(users, eq(reportApprovalActions.actorId, users.id)).where(eq(reportApprovalActions.requestId, report.id)).orderBy(asc(reportApprovalActions.createdAt));
  return { period, report, actions };
}

export async function requestReportApproval(periodKey: string, actorId: number, note?: string) {
  const period = await getPeriodByKey(periodKey);
  if (!period || period.status !== "locked") throw new Error("Chỉ báo cáo của kỳ đã khóa sổ mới được gửi phê duyệt hai cấp.");
  const existing = await getLatestReportApproval(period.id);
  if (existing && ["pending_level_1", "pending_level_2"].includes(existing.status)) throw new Error("Báo cáo của kỳ này đang trong quy trình phê duyệt.");
  const snapshot = await buildApprovalSnapshot(periodKey);
  if (existing?.status === "internally_attested" && existing.reportHash === snapshot.reportHash) throw new Error("Phiên bản báo cáo hiện tại đã được xác nhận nội bộ đủ hai cấp.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(reportApprovalRequests).values({ periodId: period.id, reportHash: snapshot.reportHash, snapshotJson: snapshot.snapshotJson, status: "pending_level_1", requestedBy: actorId, note: note || null });
  const created = await getLatestReportApproval(period.id);
  if (!created) throw new Error("Không thể tạo yêu cầu phê duyệt báo cáo.");
  await recordReportApprovalAction(created.id, "request", actorId, note);
  return getReportApprovalOverview(periodKey);
}

export async function approveReportLevelOne(requestId: number, actorId: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = (await db.select().from(reportApprovalRequests).where(eq(reportApprovalRequests.id, requestId)).limit(1))[0];
  if (!current || current.status !== "pending_level_1") throw new Error("Yêu cầu không ở trạng thái chờ phê duyệt cấp 1.");
  if (current.requestedBy === actorId) throw new Error("Người lập báo cáo không được tự phê duyệt cấp 1.");
  await db.update(reportApprovalRequests).set({ status: "pending_level_2", levelOneBy: actorId, levelOneAt: new Date(), note: note || current.note }).where(eq(reportApprovalRequests.id, current.id));
  await recordReportApprovalAction(current.id, "approve_level_1", actorId, note);
  return getReportApprovalOverview(await getPeriodKeyById(current.periodId));
}

export async function approveReportLevelTwo(requestId: number, actorId: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = (await db.select().from(reportApprovalRequests).where(eq(reportApprovalRequests.id, requestId)).limit(1))[0];
  if (!current || current.status !== "pending_level_2") throw new Error("Yêu cầu không ở trạng thái chờ phê duyệt cấp 2.");
  if (current.requestedBy === actorId || current.levelOneBy === actorId) throw new Error("Người lập và người phê duyệt cấp 1 không được tự phê duyệt cấp 2.");
  await db.update(reportApprovalRequests).set({ status: "internally_attested", levelTwoBy: actorId, levelTwoAt: new Date(), note: note || current.note }).where(eq(reportApprovalRequests.id, current.id));
  await recordReportApprovalAction(current.id, "approve_level_2", actorId, note);
  return getReportApprovalOverview(await getPeriodKeyById(current.periodId));
}

export async function rejectReportApproval(requestId: number, actorId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = (await db.select().from(reportApprovalRequests).where(eq(reportApprovalRequests.id, requestId)).limit(1))[0];
  if (!current || !["pending_level_1", "pending_level_2"].includes(current.status)) throw new Error("Yêu cầu không ở trạng thái có thể từ chối.");
  if (current.requestedBy === actorId) throw new Error("Người lập báo cáo không được tự từ chối yêu cầu của mình.");
  if (current.status === "pending_level_2" && current.levelOneBy === actorId) throw new Error("Người đã phê duyệt cấp 1 không được từ chối ở cấp 2.");
  await db.update(reportApprovalRequests).set({ status: "rejected", rejectedBy: actorId, rejectedAt: new Date(), rejectionReason: reason }).where(eq(reportApprovalRequests.id, current.id));
  await recordReportApprovalAction(current.id, "reject", actorId, reason);
  return getReportApprovalOverview(await getPeriodKeyById(current.periodId));
}

export async function deleteById(table: "matter" | "revenue" | "expense" | "cash", id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (table === "matter") return db.delete(legalMatters).where(eq(legalMatters.id, id));
  if (table === "revenue") {
    const current = await db.select({ serviceDate: revenues.serviceDate }).from(revenues).where(eq(revenues.id, id)).limit(1);
    if (current[0]) await assertPeriodMutable(current[0].serviceDate);
    return db.delete(revenues).where(eq(revenues.id, id));
  }
  if (table === "expense") {
    const current = await db.select({ expenseDate: expenses.expenseDate }).from(expenses).where(eq(expenses.id, id)).limit(1);
    if (current[0]) await assertPeriodMutable(current[0].expenseDate);
    return db.delete(expenses).where(eq(expenses.id, id));
  }
  const current = await db.select({ transactionDate: cashTransactions.transactionDate }).from(cashTransactions).where(eq(cashTransactions.id, id)).limit(1);
  if (current[0]) await assertPeriodMutable(current[0].transactionDate);
  return db.delete(cashTransactions).where(eq(cashTransactions.id, id));
}
