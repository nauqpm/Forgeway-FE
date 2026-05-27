import React from "react";
import { ChevronDown, Clock, FolderKanban, UserCircle, Users } from "lucide-react";
import { Filters } from "../types/filter.type";

type TaskFilterPanelProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  projects: { id: string; name: string; key: string }[];
  assignees: { id: string; name: string; avatar?: string }[];
  workspaceKey: string;
  currentUserName?: string;
};

const lastUpdatedOptions = ["Any time", "Today", "Yesterday", "Past 7 days", "Past 30 days", "Past year"];

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
        <Icon className="h-4 w-4 text-red-500" />
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
        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-900"
      />
      {avatar && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
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
  currentUserName,
}: TaskFilterPanelProps) {
  const toggleArray = (field: "assignees", value: string) => {
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
        {(projects.length > 0 ? projects : [{ id: workspaceKey, name: `${workspaceKey} board`, key: workspaceKey }]).slice(0, 4).map((project) => (
          <CheckboxRow
            key={project.id}
            checked={project.key === workspaceKey}
            label={project.name}
            detail={project.key}
            avatar={project.key.slice(0, 2).toUpperCase()}
            onChange={() => undefined}
          />
        ))}
        <button type="button" className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400">
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
        <button type="button" className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400">
          Show more <ChevronDown className="h-4 w-4" />
        </button>
      </Section>

      <Section title="Filter by reporter" icon={UserCircle}>
        <CheckboxRow
          checked={filters.reporterId === "me"}
          label="Reported by me"
          detail={currentUserName}
          avatar={(currentUserName || "Me").slice(0, 2).toUpperCase()}
          onChange={() => setFilters((prev) => ({ ...prev, reporterId: prev.reporterId === "me" ? null : "me" }))}
        />
      </Section>
    </div>
  );
}
