"use client";

import { useMemo, useState } from "react";
import { PiArchive, PiPlus } from "react-icons/pi";
import { Modal } from "@/shared/components/ui/Modal";
import { WORKSPACE_PERMISSIONS, type WorkspacePermission } from "@/modules/workspace/shared/constants/workspacePermissions";
import { useStoryGovernance } from "../hooks/useStoryGovernance";
import type { CreateRequirementInput, RawRequirement } from "../types/storyGovernance.type";

type Props = { workspaceId: string; permissions: WorkspacePermission[]; onSelect?: (requirement: RawRequirement) => void };
const emptyForm = (): CreateRequirementInput => ({ key: "", title: "", body: "", sourceType: "manual", sourceRef: "", sourceMetadata: undefined });

export default function RequirementPanel({ workspaceId, permissions, onSelect }: Props) {
  const [filter, setFilter] = useState<"active" | "archived">("active");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [metadata, setMetadata] = useState("");
  const [error, setError] = useState("");
  const { requirements, createRequirement, archiveRequirement } = useStoryGovernance(workspaceId);
  const canCreate = permissions.includes(WORKSPACE_PERMISSIONS.STORY_CREATE);
  const canArchive = permissions.includes(WORKSPACE_PERMISSIONS.STORY_ARCHIVE);
  const items = useMemo(() => (requirements.data ?? []).filter((item) => (item.status ?? "active") === filter), [filter, requirements.data]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.key.trim() || form.key.length > 100) return setError("Key is required and must be 100 characters or fewer.");
    if (!form.title.trim() || form.title.length > 255) return setError("Title is required and must be 255 characters or fewer.");
    if (!form.body.trim() || form.body.length > 10000) return setError("Body is required and must be 10,000 characters or fewer.");
    if (form.sourceRef && form.sourceRef.length > 255) return setError("Source reference must be 255 characters or fewer.");
    let sourceMetadata: Record<string, unknown> | undefined;
    try { sourceMetadata = metadata.trim() ? JSON.parse(metadata) : undefined; } catch { return setError("Source metadata must be a JSON object."); }
    if (sourceMetadata && (Array.isArray(sourceMetadata) || typeof sourceMetadata !== "object")) return setError("Source metadata must be a JSON object.");
    setError("");
    createRequirement.mutate({ ...form, key: form.key.trim(), title: form.title.trim(), sourceRef: form.sourceRef?.trim() || undefined, sourceMetadata }, { onSuccess: () => { setIsOpen(false); setForm(emptyForm()); setMetadata(""); }, onError: () => setError("Could not create requirement. Please try again.") });
  };

  if (requirements.isLoading) return <section aria-label="Requirements loading" className="animate-pulse rounded-lg border border-slate-200 p-5 dark:border-slate-700"><div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" /><div className="mt-4 h-20 rounded bg-slate-100 dark:bg-slate-800" /></section>;
  if (requirements.isError) return <section role="alert" className="rounded-lg border border-red-200 p-5 text-sm text-red-700 dark:border-red-900 dark:text-red-300">Requirements could not be loaded. Refresh the page to try again.</section>;

  return <section aria-labelledby="requirements-heading" className="min-h-0 min-w-0 overflow-y-auto border-b border-slate-200 p-4 dark:border-slate-700 md:border-b-0 md:border-r">
    <div className="flex items-center justify-between gap-3"><div><h2 id="requirements-heading" className="font-semibold">Requirements</h2><p className="text-xs text-slate-500">Source material for story contracts</p></div>{canCreate && <button type="button" onClick={() => setIsOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-100 dark:text-slate-900"><PiPlus aria-hidden="true" />Create requirement</button>}</div>
    <div className="mt-4 flex gap-2" aria-label="Requirement status"><button aria-pressed={filter === "active"} onClick={() => setFilter("active")} className="rounded-md border px-2 py-1 text-xs">Active</button><button aria-pressed={filter === "archived"} onClick={() => setFilter("archived")} className="rounded-md border px-2 py-1 text-xs">Archived</button></div>
    <div className="mt-3 space-y-2">{items.length ? items.map((item) => <div key={item._id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"><button type="button" onClick={() => onSelect?.(item)} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-slate-400"><span className="font-mono text-xs text-slate-500">{item.key}</span><p className="mt-1 text-sm font-medium">{item.title}</p></button>{canArchive && filter === "active" && <button type="button" aria-label={`Archive requirement ${item.key}`} onClick={() => { if (window.confirm("Archive this requirement? Existing contracts will remain readable.")) archiveRequirement.mutate(item._id); }} className="mt-2 inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-950 dark:text-slate-400"><PiArchive aria-hidden="true" />Archive</button>}</div>) : <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">{filter === "active" ? "No requirements yet" : "No archived requirements"}{canCreate && filter === "active" ? ". Create a requirement to establish the source for a story contract." : "."}</p>}</div>
    <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Create requirement" size="lg"><form onSubmit={submit}>{error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}<label className="block text-sm">Key<input autoFocus value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} maxLength={100} className="mt-1 w-full rounded-md border p-2" /></label><label className="mt-3 block text-sm">Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={255} className="mt-1 w-full rounded-md border p-2" /></label><label className="mt-3 block text-sm">Body<textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={10000} className="mt-1 min-h-24 w-full rounded-md border p-2" /></label><label className="mt-3 block text-sm">Source<select value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value as CreateRequirementInput["sourceType"] })} className="mt-1 w-full rounded-md border p-2"><option value="manual">Manual</option><option value="jira">Jira</option></select></label><label className="mt-3 block text-sm">Source reference<input value={form.sourceRef} onChange={(e) => setForm({ ...form, sourceRef: e.target.value })} maxLength={255} className="mt-1 w-full rounded-md border p-2" /></label><label className="mt-3 block text-sm">Source metadata (JSON object)<textarea value={metadata} onChange={(e) => setMetadata(e.target.value)} className="mt-1 min-h-20 w-full rounded-md border p-2 font-mono text-xs" /></label><button type="submit" disabled={createRequirement.isPending} className="mt-4 rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50">Save requirement</button></form></Modal>
  </section>;
}
