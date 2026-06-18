import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { queryKeys } from '@/shared/constants/queryKeys';
import { sprintService } from '@/modules/workspace/shared/services/sprintService';
import { Sprint } from '@/modules/workspace/shared/types/sprint.type';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incompleteTaskList: any[];
}

const inputCls = "w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-[0.8125rem] outline-none transition-colors";

export default function CompleteSprintModal({
  isOpen,
  onClose,
  onConfirm,
  sprint,
  sprints,
  workspaceId,
}: CompleteSprintModalProps) {
  const [moveToSprintId, setMoveToSprintId] = useState<string>('');
  const previewQuery = useQuery<PreviewData>({
    queryKey: queryKeys.sprints.completePreview(workspaceId, sprint?._id ?? ''),
    queryFn: () => sprintService.getCompleteSprintPreview(workspaceId, sprint!._id),
    enabled: isOpen && !!sprint && !!workspaceId,
  });

  useEffect(() => {
    if (isOpen && sprint) {
      setMoveToSprintId('');
    }
  }, [isOpen, sprint]);

  useEffect(() => {
    if (!previewQuery.isError) return;
    console.error(previewQuery.error);
    toast.error('Could not load sprint preview');
    onClose();
  }, [onClose, previewQuery.error, previewQuery.isError]);

  if (!isOpen || !sprint) return null;

  const preview = previewQuery.data ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(moveToSprintId || undefined);
    onClose();
  };

  const planningSprints = sprints.filter(
    (s) => s.status === 'planning' && s._id !== sprint._id
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-[#202020] rounded-[10px] w-full max-w-lg border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
            Complete Sprint: {sprint.name}
          </h3>
          <button
            onClick={onClose}
            className="text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {previewQuery.isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
            <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">Loading sprint preview...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {preview && (
              <>
                <div className="bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[0.8125rem]">
                    <span className="text-[#787774] dark:text-[#9B9A97]">Total tasks:</span>
                    <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">{preview.totalTasks}</span>
                  </div>
                  <div className="flex items-center justify-between text-[0.8125rem]">
                    <span className="text-[#346538] dark:text-[#4ADE80] font-medium">Completed (Done):</span>
                    <span className="font-bold text-[#346538] dark:text-[#4ADE80]">{preview.completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between text-[0.8125rem]">
                    <span className="text-[#956400] dark:text-[#FBB040] font-medium">Incomplete:</span>
                    <span className="font-bold text-[#956400] dark:text-[#FBB040]">{preview.incompleteTasks}</span>
                  </div>
                </div>

                {preview.incompleteTasks > 0 ? (
                  <div className="space-y-3">
                    <div className="flex gap-2 text-[#956400] dark:text-[#FBB040]">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="text-[0.8125rem]">
                        There are {preview.incompleteTasks} incomplete tasks. Choose where to move them:
                      </p>
                    </div>
                    <div>
                      <label className="block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">
                        Move incomplete tasks to
                      </label>
                      <select
                        value={moveToSprintId}
                        onChange={(e) => setMoveToSprintId(e.target.value)}
                        className={inputCls}
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
                  <div className="bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.15)] border border-[#C3DFC1] dark:border-[rgba(52,101,56,0.3)] rounded-[8px] p-4 flex items-start gap-3">
                    <div className="p-1 bg-[#346538] rounded-full text-white flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-[0.8125rem] font-semibold text-[#346538] dark:text-[#4ADE80]">All tasks complete</h4>
                      <p className="text-[0.6875rem] text-[#346538]/80 dark:text-[#4ADE80]/70 mt-0.5">
                        All tasks in this sprint are done.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] text-[#111111] dark:text-[#E8E8E7] rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors"
                  >
                    Complete sprint
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
