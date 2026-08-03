"use client";

import { useMemo, useState } from "react";
import { PiArchive } from "react-icons/pi";
import { WORKSPACE_PERMISSIONS, type WorkspacePermission } from "@/modules/workspace/shared/constants/workspacePermissions";
import { Button } from "@/shared/components/ui/Button";
import { Input, Select } from "@/shared/components/ui/Input";
import { Modal, ModalFooter } from "@/shared/components/ui/Modal";
import { useStoryGovernance } from "../hooks/useStoryGovernance";
import type { RawRequirement, StoryContract } from "../types/storyGovernance.type";

type Props = {
  workspaceId: string;
  permissions: WorkspacePermission[];
  requirements: RawRequirement[];
  selectedId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  onOpenRequirements: () => void;
  onSelect: (id: string) => void;
  onCreated: (contract: StoryContract, draftId?: string) => void;
  onOpenApprovals: (id: string) => void;
};

export default function StoryContractIndex({
  workspaceId,
  permissions,
  requirements,
  selectedId,
  search,
  createOpen,
  onCreateOpenChange,
  onOpenRequirements,
  onSelect,
  onCreated,
  onOpenApprovals,
}: Props) {
  const [filter, setFilter] = useState<"active" | "archived">("active");
  const [title, setTitle] = useState("");
  const [primaryRequirementId, setPrimaryRequirementId] = useState("");
  const [createError, setCreateError] = useState("");
  const [archiveError, setArchiveError] = useState("");
  const [failedArchiveId, setFailedArchiveId] = useState<string | null>(null);
  const { contracts, createContract, archiveContract } = useStoryGovernance(workspaceId);
  const canCreate = permissions.includes(WORKSPACE_PERMISSIONS.STORY_CREATE);
  const canArchive = permissions.includes(WORKSPACE_PERMISSIONS.STORY_ARCHIVE);
  const activeRequirements = requirements.filter((item) => (item.status ?? "active") === "active");
  const items = useMemo(
    () => (contracts.data ?? []).filter((item) => item.status === filter && `${item.key} ${item.title}`.toLowerCase().includes(search.toLowerCase())),
    [contracts.data, filter, search],
  );

  const closeCreate = () => {
    setCreateError("");
    onCreateOpenChange(false);
  };
  const submitCreate = () => {
    if (!title.trim() || !primaryRequirementId) {
      setCreateError("A title and active primary requirement are required.");
      return;
    }
    createContract.mutate(
      { title: title.trim(), primaryRequirementId },
      {
        onSuccess: ({ contract, draft }) => {
          closeCreate();
          onCreated(contract, draft?._id);
        },
        onError: () => setCreateError("Could not create story contract. Please try again."),
      },
    );
  };
  const archive = (id: string) => {
    if (!window.confirm("Archive this contract? Pending approval requests must be resolved first.")) return;
    setArchiveError("");
    setFailedArchiveId(null);
    archiveContract.mutate(id, {
      onSuccess: () => {
        setArchiveError("");
        setFailedArchiveId(null);
      },
      onError: (cause: unknown) => {
        const code = (cause as { response?: { data?: { code?: string } } }).response?.data?.code;
        setFailedArchiveId(id);
        setArchiveError(code === "STORY_PENDING_APPROVAL_EXISTS"
          ? "This contract cannot be archived while approvals are pending."
          : "Could not archive this story contract. Please try again.");
      },
    });
  };

  if (contracts.isLoading) return <section aria-label="Story contracts loading" className="animate-pulse border-b border-[var(--color-border)] p-4"><div className="h-5 w-36 rounded bg-[#EAEAEA]" /></section>;
  if (contracts.isError) return <section role="alert" className="border-b border-[#F5C6C7] p-4 text-sm text-[#9F2F2D]">Story contracts could not be loaded. Refresh the page to try again.</section>;

  return <>
    <section aria-labelledby="contracts-heading" className="min-h-0 min-w-0 overflow-y-auto border-b border-[var(--color-border)] p-4 lg:border-b-0 lg:border-r">
      <div><h2 id="contracts-heading" className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Story contracts</h2><p className="text-xs text-[#787774] dark:text-[#9B9A97]">{(contracts.data ?? []).filter((item) => item.status === "active").length} active · {(contracts.data ?? []).filter((item) => item.status === "archived").length} archived</p></div>
      {archiveError && <p role="alert" className="mt-3 text-sm text-[#9F2F2D]">{archiveError} {archiveError.includes("pending") && failedArchiveId && <button type="button" className="underline" onClick={() => onOpenApprovals(failedArchiveId)}>Open Approvals</button>}</p>}
      <div className="mt-3 flex gap-2"><Button variant={filter === "active" ? "primary" : "secondary"} size="sm" aria-pressed={filter === "active"} onClick={() => setFilter("active")}>Active</Button><Button variant={filter === "archived" ? "primary" : "secondary"} size="sm" aria-pressed={filter === "archived"} onClick={() => setFilter("archived")}>Archived</Button></div>
      <div className="mt-3 space-y-2">{items.length ? items.map((contract) => <div key={contract._id} className={`rounded-[6px] border p-3 ${contract.status === "archived" ? "border-dashed bg-[#F9F9F8] dark:bg-[#202020]" : ""} ${selectedId === contract._id ? "border-[#2563EB] bg-[#EFF6FF] dark:border-[#3B82F6] dark:bg-white/5" : "border-[#EAEAEA] bg-white dark:border-white/10 dark:bg-[#202020]"}`}><button type="button" onClick={() => onSelect(contract._id)} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-[#2563EB]"><span className="font-mono text-xs text-[#787774] dark:text-[#9B9A97]">{contract.key}</span><p className="mt-1 text-sm font-medium text-[#111111] dark:text-[#E8E8E7]">{contract.title}</p></button>{canArchive && contract.status === "active" && <Button type="button" variant="ghost" size="sm" aria-label={`Archive contract ${contract.key}`} onClick={() => archive(contract._id)} className="mt-2" icon={<PiArchive />}>Archive</Button>}</div>) : <div className="rounded-[6px] border border-dashed border-[#EAEAEA] p-4 text-sm text-[#787774] dark:border-white/10 dark:text-[#9B9A97]">{filter === "archived" ? "No archived story contracts." : activeRequirements.length ? "No story contracts yet. Create one from an active primary requirement." : <><p>No story contracts yet. Add an active requirement first.</p>{canCreate && <Button type="button" variant="ghost" size="sm" onClick={onOpenRequirements} className="mt-2">Open requirements</Button>}</>}</div>}</div>
    </section>
    <Modal open={createOpen} onClose={closeCreate} title="Create story contract" footer={<ModalFooter onCancel={closeCreate} onConfirm={activeRequirements.length ? submitCreate : undefined} confirmLabel="Create contract" loading={createContract.isPending} />}>
      {activeRequirements.length ? <div className="space-y-3"><Input label="Title" required value={title} onChange={(event) => setTitle(event.target.value)} /><Select label="Primary requirement" required value={primaryRequirementId} onChange={(event) => setPrimaryRequirementId(event.target.value)}><option value="">Select requirement</option>{activeRequirements.map((item) => <option key={item._id} value={item._id}>{item.key} — {item.title}</option>)}</Select>{createError && <p role="alert" className="text-sm text-[#9F2F2D]">{createError}</p>}</div> : <div><p className="text-sm text-[#787774] dark:text-[#9B9A97]">Create an active requirement before creating a story contract.</p><Button type="button" variant="secondary" size="sm" onClick={() => { closeCreate(); onOpenRequirements(); }} className="mt-3">Open requirements</Button></div>}
    </Modal>
  </>;
}
