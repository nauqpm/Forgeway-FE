"use client";

import { useMemo, useState } from "react";
import { PiArchive, PiPlus } from "react-icons/pi";
import { WORKSPACE_PERMISSIONS, type WorkspacePermission } from "@/modules/workspace/shared/constants/workspacePermissions";
import { useStoryGovernance } from "../hooks/useStoryGovernance";
import type { RawRequirement, StoryContract } from "../types/storyGovernance.type";

type Props = { workspaceId: string; permissions: WorkspacePermission[]; requirements: RawRequirement[]; selectedId: string | null; onSelect: (id: string) => void; onCreated: (contract: StoryContract, draftId?: string) => void; onOpenApprovals: (id: string) => void };

export default function StoryContractIndex({ workspaceId, permissions, requirements, selectedId, onSelect, onCreated, onOpenApprovals }: Props) {
  const [filter, setFilter] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [primaryRequirementId, setPrimaryRequirementId] = useState("");
  const [error, setError] = useState("");
  const [failedArchiveId, setFailedArchiveId] = useState<string | null>(null);
  const { contracts, createContract, archiveContract } = useStoryGovernance(workspaceId);
  const canCreate = permissions.includes(WORKSPACE_PERMISSIONS.STORY_CREATE);
  const canArchive = permissions.includes(WORKSPACE_PERMISSIONS.STORY_ARCHIVE);
  const activeRequirements = requirements.filter((item) => (item.status ?? "active") === "active");
  const items = useMemo(() => (contracts.data ?? []).filter((item) => item.status === filter && `${item.key} ${item.title}`.toLowerCase().includes(search.toLowerCase())), [contracts.data, filter, search]);

  if (contracts.isLoading) return <section aria-label="Story contracts loading" className="animate-pulse border-b p-4"><div className="h-5 w-36 rounded bg-slate-200" /></section>;
  if (contracts.isError) return <section role="alert" className="border-b border-red-200 p-4 text-sm text-red-700">Story contracts could not be loaded. Refresh the page to try again.</section>;

  const archive = (id: string) => {
    if (!window.confirm("Archive this contract? Pending approval requests must be resolved first.")) return;
    archiveContract.mutate(id, { onError: (cause: unknown) => {
      const code = (cause as { response?: { data?: { code?: string } } }).response?.data?.code;
      setFailedArchiveId(id);
      setError(code === "STORY_PENDING_APPROVAL_EXISTS"
        ? "This contract cannot be archived while approvals are pending."
        : "Could not archive this story contract. Please try again.");
    } });
  };
  return <section aria-labelledby="contracts-heading" className="min-h-0 min-w-0 overflow-y-auto border-b border-slate-200 p-4 dark:border-slate-700 lg:border-b-0 lg:border-r">
    <div className="flex items-center justify-between gap-2"><div><h2 id="contracts-heading" className="font-semibold">Story contracts</h2><p className="text-xs text-slate-500">{(contracts.data ?? []).filter((item) => item.status === "active").length} active · {(contracts.data ?? []).filter((item) => item.status === "archived").length} archived</p></div>{canCreate && <button type="button" onClick={() => activeRequirements.length ? setCreating(true) : setError("Create an active requirement before creating a story contract.")} className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white"> <PiPlus /> Create contract</button>}</div>
    {error && <p role="alert" className="mt-2 text-sm text-red-600">{error} {error.includes("pending") && failedArchiveId && <button type="button" className="underline" onClick={() => onOpenApprovals(failedArchiveId)}>Open Approvals</button>}</p>}
    <input aria-label="Search story contracts" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search key or title" className="mt-3 w-full rounded-md border p-2 text-sm" />
    <div className="mt-3 flex gap-2"><button aria-pressed={filter === "active"} onClick={() => setFilter("active")} className="rounded-md border px-2 py-1 text-xs">Active</button><button aria-pressed={filter === "archived"} onClick={() => setFilter("archived")} className="rounded-md border px-2 py-1 text-xs">Archived</button></div>
    <div className="mt-3 space-y-2">{items.length ? items.map((contract) => <div key={contract._id} className={`rounded-lg border p-3 ${selectedId === contract._id ? "border-slate-900 dark:border-slate-100" : "border-slate-200 dark:border-slate-700"}`}><button type="button" onClick={() => onSelect(contract._id)} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-slate-400"><span className="font-mono text-xs text-slate-500">{contract.key}</span><p className="mt-1 text-sm font-medium">{contract.title}</p></button>{canArchive && contract.status === "active" && <button type="button" aria-label={`Archive contract ${contract.key}`} onClick={() => archive(contract._id)} className="mt-2 inline-flex items-center gap-1 text-xs"><PiArchive />Archive</button>}</div>) : <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">{filter === "archived" ? "No archived story contracts." : <>No story contracts yet{activeRequirements.length ? ". Create one from an active primary requirement." : ". Add an active requirement first."}</>}</p>}</div>
    {creating && <form onSubmit={(event) => { event.preventDefault(); if (!title.trim() || !primaryRequirementId) return setError("A title and active primary requirement are required."); createContract.mutate({ title: title.trim(), primaryRequirementId }, { onSuccess: ({ contract, draft }) => { setCreating(false); onCreated(contract, draft?._id); }, onError: () => setError("Could not create story contract. Please try again.") }); }} className="mt-4 rounded-lg border p-3"><label className="block text-sm">Title<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-md border p-2" /></label><label className="mt-3 block text-sm">Primary requirement<select value={primaryRequirementId} onChange={(event) => setPrimaryRequirementId(event.target.value)} className="mt-1 w-full rounded-md border p-2"><option value="">Select requirement</option>{activeRequirements.map((item) => <option key={item._id} value={item._id}>{item.key} — {item.title}</option>)}</select></label><button type="submit" disabled={createContract.isPending} className="mt-3 rounded-md bg-slate-900 px-3 py-2 text-sm text-white">Create contract</button></form>}
  </section>;
}
