import React from "react";
import { ChevronDown, Clock, Flag, FolderKanban, UserCircle, Users } from "lucide-react";
import { Filters } from "../types/filter.type";

type TaskFilterPanelProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  projects: { id: string; name: string; key: string }[];
  assignees: { id: string; name: string; avatar?: string }[];
  workspaceKey: string;
  selectedWorkspaceKey?: string | null;
  onSelectWorkspace?: (workspaceKey: string) => void;
  currentUserId?: string;
  currentUserName?: string;
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
    <section className="border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-gray-800">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        <Icon className="h-4 w-4 text-indigo-500" />
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
}: {
  checked: boolean;
  label: string;
  detail?: string;
  avatar?: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900"
      />
      {avatar && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
          {avatar}
        </span>
      )}
      <span className="min-w-0 text-sm text-gray-800 dark:text-gray-200">
        <span className="block truncate">{label}</span>
        {detail && <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{detail}</span>}
      </span>
    </label>
  );
}

export default function TaskFilterPanel({
  filters,
  setFilters,
  projects,
  assignees,
  workspaceKey,
  selectedWorkspaceKey,
  onSelectWorkspace,
  currentUserId,
  currentUserName,
}: TaskFilterPanelProps) {
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

  return (
    <div className="space-y-4">
      <Section title="Last updated" icon={Clock}>
        {lastUpdatedOptions.map((option) => (
          <CheckboxRow
            key={option}
            checked={(filters.lastUpdated || "Any time") === option}
            label={option}
            onChange={() => setFilters((prev) => ({ ...prev, lastUpdated: option === "Any time" ? null : option }))}
          />
        ))}
      </Section>

      <Section title="Filter by project" icon={FolderKanban}>
        {(projects.length > 0 ? projects : [{ id: workspaceKey, name: `${workspaceKey} board`, key: workspaceKey }]).slice(0, 8).map((project) => (
          <CheckboxRow
            key={project.id}
            checked={project.key === (selectedWorkspaceKey || workspaceKey)}
            label={project.name}
            detail={project.key}
            avatar={project.key.slice(0, 2).toUpperCase()}
            onChange={() => onSelectWorkspace?.(project.key)}
          />
        ))}
        <button type="button" className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
          Show more <ChevronDown className="h-4 w-4" />
        </button>
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
        <button type="button" className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
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
            <p className="mb-1 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</p>
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
            <p className="mb-1 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Type</p>
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
            <p className="mb-1 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Priority</p>
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
