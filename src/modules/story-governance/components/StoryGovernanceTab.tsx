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
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
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
  const initialContractRef = useRef(initial.get("contract"));
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  const [contractSearch, setContractSearch] = useState("");
  const [contractCreateOpen, setContractCreateOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"index" | "detail">("index");
  const [selection, setSelection] = useState<StoryContractSelection>({
    contractId: initial.get("contract"),
    section: sections.includes(initialSection as StoryContractSection)
      ? initialSection as StoryContractSection
      : "overview",
    versionId: initial.get("version"),
  });
  const canRead = permissions.includes(WORKSPACE_PERMISSIONS.STORY_READ);
  const canCreate = permissions.includes(WORKSPACE_PERMISSIONS.STORY_CREATE);
  const { requirements, contracts } = useStoryGovernance(workspaceId, canRead);
  const canCreateContract = canCreate
    && !contracts.isLoading
    && !contracts.isError
    && (requirements.data ?? []).some((requirement) => (requirement.status ?? "active") === "active");
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
    const requestedContractId = initialContractRef.current;
    if (!requestedContractId || contracts.isLoading) return;

    initialContractRef.current = null;
    if (!contracts.isError && selected?._id === requestedContractId) {
      setMobileView("detail");
    }
  }, [contracts.isError, contracts.isLoading, selected]);
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
    return <section role="alert" className="m-4 rounded-lg border border-[var(--color-border)] p-5 text-sm text-[var(--color-ink-2)]">You do not have access to Stories in this workspace.</section>;
  }

  const navigate = (action: () => void) => requestDraftNavigation(action);
  const selectContract = (contractId: string, section = selection.section) =>
    navigate(() => {
      setSelectedRequirementId(null);
      setSelection({ contractId, section, versionId: null });
      setMobileView("detail");
    });
  const closeNavigationPrompt = () => {
    pendingNavigationRef.current = null;
    setNavigationPromptOpen(false);
  };
  const discardAndNavigate = () => {
    const continueNavigation = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setNavigationPromptOpen(false);
    setDraftNavigationDirty(false);
    continueNavigation?.();
  };
  const requirementDetail = selectedRequirementId
    ? selectedRequirement.isLoading
      ? <div className="p-5"><p className="text-sm text-[var(--color-ink-2)]">Loading requirement…</p></div>
      : selectedRequirement.isError || !selectedRequirement.data
        ? <div className="p-5"><div role="alert" className="rounded-md border border-red-200 p-4 text-sm text-red-700 dark:border-red-900 dark:text-red-300"><p>Requirement detail could not be loaded.</p><button type="button" onClick={() => void selectedRequirement.refetch()} className="mt-2 underline">Retry</button></div></div>
        : <div className="p-5"><p className="font-mono text-xs text-[var(--color-ink-2)]">{selectedRequirement.data.key} · {selectedRequirement.data.status ?? "active"}</p><h2 className="mt-1 text-lg font-semibold">{selectedRequirement.data.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm">{selectedRequirement.data.body}</p><dl className="mt-4 space-y-1 text-xs text-[var(--color-ink-2)]"><div><dt className="inline font-medium">Source: </dt><dd className="inline">{selectedRequirement.data.sourceType}{selectedRequirement.data.sourceRef ? ` · ${selectedRequirement.data.sourceRef}` : ""}</dd></div><div><dt className="inline font-medium">Created: </dt><dd className="inline">{selectedRequirement.data.createdAt ?? "Not available"}</dd></div><div><dt className="inline font-medium">Updated: </dt><dd className="inline">{selectedRequirement.data.updatedAt ?? "Not available"}</dd></div></dl></div>
    : <div className="p-5"><p className="text-sm text-[var(--color-ink-2)]">Select a requirement to view its details.</p></div>;

  return <>
    <div data-testid="story-workspace" data-story-layout="master-detail" className="workspace-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-border)] p-2">
        <div className="min-w-[12rem] flex-1"><Input type="search" role="searchbox" aria-label="Search story contracts" value={contractSearch} onChange={(event) => setContractSearch(event.target.value)} placeholder="Search key or title" /></div>
        <Button type="button" variant="secondary" onClick={() => setRequirementsOpen(true)}>Requirements</Button>
        {canCreate && <Button type="button" disabled={!canCreateContract} onClick={() => setContractCreateOpen(true)}>New contract</Button>}
        <Button type="button" variant="secondary" onClick={() => setMobileView("index")} className="lg:hidden">Contract list</Button>
      </div>
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[19rem_minmax(0,1fr)] lg:overflow-hidden">
        <div data-story-mobile-panel="contracts" className={`min-h-0 min-w-0 ${mobileView === "detail" ? "hidden lg:block" : ""}`}>
          <StoryContractIndex
            workspaceId={workspaceId}
            permissions={permissions}
            requirements={requirements.data ?? []}
            selectedId={selected?._id ?? null}
            search={contractSearch}
            onSearchChange={setContractSearch}
            createOpen={contractCreateOpen}
            onCreateOpenChange={setContractCreateOpen}
            onOpenRequirements={() => setRequirementsOpen(true)}
            onSelect={(id) => selectContract(id)}
            onCreated={(contract: StoryContract) => selectContract(contract._id, "drafts")}
            onOpenApprovals={(id) => selectContract(id, "approvals")}
          />
        </div>
        <aside data-story-mobile-panel="detail" aria-label="Selected story contract" className={`min-h-0 min-w-0 overflow-y-auto border-t border-[var(--color-border)] lg:border-l lg:border-t-0 ${mobileView === "index" ? "hidden lg:block" : ""}`}>
          {mobileView === "detail" && <button type="button" onClick={() => setMobileView("index")} className="m-4 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] lg:hidden">Back to contracts</button>}
          <StoryContractDetail
            workspaceId={workspaceId}
            workspaceKey={workspaceKey}
            contract={selected}
            section={selection.section}
            selectedVersionId={selection.versionId}
            permissions={permissions}
            onSectionChange={(section) => navigate(() => setSelection((current) => ({ ...current, section })))}
            onOpenVersion={(versionId) => setSelection((current) => ({ ...current, section: "versions", versionId }))}
          />
        </aside>
      </div>
    </div>
    <Modal open={requirementsOpen} onClose={() => setRequirementsOpen(false)} title="Requirements" size="xl">
      <div className="grid min-h-0 gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <RequirementPanel workspaceId={workspaceId} permissions={permissions} onSelect={(requirement) => navigate(() => setSelectedRequirementId(requirement._id))} />
        <aside aria-label="Selected requirement" className="min-h-0 min-w-0 overflow-y-auto border-t border-[var(--color-border)] lg:border-l lg:border-t-0">{requirementDetail}</aside>
      </div>
    </Modal>
    <Modal open={navigationPromptOpen} onClose={closeNavigationPrompt} title="Discard Story draft edits" description="You have unsaved Draft edits." footer={<ModalFooter onCancel={closeNavigationPrompt} cancelLabel="Keep editing" onConfirm={discardAndNavigate} confirmLabel="Discard edits" confirmVariant="danger" />}><p ref={navigationPromptFocusRef} tabIndex={-1} className="text-sm text-[#787774] outline-none">Discarding changes cannot be undone.</p></Modal>
  </>;
}
