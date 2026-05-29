import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sprintService } from '../services/sprintService';
import { Sprint } from '../types/sprint.type';

interface CompleteSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (moveToSprintId?: string) => void;
  sprint: Sprint | null;
  sprints: Sprint[];
  workspaceId: string;
}

interface PreviewData {
  sprintId: string;
  sprintName: string;
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: number;
  incompleteTaskList: any[];
}

export default function CompleteSprintModal({
  isOpen,
  onClose,
  onConfirm,
  sprint,
  sprints,
  workspaceId,
}: CompleteSprintModalProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [moveToSprintId, setMoveToSprintId] = useState<string>('');

  useEffect(() => {
    if (isOpen && sprint && workspaceId) {
      setLoading(true);
      setPreview(null);
      setMoveToSprintId('');
      sprintService
        .getCompleteSprintPreview(workspaceId, sprint._id)
        .then((data) => {
          setPreview(data);
        })
        .catch((err) => {
          console.error(err);
          toast.error('Lỗi khi tải thông tin xem trước sprint');
          onClose();
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, sprint, workspaceId]);

  if (!isOpen || !sprint) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(moveToSprintId || undefined);
    onClose();
  };

  const planningSprints = sprints.filter(
    (s) => s.status === 'planning' && s._id !== sprint._id
  );

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
            Hoàn thành Sprint: {sprint.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Đang tải bản xem trước sprint...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {preview && (
              <>
                <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tổng số task:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {preview.totalTasks}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Đã hoàn thành (Done):
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {preview.completedTasks}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Chưa hoàn thành:
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {preview.incompleteTasks}
                    </span>
                  </div>
                </div>

                {preview.incompleteTasks > 0 ? (
                  <div className="space-y-3">
                    <div className="flex gap-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-xs">
                        Có {preview.incompleteTasks} task chưa hoàn thành trong sprint này. Hãy
                        chọn nơi chuyển các task này đến:
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Chuyển các task chưa xong tới
                      </label>
                      <select
                        value={moveToSprintId}
                        onChange={(e) => setMoveToSprintId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="">Backlog</option>
                        {planningSprints.map((ps) => (
                          <option key={ps._id} value={ps._id}>
                            {ps.name} (Planning)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-150 dark:border-green-900 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-1 bg-green-500 rounded-full text-white">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">
                        Tuyệt vời!
                      </h4>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                        Tất cả các task trong sprint này đều đã hoàn thành.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Hoàn thành Sprint
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
