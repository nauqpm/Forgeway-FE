import type { ReactNode } from "react";

type WorkspaceTabShellProps = {
  mode: "canvas" | "content";
  children: ReactNode;
};

export default function WorkspaceTabShell({ mode, children }: WorkspaceTabShellProps) {
  return (
    <div
      className={
        mode === "canvas"
          ? "flex h-full w-full min-h-0 min-w-0 flex-1 overflow-hidden p-[var(--workspace-surface-pad)]"
          : "flex h-full w-full flex-col flex-1 overflow-y-auto p-[var(--workspace-surface-pad)]"
      }
    >
      {children}
    </div>
  );
}
