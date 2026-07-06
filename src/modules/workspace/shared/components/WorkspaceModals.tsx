"use client";

import dynamic from "next/dynamic";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import { Sprint } from "@/modules/workspace/shared/types/sprint.type";
import { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import { Workspace, WorkspaceTab, getWorkspaceTemplate } from "@/modules/workspace/shared/types/workspace.type";
import { TaskDetailResponse } from "@/modules/workspace/shared/types/task-detail.type";

const CreateTaskModal = dynamic(
  () => import("@/modules/workspace/tasks/create/CreateTaskModal"),
  { ssr: false },
);
const SprintModal = dynamic(() => import("@/modules/workspace/sprint/SprintModal"), { ssr: false });
const StartSprintModal = dynamic(
  () => import("@/modules/workspace/sprint/StartSprintModal"),
  { ssr: false },
);
const CompleteSprintModal = dynamic(
  () => import("@/modules/workspace/sprint/CompleteSprintModal"),
  { ssr: false },
);
const TaskDetailDrawer = dynamic(
  () => import("@/modules/workspace/tasks/detail/TaskDetailDrawer"),
  { ssr: false },
);
const TaskDetailModal = dynamic(
  () => import("@/modules/workspace/tasks/detail/TaskDetailModal"),
  { ssr: false },
);

interface NewIssueForm {
  title: string;
  type: string;
  priority: string;
  status: string;
  sprintId: string | null;
  assigneeId: string;
  columnId?: string | null;
}

interface WorkspaceModalsProps {
  workspace: Workspace;
  columns: BoardColumn[];
  sprints: Sprint[];
  activeTab: WorkspaceTab;
  showCreateIssue: boolean;
  setShowCreateIssue: (open: boolean) => void;
  newIssueForm: NewIssueForm;
  setNewIssueForm: React.Dispatch<React.SetStateAction<NewIssueForm>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleCreateIssue: (e: React.FormEvent, form: any) => void;
  isSprintModalOpen: boolean;
  setIsSprintModalOpen: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleSaveSprint: (data: any) => void;
  editingSprint: Sprint | null;
  startSprintTarget: Sprint | null;
  setStartSprintTarget: (sprint: Sprint | null) => void;
  handleConfirmStartSprint: (startDate: string, endDate: string) => void;
  completeSprintTarget: Sprint | null;
  setCompleteSprintTarget: (sprint: Sprint | null) => void;
   
  handleConfirmCompleteSprint: (moveToSprintId?: string) => void;
  activeIssueDetail: Issue | null | undefined;
  closeTaskDetail: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleUpdateIssue: (issue: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateIssueDirectly: (id: string, updates: any) => void;
  handleArchiveIssue: (issue: Issue) => void;
  handleRestoreIssue?: (issue: TaskDetailResponse) => void;
  detailUrl: string | undefined;
  canEditTask: boolean;
  canDeleteTask: boolean;
}

export default function WorkspaceModals({
  workspace,
  columns,
  sprints,
  activeTab,
  showCreateIssue,
  setShowCreateIssue,
  newIssueForm,
  setNewIssueForm,
  handleCreateIssue,
  isSprintModalOpen,
  setIsSprintModalOpen,
  handleSaveSprint,
  editingSprint,
  startSprintTarget,
  setStartSprintTarget,
  handleConfirmStartSprint,
  completeSprintTarget,
  setCompleteSprintTarget,
  handleConfirmCompleteSprint,
  activeIssueDetail,
  closeTaskDetail,
  handleUpdateIssue,
  updateIssueDirectly,
  handleArchiveIssue,
  handleRestoreIssue,
  detailUrl,
  canEditTask,
  canDeleteTask,
}: WorkspaceModalsProps) {
  return (
    <>
      {showCreateIssue && (
        <CreateTaskModal
          showCreateIssue={showCreateIssue}
          setShowCreateIssue={setShowCreateIssue}
          newIssueForm={newIssueForm}
          setNewIssueForm={setNewIssueForm}
          handleCreateIssue={handleCreateIssue}
          workspace={workspace}
          boardColumns={columns}
        />
      )}

      <SprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        onSave={handleSaveSprint}
        initialData={editingSprint}
        sprintCount={sprints.length}
      />

      {startSprintTarget && (
        <StartSprintModal
          isOpen={!!startSprintTarget}
          onClose={() => setStartSprintTarget(null)}
          onConfirm={handleConfirmStartSprint}
          sprint={startSprintTarget}
        />
      )}

      {completeSprintTarget && (
        <CompleteSprintModal
          isOpen={!!completeSprintTarget}
          onClose={() => setCompleteSprintTarget(null)}
          onConfirm={handleConfirmCompleteSprint}
          sprint={completeSprintTarget}
          sprints={sprints}
          workspaceId={workspace._id}
        />
      )}

      {activeIssueDetail && (activeTab === "timeline" || activeTab === "calendar") ? (
        <TaskDetailDrawer
          isOpen={!!activeIssueDetail}
          issue={activeIssueDetail}
          workspaceId={workspace._id}
          workspaceMembers={workspace.members}
          sprints={sprints}
          boardColumns={columns}
          workspaceTemplate={getWorkspaceTemplate(workspace)}
          onClose={closeTaskDetail}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onUpdateIssue={canEditTask ? ((i: any) => handleUpdateIssue(i)) : undefined}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onFieldUpdate={canEditTask ? ((id: string, updates: any) => updateIssueDirectly(id, updates)) : undefined}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onArchiveIssue={canDeleteTask ? ((i: any) => handleArchiveIssue(i)) : undefined}
          onRestoreIssue={handleRestoreIssue ? ((i: TaskDetailResponse) => handleRestoreIssue(i)) : undefined}
          detailUrl={detailUrl}
        />
      ) : activeIssueDetail && activeTab !== "list" ? (
        <TaskDetailModal
          issue={activeIssueDetail}
          workspaceId={workspace._id}
          workspaceMembers={workspace.members}
          sprints={sprints}
          boardColumns={columns}
          workspaceTemplate={getWorkspaceTemplate(workspace)}
          onClose={closeTaskDetail}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onUpdateIssue={canEditTask ? ((i: any) => handleUpdateIssue(i)) : undefined}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onArchiveIssue={canDeleteTask ? ((i: any) => handleArchiveIssue(i)) : undefined}
          onRestoreIssue={handleRestoreIssue ? ((i: TaskDetailResponse) => handleRestoreIssue(i)) : undefined}
          detailUrl={detailUrl}
        />
      ) : null}
    </>
  );
}
