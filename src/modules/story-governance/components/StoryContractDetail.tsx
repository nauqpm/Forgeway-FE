"use client";

import type { WorkspacePermission } from "@/modules/workspace/shared/constants/workspacePermissions";
import type { StoryContract } from "../types/storyGovernance.type";
import StoryDecisionsPanel from "./StoryDecisionsPanel";
import StoryDraftEditor from "./StoryDraftEditor";
import StoryApprovalsPanel from "./StoryApprovalsPanel";
import StoryCriteriaPanel from "./StoryCriteriaPanel";
import StoryVersionWorkspace from "./StoryVersionWorkspace";
import { useStoryVersions } from "../hooks/useStoryGovernance";

export type StoryContractSection = "overview" | "drafts" | "versions" | "criteria" | "decisions" | "approvals";
type Props = {
  workspaceId: string;
  workspaceKey?: string;
  contract: StoryContract | null;
  section: StoryContractSection;
  selectedVersionId?: string | null;
  permissions: WorkspacePermission[];
  onSectionChange(section: StoryContractSection): void;
  onOpenVersion(versionId: string): void;
};

const sections: Array<[StoryContractSection, string]> = [
  ["overview", "Overview"],
  ["drafts", "Drafts"],
  ["versions", "Versions"],
  ["criteria", "Criteria"],
  ["decisions", "Decisions"],
  ["approvals", "Approvals"],
];

export default function StoryContractDetail({
  workspaceId,
  workspaceKey = workspaceId,
  contract,
  section,
  selectedVersionId,
  permissions,
  onSectionChange,
  onOpenVersion,
}: Props) {
  const versions = useStoryVersions(workspaceId, contract?._id ?? "", undefined, undefined, section === "approvals" || section === "criteria", false);
  if (!contract) {
    return <section className="hidden min-w-0 p-5 lg:block"><p className="text-sm text-slate-500">Select a story contract to see its current record.</p></section>;
  }
  const effectivePermissions = contract.status === "archived" ? [] : permissions;
  const versionList = [...(versions.versions.data ?? [])].sort((left, right) => right.versionNumber - left.versionNumber);
  const selectedVersion = versionList.find((version) => version._id === selectedVersionId) ?? versionList[0];

  return <section aria-label="Story contract detail" className="min-w-0">
    <div className="border-b border-slate-200 p-4 dark:border-slate-700">
      <p className="font-mono text-xs text-slate-500">{contract.key}</p>
      <h2 className="mt-1 text-lg font-semibold">{contract.title}</h2>
      <nav aria-label="Story contract sections" className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {sections.map(([value, label]) => <button key={value} type="button" aria-current={section === value ? "page" : undefined} onClick={() => onSectionChange(value)} className={`shrink-0 rounded-md border px-2 py-1 text-xs ${section === value ? "border-[#111111] bg-[#111111] text-white dark:border-[#E8E8E7] dark:bg-[#E8E8E7] dark:text-[#111111]" : "border-[#EAEAEA]"}`}>{label}</button>)}
      </nav>
    </div>
    {section === "drafts"
      ? <StoryDraftEditor key={contract._id} workspaceId={workspaceId} contract={contract} draftId="" permissions={effectivePermissions} onOpenVersion={onOpenVersion} />
      : section === "versions"
        ? <StoryVersionWorkspace key={contract._id} workspaceId={workspaceId} workspaceKey={workspaceKey} contract={contract} permissions={effectivePermissions} initialVersionId={selectedVersionId} />
      : section === "decisions"
        ? <StoryDecisionsPanel key={contract._id} workspaceId={workspaceId} contractId={contract._id} permissions={effectivePermissions} />
      : section === "approvals"
        ? <StoryApprovalsPanel key={contract._id} workspaceId={workspaceId} contract={contract} versions={versions.versions.data ?? []} permissions={effectivePermissions} onOpenVersion={onOpenVersion} />
      : section === "criteria"
        ? versions.versions.isError
          ? <div className="p-4"><div role="alert" className="rounded-md border border-[#F5C6C7] bg-[#FDEBEC] p-4 text-sm text-[#9F2F2D]"><p>Criteria cannot be loaded because Version history is unavailable.</p><button type="button" onClick={() => { void versions.versions.refetch(); }} className="mt-3 rounded-md border border-[#F5C6C7] px-2 py-1 text-xs font-medium">Retry Versions</button></div></div>
          : versions.versions.isLoading
          ? <div className="p-4"><p className="text-sm text-slate-500">Loading Versions…</p></div>
          : selectedVersion
            ? <StoryCriteriaPanel key={`${contract._id}-${selectedVersion._id}`} workspaceId={workspaceId} contractId={contract._id} selectedVersion={selectedVersion} permissions={effectivePermissions} />
            : <div className="p-4"><p className="text-sm text-slate-500">No immutable Versions are available for criteria evidence.</p></div>
      : <div className="p-4"><p className="text-sm text-slate-500">{contract.status === "archived" ? "Archived contracts remain available for historical reference." : `Viewing ${section}.`}</p></div>}
  </section>;
}
