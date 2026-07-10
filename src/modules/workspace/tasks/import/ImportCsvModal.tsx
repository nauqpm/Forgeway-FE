"use client";

import { useState, useRef } from "react";
import { Upload, X, FileDown, CheckCircle2, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Workspace } from "@/modules/workspace/shared/types/workspace.type";
import {
  previewCsvImport,
  confirmCsvImport,
  downloadCsvTemplate,
  ImportCsvPreviewResponse,
  ImportBulkResult
} from "@/modules/workspace/shared/services/taskCsvImport.service";
import toast from "react-hot-toast";

type ImportCsvModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  onSuccess?: () => void;
};

type Step = "upload" | "preview" | "result";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function ImportCsvModal({ isOpen, onClose, workspace, onSuccess }: ImportCsvModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [isLoading, setIsLoading] = useState(false);
  
  const [previewData, setPreviewData] = useState<ImportCsvPreviewResponse | null>(null);
  const [resultData, setResultData] = useState<ImportBulkResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep("upload");
    setPreviewData(null);
    setResultData(null);
    setIsLoading(false);
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File quá lớn. Vui lòng upload file <= 2MB.");
      return;
    }

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && file.type !== 'text/csv' && !file.type.includes('excel') && !file.type.includes('spreadsheetml')) {
      toast.error("Vui lòng upload file định dạng CSV hoặc Excel.");
      return;
    }

    try {
      setIsLoading(true);
      const data = await previewCsvImport(workspace._id, file);
      setPreviewData(data);
      setStep("preview");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi đọc file CSV/Excel.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirm = async () => {
    if (!previewData?.sessionToken) return;

    try {
      setIsLoading(true);
      const result = await confirmCsvImport(workspace._id, previewData.sessionToken);
      setResultData(result);
      setStep("result");
      
      if (result.created > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi tạo issues.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100000] p-4">
      <div
        className="bg-white dark:bg-[#202020] rounded-[10px] w-full max-w-4xl border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden flex flex-col max-h-[90vh]"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#EAEAEA] dark:border-white/[0.06] shrink-0">
          <h3 className="text-[1rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
            {step === "upload" && "Import issues từ CSV / Excel"}
            {step === "preview" && "Xem trước dữ liệu Import"}
            {step === "result" && "Kết quả Import"}
          </h3>
          <button
            onClick={handleClose}
            className="text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto min-h-[300px]">
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center py-10">
              <div 
                className="w-full max-w-lg border-2 border-dashed border-[#EAEAEA] dark:border-white/[0.1] rounded-[8px] flex flex-col items-center justify-center p-12 bg-[#FAFAFA] dark:bg-[#252525] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {isLoading ? (
                  <Loader2 className="w-10 h-10 text-[#2563EB] animate-spin mb-4" />
                ) : (
                  <Upload className="w-10 h-10 text-[#ABABAB] mb-4" />
                )}
                
                <h4 className="text-[0.9375rem] font-medium text-[#111111] dark:text-[#E8E8E7] mb-1">
                  {isLoading ? "Đang xử lý..." : "Click hoặc kéo thả file CSV/Excel vào đây"}
                </h4>
                <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                  Hỗ trợ file .csv, .xlsx, .xls (Tối đa 2MB, &le; 200 dòng)
                </p>
                <input 
                  type="file" 
                  accept=".csv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  disabled={isLoading}
                />
              </div>

              <div className="mt-8 flex flex-col items-center gap-2">
                <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                  Chưa có file mẫu? Tải file template với định dạng chuẩn (UTF-8).
                </p>
                <button
                  onClick={downloadCsvTemplate}
                  className="flex items-center gap-2 text-[0.8125rem] font-medium text-[#2563EB] dark:text-[#3B82F6] hover:underline"
                >
                  <FileDown className="w-4 h-4" />
                  Tải CSV Template
                </button>
              </div>
            </div>
          )}

          {step === "preview" && previewData && (
            <div className="flex flex-col h-full">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-[#F5F5F5] dark:bg-[#2A2A2A] rounded-[8px] p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="text-[1.25rem] font-bold text-[#111111] dark:text-[#E8E8E7]">
                      {previewData.validCount}
                    </div>
                    <div className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">Hợp lệ (Sẽ được tạo)</div>
                  </div>
                </div>
                
                <div className="flex-1 bg-[#FFF8E6] dark:bg-[#332C1A] rounded-[8px] p-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <div className="text-[1.25rem] font-bold text-[#111111] dark:text-[#E8E8E7]">
                      {previewData.warningCount}
                    </div>
                    <div className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">Cảnh báo</div>
                  </div>
                </div>

                <div className="flex-1 bg-[#FDF5F4] dark:bg-[#382323] rounded-[8px] p-4 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <div className="text-[1.25rem] font-bold text-[#111111] dark:text-[#E8E8E7]">
                      {previewData.errorCount}
                    </div>
                    <div className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">Lỗi (Bị bỏ qua)</div>
                  </div>
                </div>
              </div>

              <div className="border border-[#EAEAEA] dark:border-white/[0.08] rounded-[8px] overflow-hidden flex-1 overflow-y-auto">
                <table className="w-full text-left text-[0.8125rem]">
                  <thead className="bg-[#FAFAFA] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97] sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-medium border-b border-[#EAEAEA] dark:border-white/[0.08] w-[60px]">Dòng</th>
                      <th className="px-4 py-3 font-medium border-b border-[#EAEAEA] dark:border-white/[0.08]">Tiêu đề</th>
                      <th className="px-4 py-3 font-medium border-b border-[#EAEAEA] dark:border-white/[0.08] w-[100px]">Trạng thái</th>
                      <th className="px-4 py-3 font-medium border-b border-[#EAEAEA] dark:border-white/[0.08]">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA] dark:divide-white/[0.04]">
                    {previewData.rows.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={`
                          ${row.status === 'error' ? 'bg-[#FDF5F4]/50 dark:bg-[#382323]/30' : ''}
                          ${row.status === 'warning' ? 'bg-[#FFF8E6]/50 dark:bg-[#332C1A]/30' : ''}
                        `}
                      >
                        <td className="px-4 py-3 text-[#787774] dark:text-[#9B9A97]">{row.rowIndex}</td>
                        <td className="px-4 py-3 text-[#111111] dark:text-[#E8E8E7] font-medium truncate max-w-[250px]" title={row.title}>
                          {row.title || <span className="text-red-500 italic">Trống</span>}
                        </td>
                        <td className="px-4 py-3">
                          {row.status === 'valid' && <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.75rem] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Hợp lệ</span>}
                          {row.status === 'warning' && <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.75rem] font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Cảnh báo</span>}
                          {row.status === 'error' && <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.75rem] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Lỗi</span>}
                        </td>
                        <td className="px-4 py-3 text-[#787774] dark:text-[#9B9A97]">
                          {row.status === 'valid' && <span className="text-green-600 dark:text-green-400">OK</span>}
                          {row.errors.length > 0 && (
                            <ul className="list-disc list-inside text-red-600 dark:text-red-400 mb-1">
                              {row.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                          )}
                          {row.warnings.length > 0 && (
                            <ul className="list-disc list-inside text-yellow-600 dark:text-yellow-400">
                              {row.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === "result" && resultData && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-[1.25rem] font-bold text-[#111111] dark:text-[#E8E8E7] mb-2">
                Import hoàn tất
              </h3>
              <p className="text-[0.9375rem] text-[#787774] dark:text-[#9B9A97] mb-8">
                Đã tạo thành công <strong className="text-[#111111] dark:text-[#E8E8E7]">{resultData.created}</strong> issues.
                {resultData.failed > 0 && ` Có ${resultData.failed} issues thất bại.`}
              </p>

              {resultData.failed > 0 && (
                <div className="w-full max-w-lg bg-[#FDF5F4] dark:bg-[#382323] border border-red-200 dark:border-red-900/50 rounded-[8px] p-4 text-left">
                  <h4 className="text-[0.875rem] font-semibold text-red-800 dark:text-red-400 mb-2">Chi tiết lỗi:</h4>
                  <ul className="list-disc list-inside text-[0.8125rem] text-red-700 dark:text-red-300 max-h-[150px] overflow-y-auto">
                    {resultData.results.filter(r => r.status === 'failed').map((r, i) => (
                      <li key={i}>Dòng {r.rowIndex} ({r.title}): {r.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[#EAEAEA] dark:border-white/[0.06] flex justify-end gap-3 shrink-0">
          {step !== "result" && (
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] text-[#111111] dark:text-[#E8E8E7] rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
          )}
          
          {step === "preview" && (
            <button
              onClick={handleConfirm}
              disabled={isLoading || previewData?.validCount === 0}
              className="px-4 py-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Xác nhận tạo {previewData?.validCount || 0} issues
            </button>
          )}

          {step === "result" && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
