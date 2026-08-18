import type { Request, Response } from "express";
import * as db from "./db";
import { sdk } from "./_core/sdk";

export async function handleExpiredPermissionRevocation(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await db.revokeExpiredPermissions();
    return res.json({ ok: true, taskUid: user.taskUid, ...result });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      context: { path: "/api/scheduled/revoke-expired-access" },
      timestamp: new Date().toISOString(),
    });
  }
}
