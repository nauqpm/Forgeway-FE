"use client";

import { Workspace } from "@/modules/workspace/shared/types/workspace.type";
import { Modal } from "@/shared/components/ui/Modal";
import StatusPicker from "@/shared/components/StatusPicker";
import TypePicker from "@/shared/components/TypePicker";
import PriorityPicker from "@/shared/components/PriorityPicker";
import AssigneePicker, { toAssigneePickerUsers, AssigneePickerMember } from "@/shared/components/AssigneePicker";
import { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import { useStoryGovernance } from "@/modules/story-governance/hooks/useStoryGovernance";
import {
  getApprovedContractOptions,
  selectContractPin,
} from "@/modules/story-governance/utils/taskStory";

type CreateTaskModalProps = {
  showCreateIssue: boolean;
  setShowCreateIssue: (value: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newIssueForm: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setNewIssueForm: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleCreateIssue: any;
  workspace: Workspace;
  boardColumns?: BoardColumn[];
};

const inputCls = "w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-[0.8125rem] outline-none transition-colors";
const labelCls = "block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5";

export default function CreateTaskModal({
  showCreateIssue,
  setShowCreateIssue,
  newIssueForm,
  setNewIssueForm,
  handleCreateIssue,
  workspace,
  boardColumns = [],
}: CreateTaskModalProps) {
  const { contracts } = useStoryGovernance(workspace._id, showCreateIssue);
  const approvedContracts = getApprovedContractOptions(contracts.data ?? []);

  if (!showCreateIssue) return null;

  const assigneeUsers = toAssigneePickerUsers(workspace.members as AssigneePickerMember[]);

  const statusOptions = boardColumns.length > 0 
    ? boardColumns.map(col => ({ id: col.id, name: col.name }))
    : ["To Do", "In Progress", "Done"].map(name => ({ id: name.toLowerCase().replace(/\s/g, ""), name }));

  return (
    <Modal open={showCreateIssue} onClose={() => setShowCreateIssue(false)} title="Create new task" size="lg">
        <form
          onSubmit={(e) => handleCreateIssue(e, newIssueForm)}
          className="space-y-4"
        >
          <div>
            <label className={labelCls}>
              Work item title <span className="text-[#9F2F2D]">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={newIssueForm.title}
              onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
              className={inputCls}
              placeholder="Example: Fix display issue on mobile..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Task type</label>
              <div className="mt-1">
                <TypePicker
                  value={newIssueForm.type ?? "Task"}
                  onChange={(type) => setNewIssueForm({ ...newIssueForm, type })}
                  variant="default"
                  size="md"
                  placement="bottom"
                  fullWidth
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Priority</label>
              <div className="mt-1">
                <PriorityPicker
                  value={newIssueForm.priority ?? "Medium"}
                  onChange={(priority) => setNewIssueForm({ ...newIssueForm, priority })}
                  variant="default"
                  size="md"
                  placement="bottom"
                  fullWidth
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Initial status</label>
            <StatusPicker
              value={newIssueForm.status}
              columnId={newIssueForm.columnId}
              options={statusOptions}
              variant="input"
              onChange={(status, option) => setNewIssueForm({ ...newIssueForm, status, columnId: option.id })}
            />
          </div>

          <div>
            <label className={labelCls}>Assignee</label>
            <div className="mt-1 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] px-2 py-[5px]">
              <AssigneePicker
                users={assigneeUsers}
                value={newIssueForm.assigneeId ?? null}
                onChange={(userId) => setNewIssueForm({ ...newIssueForm, assigneeId: userId })}
                placement="bottom"
                size="md"
              />
            </div>
          </div>

          <div>
            <label htmlFor="task-story-contract" className={labelCls}>Story Contract</label>
            <select
              id="task-story-contract"
              value={newIssueForm.storyContractId ?? ""}
              onChange={(event) =>
                setNewIssueForm({
                  ...newIssueForm,
                  ...selectContractPin(event.target.value, approvedContracts),
                })
              }
              className={inputCls}
            >
              <option value="">No linked Story</option>
              {approvedContracts.map((contract) => (
                <option key={contract._id} value={contract._id}>
                  {contract.key} · {contract.title}
                </option>
              ))}
            </select>
            {newIssueForm.storyVersionId ? (
              <p className="mt-1.5 text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
                Version {newIssueForm.storyVersionId} (current approved)
              </p>
            ) : approvedContracts.length === 0 ? (
              <p className="mt-1.5 text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
                Linking is unavailable until an active Contract has an approved Version.
              </p>
            ) : (
              <p className="mt-1.5 text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
                Selecting a Contract pins its current approved immutable Version.
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowCreateIssue(false)}
              className="px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] text-[#111111] dark:text-[#E8E8E7] rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors"
            >
              Create now
            </button>
          </div>
        </form>
    </Modal>
  );
}
