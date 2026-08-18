import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ExternalLink, FileImage, FileText, Paperclip, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const maxBytes = 8 * 1024 * 1024;

function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc tệp chứng từ."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.readAsDataURL(file);
  });
}

export function CashAttachments({ cashTransactionId }: { cashTransactionId: number }) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  const attachments = trpc.finance.cash.attachments.list.useQuery({ cashTransactionId }, { enabled: open });
  const upload = trpc.finance.cash.attachments.upload.useMutation({
    onSuccess: () => {
      utils.finance.cash.attachments.list.invalidate({ cashTransactionId });
      toast.success("Đã đính kèm chứng từ vào giao dịch.");
    },
    onError: error => toast.error(error.message),
  });

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc tệp PDF.");
      return;
    }
    if (file.size > maxBytes) {
      toast.error("Tệp chứng từ phải nhỏ hơn hoặc bằng 8 MB.");
      return;
    }
    try {
      const dataBase64 = await readAsBase64(file);
      upload.mutate({ cashTransactionId, originalFileName: file.name, contentType: file.type as "application/pdf" | "image/jpeg" | "image/png" | "image/webp", dataBase64 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải tệp chứng từ.");
    }
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="ghost" size="sm" title="Chứng từ đính kèm"><Paperclip className="h-4 w-4" /><span className="sr-only">Chứng từ đính kèm</span></Button></DialogTrigger>
    <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Chứng từ đính kèm</DialogTitle><DialogDescription>Tải ảnh JPG, PNG, WEBP hoặc tệp PDF, tối đa 8 MB mỗi tệp.</DialogDescription></DialogHeader>
      <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-teal-300 bg-teal-50 px-4 py-4 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"><Upload className="h-4 w-4" />{upload.isPending ? "Đang tải lên..." : "Chọn tệp chứng từ"}<Input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={onFileChange} disabled={upload.isPending} /></label>
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">{attachments.isLoading ? <p className="py-5 text-center text-sm text-slate-500">Đang tải danh sách tệp...</p> : attachments.data?.length ? attachments.data.map(file => <div key={file.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><div className="rounded-lg bg-slate-100 p-2 text-slate-600">{file.contentType === "application/pdf" ? <FileText className="h-4 w-4" /> : <FileImage className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{file.originalFileName}</p><p className="mt-1 text-xs text-slate-500">{formatBytes(file.fileSize)}</p></div><a href={file.storageUrl} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Mở</Button></a></div>) : <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Giao dịch này chưa có tệp chứng từ đính kèm.</p>}</div>
      <Badge className="w-fit border-0 bg-slate-100 text-slate-600">Tệp được lưu theo từng giao dịch thu–chi</Badge>
    </DialogContent>
  </Dialog>;
}
