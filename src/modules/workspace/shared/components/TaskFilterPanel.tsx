import React from "react";
import { ChevronDown, Clock, FileText, Flag, FolderKanban, MessageSquare, UserCircle, Users } from "lucide-react";
import { Filters } from "../types/filter.type";
import type { GlobalSearchType } from "../services/globalSearch.service";

type TaskFilterPanelProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  workspaces: { id: string; name: string; key: string }[];
  assignees: { id: string; name: string; avatar?: string }[];
  workspaceKey: string;
  selectedWorkspaceKey?: string | null;
  selectedWorkspaceKeys?: string[];
  onSelectWorkspace?: (workspaceKey: string) => void;
  onToggleWorkspace?: (workspaceKey: string) => void;
  onSetWorkspaceKeys?: (workspaceKeys: string[]) => void;
  currentUserId?: string;
  currentUserName?: string;
  activeTab: "Work" | "Docs";
  documentTypes: GlobalSearchType[];
  onDocumentTypesChange: (types: GlobalSearchType[]) => void;
  documentLastUpdated?: string | null;
  onDocumentLastUpdatedChange: (value: string | null) => void;
  documentAuthorIds: string[];
  onDocumentAuthorIdsChange: (authorIds: string[]) => void;
};

const lastUpdatedOptions = ["Any time", "Today", "Yesterday", "Past 7 days", "Past 30 days", "Past year"];
const statuses = ["To Do", "In Progress", "Testing", "Done"];
const types = ["Task", "Bug", "Story", "Epic"];
const priorities = ["Lowest", "Low", "Medium", "High", "Highest"];

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#EAEAEA] dark:border-white/[0.06] pb-4 last:border-0 last:pb-0">
      <div className="mb-2 flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-[#ABABAB] dark:text-[#6B6B6B]">
        <Icon className="h-4 w-4 text-[#2563EB] dark:text-[#3B82F6]" />
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function CheckboxRow({
  checked,
  label,
  detail,
  avatar,
  onChange,
  inputType = "checkbox",
  name,
}: {
  checked: boolean;
  label: string;
  detail?: string;
  avatar?: string;
  onChange: () => void;
  inputType?: "checkbox" | "radio";
  name?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-[6px] px-2 py-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]">
      <input
        type={inputType}
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded accent-[#2563EB]"
      />
      {avatar && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-[0.625rem] font-bold text-white">
          {avatar}
        </span>
      )}
      <span className="min-w-0 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">
        <span className="block truncate">{label}</span>
        {detail && <span className="block truncate text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">{detail}</span>}
      </span>
    </label>
  );
}

export default function TaskFilterPanel({
  filters,
  setFilters,
  workspaces,
  assignees,
  workspaceKey,
  selectedWorkspaceKey,
  selectedWorkspaceKeys,
  onSelectWorkspace,
  onToggleWorkspace,
  onSetWorkspaceKeys,
  currentUserId,
  currentUserName,
  activeTab,
  documentTypes,
  onDocumentTypesChange,
  documentLastUpdated,
  onDocumentLastUpdatedChange,
  documentAuthorIds,
  onDocumentAuthorIdsChange,
}: TaskFilterPanelProps) {
  const [showAllWorkspaces, setShowAllWorkspaces] = React.useState(false);
  const toggleArray = (field: "assignees" | "statuses" | "types" | "priorities", value: string) => {
    setFilters((prev) => {
      const current = prev[field];
      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };
  const activeWorkspaceKeys =
    Array.isArray(selectedWorkspaceKeys)
      ? selectedWorkspaceKeys
      : [selectedWorkspaceKey || workspaceKey].filter(Boolean);
  const availableWorkspaces = workspaces.length > 0
    ? workspaces
    : [{ id: workspaceKey, name: workspaceKey, key: workspaceKey }];
  const selectedWorkspaceCount = availableWorkspaces.filter((workspace) => activeWorkspaceKeys.includes(workspace.key)).length;
  const allWorkspacesSelected = availableWorkspaces.length > 0 && selectedWorkspaceCount === availableWorkspaces.length;
  const visibleWorkspaces = showAllWorkspaces ? availableWorkspaces : availableWorkspaces.slice(0, 8);
  const hiddenWorkspaceCount = Math.max(availableWorkspaces.length - 8, 0);

  const toggleDocumentType = (type: "page" | "comment") => {
    const nextTypes = documentTypes.includes(type)
      ? documentTypes.filter((currentType) => currentType !== type)
      : [...documentTypes, type];

    // Keep at least one document content type selected so the search scope is always explicit.
    if (nextTypes.length > 0) onDocumentTypesChange(nextTypes);
  };

  if (activeTab === "Docs") {
    return (
      <div className="space-y-4">
        <Section title="Document scope" icon={FolderKanban}>
          <p className="px-2 text-[0.8125rem] leading-5 text-[#787774] dark:text-[#9B9A97]">
            Searching documents in all workspaces you own or are a member of.
          </p>
        </Section>

        <Section title="Content type" icon={FileText}>
          <CheckboxRow
            checked={documentTypes.includes("page")}
            label="Pages"
            detail="Workspace documents"
            onChange={() => toggleDocumentType("page")}
          />
          <CheckboxRow
            checked={documentTypes.includes("comment")}
            label="Comments"
            detail="Comments on documents"
            onChange={() => toggleDocumentType("comment")}
          />
        </Section>

        <Section title="Last updated" icon={Clock}>
          {lastUpdatedOptions.map((option) => (
            <CheckboxRow
              key={option}
              checked={(documentLastUpdated || "Any time") === option}
              label={option}
              inputType="radio"
              name="documentLastUpdated"
              onChange={() => onDocumentLastUpdatedChange(option === "Any time" ? null : option)}
            />
          ))}
        </Section>

        <Section title="Author" icon={MessageSquare}>
          <CheckboxRow
            checked={Boolean(currentUserId && documentAuthorIds.includes(currentUserId))}
            label="Created by me"
            detail={currentUserName}
            avatar={(currentUserName || "Me").slice(0, 2).toUpperCase()}
            onChange={() => {
              if (!currentUserId) return;
              onDocumentAuthorIdsChange(
                documentAuthorIds.includes(currentUserId)
                  ? documentAuthorIds.filter((id) => id !== currentUserId)
                  : [...documentAuthorIds, currentUserId],
              );
            }}
          />
        </Section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Section title="Work scope" icon={FolderKanban}>
        <p className="px-2 text-[0.8125rem] leading-5 text-[#787774] dark:text-[#9B9A97]">
          Searching work items in all selected workspaces.
        </p>
      </Section>

      <Section title="Last updated" icon={Clock}>
        {lastUpdatedOptions.map((option) => (
          <CheckboxRow
            key={option}
            checked={(filters.lastUpdated || "Any time") === option}
            label={option}
            inputType="radio"
            name="lastUpdated"
            onChange={() => setFilters((prev) => ({ ...prev, lastUpdated: option === "Any time" ? null : option }))}
          />
        ))}
      </Section>

      <Section title="Filter by workspace" icon={FolderKanban}>
        <div className="flex items-center justify-between px-2 pb-2 text-[0.6875rem]">
          <span className="text-[#787774] dark:text-[#9B9A97]">
            {selectedWorkspaceCount > 0 ? `Searching ${selectedWorkspaceCount} workspace${selectedWorkspaceCount === 1 ? "" : "s"}` : "No workspace selected"}
          </span>
          <span className="flex items-center gap-2 font-medium text-[#2563EB] dark:text-[#3B82F6]">
            <button type="button" onClick={() => onSetWorkspaceKeys?.(availableWorkspaces.map((workspace) => workspace.key))} disabled={allWorkspacesSelected} className="disabled:cursor-not-allowed disabled:opacity-40">
              Select all
            </button>
            <button type="button" onClick={() => onSetWorkspaceKeys?.([])} disabled={selectedWorkspaceCount === 0} className="disabled:cursor-not-allowed disabled:opacity-40">
              Clear all
            </button>
          </span>
        </div>
        {visibleWorkspaces.map((workspace, index) => (
          <CheckboxRow
            key={workspace.id || workspace.key || `${workspace.name}-${index}`}
            checked={activeWorkspaceKeys.includes(workspace.key)}
            label={workspace.name}
            detail={workspace.key}
            avatar={workspace.key.slice(0, 2).toUpperCase()}
            onChange={() => {
              if (onToggleWorkspace) {
                onToggleWorkspace(workspace.key);
                return;
              }
              onSelectWorkspace?.(workspace.key);
            }}
          />
        ))}
        {hiddenWorkspaceCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAllWorkspaces((current) => !current)}
            className="inline-flex items-center gap-1 px-2 py-1 text-[0.8125rem] font-medium text-[#2563EB] dark:text-[#3B82F6]"
          >
            {showAllWorkspaces
              ? "Show fewer workspaces"
              : `Show ${hiddenWorkspaceCount} more workspace${hiddenWorkspaceCount === 1 ? "" : "s"}`}
            <ChevronDown className={`h-4 w-4 transition-transform ${showAllWorkspaces ? "rotate-180" : ""}`} />
          </button>
        )}
      </Section>

      <Section title="Filter by assignee" icon={Users}>
        {(assignees.length > 0 ? assignees : [{ id: "me", name: currentUserName || "Assigned to me" }]).slice(0, 5).map((user) => (
          <CheckboxRow
            key={user.id}
            checked={filters.assignees.includes(user.id)}
            label={user.name}
            detail="Assignee"
            avatar={(user.avatar || user.name || user.id).slice(0, 2).toUpperCase()}
            onChange={() => toggleArray("assignees", user.id)}
          />
        ))}
        <button type="button" className="inline-flex items-center gap-1 px-2 py-1 text-[0.8125rem] font-medium text-[#2563EB] dark:text-[#3B82F6]">
          Show more <ChevronDown className="h-4 w-4" />
        </button>
      </Section>

      <Section title="Filter by reporter" icon={UserCircle}>
        <CheckboxRow
          checked={Boolean(currentUserId && filters.reporterId === currentUserId)}
          label="Reported by me"
          detail={currentUserName}
          avatar={(currentUserName || "Me").slice(0, 2).toUpperCase()}
          onChange={() => {
            if (!currentUserId) return;
            setFilters((prev) => ({
              ...prev,
              reporterId: prev.reporterId === currentUserId ? null : currentUserId,
            }));
          }}
        />
      </Section>

      <Section title="Filter by task fields" icon={Flag}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="mb-1 px-2 text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B]">Status</p>
            {statuses.map((status) => (
              <CheckboxRow
                key={status}
                checked={filters.statuses.includes(status)}
                label={status}
                onChange={() => toggleArray("statuses", status)}
              />
            ))}
          </div>
          <div>
            <p className="mb-1 px-2 text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B]">Type</p>
            {types.map((type) => (
              <CheckboxRow
                key={type}
                checked={filters.types.includes(type)}
                label={type}
                onChange={() => toggleArray("types", type)}
              />
            ))}
          </div>
          <div>
            <p className="mb-1 px-2 text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B]">Priority</p>
            {priorities.map((priority) => (
              <CheckboxRow
                key={priority}
                checked={filters.priorities.includes(priority)}
                label={priority}
                onChange={() => toggleArray("priorities", priority)}
              />
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
