'use client';

import { Menu } from "lucide-react";
import Image from "next/image";
import SearchDropdown from "@/modules/workspace/shared/components/SearchDropdown";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { Filters } from "@/modules/workspace/shared/types/filter.type";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";

type SearchAssigneeUser = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  avatar?: string;
  avatarUrl?: string;
  image?: string;
};

interface AppHeaderProps {
  sidebarCollapsed: boolean;
  onMobileOpen: () => void;
  taskSearchFilters: Filters;
  setTaskSearchFilters: React.Dispatch<React.SetStateAction<Filters>>;
  isTaskSearchReady: boolean;
  defaultSearchWorkspaceKeys: string[];
  workspaceKey: string;
}

export default function AppHeader({
  sidebarCollapsed,
  onMobileOpen,
  taskSearchFilters,
  setTaskSearchFilters,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isTaskSearchReady: _isTaskSearchReady,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultSearchWorkspaceKeys: _defaultSearchWorkspaceKeys,
  workspaceKey,
}: AppHeaderProps) {
  const { user } = useAuth();
  const { currentWorkspace, workspaces } = useCurrentWorkspace();
  
  const activeWorkspaceKey = workspaceKey || currentWorkspace?.key || currentWorkspace?.slug || "AL";
  
  const searchProjects = (workspaces.length > 0 ? workspaces : currentWorkspace ? [currentWorkspace] : [])
    .filter(Boolean)
    .map((workspace) => {
      const id = workspace._id || (workspace as { id?: string }).id;
      const key = workspace.key || workspace.slug;
      return id && key ? { id, name: workspace.name, key } : null;
    })
    .filter((workspace): workspace is { id: string; name: string; key: string } => Boolean(workspace));

  const searchAssignees = (currentWorkspace?.members ?? [])
    .filter((member) => member && member.userId)
    .map((member) => {
      const memberUser = member.userId;
      const memberUserProfile = typeof memberUser === "string" ? null : (memberUser as SearchAssigneeUser);
      const memberId =
        typeof memberUser === "string"
          ? memberUser
          : memberUserProfile?._id || memberUserProfile?.id || "member";
      const memberName =
        typeof memberUser === "string"
          ? memberUser
          : memberUserProfile?.fullName || memberUserProfile?.name || memberUserProfile?.email || memberId;
      const memberAvatar =
        typeof memberUser === "string"
          ? undefined
          : memberUserProfile?.avatar || memberUserProfile?.avatarUrl || memberUserProfile?.image;

      return {
        id: memberId,
        name: memberId === user?.id ? user?.fullName || user?.email || memberName : memberName,
        avatar: memberAvatar,
      };
    });

  return (
    <header className="app-header bg-white dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Mobile menu */}
        <button
          onClick={onMobileOpen}
          className="lg:hidden p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
        </button>

        {/* Logo in topbar — desktop only, slides in when sidebar is collapsed */}
        <div
          className={`hidden lg:flex items-center gap-2 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "max-w-[16.25rem] opacity-100" : "max-w-0 opacity-0 pointer-events-none"
          }`}
        >
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center p-1">
            <Image src="/vercel.svg" alt="SDLC Platform" width={38} height={38} className="h-9 w-9 rounded-[8px] object-contain" />
          </span>
          <span className="flex flex-col text-base font-bold leading-[0.95] tracking-tight text-[#2563EB] dark:text-[#60A5FA] whitespace-nowrap">
            <span className="text-2xl">SDLC</span>
            <span>PLATFORM</span>
          </span>
        </div>

        {/* Search bar */}
        <div className="hidden w-[clamp(520px,44vw,680px)] md:block flex-shrink-0">
          <SearchDropdown
            filters={taskSearchFilters}
            setFilters={setTaskSearchFilters}
            projects={searchProjects}
            assignees={searchAssignees}
            workspaceKey={activeWorkspaceKey}
            currentUserId={user?.id}
            currentUserName={user?.fullName || user?.email}
            className=""
            inputClassName="h-10 text-sm"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
