"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  WORKSPACE_PERMISSIONS,
  type WorkspacePermission,
} from "@/modules/workspace/shared/constants/workspacePermissions";
import { useStoryGovernance, useStoryRequirement } from "../hooks/useStoryGovernance";
import type { StoryContract } from "../types/storyGovernance.type";
import RequirementPanel from "./RequirementPanel";
import StoryContractIndex from "./StoryContractIndex";
import StoryContractDetail, { type StoryContractSection } from "./StoryContractDetail";
import { Modal, ModalFooter } from "@/shared/components/ui/Modal";
import {
  registerDraftNavigationPrompt,
  requestDraftNavigation,
  setDraftNavigationDirty,
} from "../utils/storyGovernance";

export type StoryContractSelection = {
  contractId: string | null;
  section: StoryContractSection;
  versionId: string | null;
};
type Props = {
  workspaceId: string;
  workspaceKey: string;
  currentUserId?: string;
  permissions: WorkspacePermission[];
};
const sections: StoryContractSection[] = ["overview", "drafts", "versions", "criteria", "decisions", "approvals"];

export default function StoryGovernanceTab({
  workspaceId,
  workspaceKey,
  permissions,
}: Props) {
  const initial = new URLSearchParams(window.location.search);
  const initialSection = initial.get("section");
  const [selection, setSelection] = useState<StoryContractSelection>({
    contractId: initial.get("contract"),
    section: sections.includes(initialSection as StoryContractSection)
      ? initialSection as StoryContractSection
      : "overview",
    versionId: initial.get("version"),
  });
  const canRead = permissions.includes(WORKSPACE_PERMISSIONS.STORY_READ);
  const { requirements, contracts } = useStoryGovernance(workspaceId, canRead);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const selectedRequirement = useStoryRequirement(workspaceId, selectedRequirementId, canRead);
  const [navigationPromptOpen, setNavigationPromptOpen] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const navigationPromptFocusRef = useRef<HTMLParagraphElement>(null);
  const selected = useMemo(
    () => (contracts.data ?? []).find((contract) => contract._id === selection.contractId)
      ?? (contracts.data ?? []).find((contract) => contract.status === "active")
      ?? null,
    [contracts.data, selection.contractId],
  );

  useEffect(() => {
    if (selected && selected._id !== selection.contractId) {
      setSelection((current) => ({ ...current, contractId: selected._id }));
    }
  }, [selected, selection.contractId]);
  useEffect(() => {
    const params = new URLSearchParams();
    if (selection.contractId) params.set("contract", selection.contractId);
    if (selection.section !== "overview") params.set("section", selection.section);
    if (selection.versionId) params.set("version", selection.versionId);
    const suffix = params.toString();
    window.history.replaceState(null, "", `/workspaces/${workspaceKey}/stories${suffix ? `?${suffix}` : ""}`);
  }, [selection, workspaceKey]);
  useEffect(
    () => registerDraftNavigationPrompt((continueNavigation) => {
      pendingNavigationRef.current = continueNavigation;
      setNavigationPromptOpen(true);
    }),
    [],
  );
  useEffect(() => {
    if (navigationPromptOpen) navigationPromptFocusRef.current?.focus();
  }, [navigationPromptOpen]);

  if (!canRead) {
    return <section role="alert" className="m-4 rounded-lg border border-slate-200 p-5 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">You do not have access to Stories in this workspace.</section>;
  }

  const navigate = (action: () => void) => requestDraftNavigation(action);
  const closeNavigationPrompt = () => {
    pendingNavigationRef.current = null;
    setNavigationPromptOpen(false);
  };
  const selectContract = (contractId: string, section = selection.section) =>
    navigate(() => {
      setSelectedRequirementId(null);
      setSelection({ contractId, section, versionId: null });
    });
  const discardAndNavigate = () => {
    const continueNavigation = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setNavigationPromptOpen(false);
    setDraftNavigationDirty(false);
    continueNavigation?.();
  };

  return <><div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-950">
    <nav aria-label="Story workspace panels" className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 p-2 dark:border-slate-700 lg:hidden">
      <a href="#story-requirements" className="rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400">Requirements</a>
      <a href="#story-contracts" className="rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400">Contracts</a>
      <a href="#story-contract-detail" className="rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400">Detail</a>
    </nav>
    <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-2 lg:grid-cols-[minmax(16rem,0.85fr)_minmax(17rem,1fr)_minmax(20rem,1.25fr)] lg:overflow-hidden">
      <div id="story-requirements" data-story-mobile-panel="requirements" className="min-h-0 min-w-0">
        <RequirementPanel workspaceId={workspaceId} permissions={permissions} onSelect={(requirement) => navigate(() => setSelectedRequirementId(requirement._id))} />
      </div>
      <div id="story-contracts" data-story-mobile-panel="contracts" className="min-h-0 min-w-0">
        <StoryContractIndex
          workspaceId={workspaceId}
          permissions={permissions}
          requirements={requirements.data ?? []}
          selectedId={selected?._id ?? null}
          onSelect={(id) => selectContract(id)}
          onCreated={(contract: StoryContract) => selectContract(contract._id, "drafts")}
          onOpenApprovals={(id) => selectContract(id, "approvals")}
        />
      </div>
      <aside id="story-contract-detail" data-story-mobile-panel="detail" aria-label={selectedRequirementId ? "Selected requirement" : "Selected story contract"} className="min-h-0 min-w-0 overflow-y-auto border-t border-slate-200 dark:border-slate-700 md:col-span-2 lg:col-span-1 lg:border-l lg:border-t-0">
        {selectedRequirementId
          ? selectedRequirement.isLoading
            ? <div className="p-5"><p className="text-sm text-slate-500">Loading requirement…</p></div>
            : selectedRequirement.isError || !selectedRequirement.data
              ? <div className="p-5"><div role="alert" className="rounded-md border border-red-200 p-4 text-sm text-red-700 dark:border-red-900 dark:text-red-300"><p>Requirement detail could not be loaded.</p><button type="button" onClick={() => void selectedRequirement.refetch()} className="mt-2 underline">Retry</button></div></div>
              : <div className="p-5"><p className="font-mono text-xs text-slate-500">{selectedRequirement.data.key} · {selectedRequirement.data.status ?? "active"}</p><h2 className="mt-1 text-lg font-semibold">{selectedRequirement.data.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm">{selectedRequirement.data.body}</p><dl className="mt-4 space-y-1 text-xs text-slate-500"><div><dt className="inline font-medium">Source: </dt><dd className="inline">{selectedRequirement.data.sourceType}{selectedRequirement.data.sourceRef ? ` · ${selectedRequirement.data.sourceRef}` : ""}</dd></div><div><dt className="inline font-medium">Created: </dt><dd className="inline">{selectedRequirement.data.createdAt ?? "Not available"}</dd></div><div><dt className="inline font-medium">Updated: </dt><dd className="inline">{selectedRequirement.data.updatedAt ?? "Not available"}</dd></div></dl></div>
          : <StoryContractDetail
              workspaceId={workspaceId}
              workspaceKey={workspaceKey}
              contract={selected}
              section={selection.section}
              selectedVersionId={selection.versionId}
              permissions={permissions}
              onSectionChange={(section) => navigate(() => setSelection((current) => ({ ...current, section })))}
              onOpenVersion={(versionId) => setSelection((current) => ({ ...current, section: "versions", versionId }))}
            />}
      </aside>
    </div>
  </div><Modal open={navigationPromptOpen} onClose={closeNavigationPrompt} title="Discard Story draft edits" description="You have unsaved Draft edits." footer={<ModalFooter onCancel={closeNavigationPrompt} cancelLabel="Keep editing" onConfirm={discardAndNavigate} confirmLabel="Discard edits" confirmVariant="danger" />}><p ref={navigationPromptFocusRef} tabIndex={-1} className="text-sm text-[#787774] outline-none">Discarding changes cannot be undone.</p></Modal></>;
}
