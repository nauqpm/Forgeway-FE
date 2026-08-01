"use client";

import { useEffect, useMemo, useState } from "react";
import { WORKSPACE_PERMISSIONS, type WorkspacePermission } from "@/modules/workspace/shared/constants/workspacePermissions";
import { Modal, ModalFooter } from "@/shared/components/ui/Modal";
import { useStoryCriteria } from "../hooks/useStoryGovernance";
import type { AcceptanceCriterionRevision, CreateVerificationInput, CriterionVerification, StoryVersion, VerificationStatus } from "../types/storyGovernance.type";
import { isSafeEvidenceHref } from "../utils/storyGovernance";

export type StoryCriteriaPanelProps = {
  workspaceId: string;
  contractId: string;
  selectedVersion: StoryVersion;
  permissions: WorkspacePermission[];
};

type VerificationForm = Omit<CreateVerificationInput, "storyVersionId"> & { taskId: string; pullRequestRef: string; qaRunRef: string };

const emptyForm = (): VerificationForm => ({ status: "PASSED", evidenceType: "", evidenceRef: "", taskId: "", pullRequestRef: "", qaRunRef: "" });
const statusClass: Record<VerificationStatus, string> = { PASSED: "bg-[#EDF3EC] text-[#346538]", FAILED: "bg-[#FDEBEC] text-[#9F2F2D]", INCONCLUSIVE: "bg-[#FBF3DB] text-[#956400]" };
const isNotFound = (error: unknown) => (error as { response?: { status?: number } } | null)?.response?.status === 404;

const validateVerification = (form: VerificationForm) => {
  if (!form.status || !form.evidenceType.trim() || !form.evidenceRef.trim()) return "Status, evidence type, and evidence reference are required.";
  if (form.evidenceType.trim().length > 500) return "Evidence type must be 500 characters or fewer.";
  if (form.evidenceRef.trim().length > 2_000) return "Evidence reference must be 2,000 characters or fewer.";
  if (form.taskId.trim() && !/^[0-9a-f]{24}$/i.test(form.taskId.trim())) return "Task ID must be a Mongo ObjectId.";
  if (form.pullRequestRef.trim().length > 500) return "Pull request reference must be 500 characters or fewer.";
  if (form.qaRunRef.trim().length > 500) return "QA run reference must be 500 characters or fewer.";
  return "";
};

const reference = (label: string, value?: string) => !value ? null : isSafeEvidenceHref(value)
  ? <p><span className="font-medium">{label} </span><a href={value} target="_blank" rel="noreferrer" className="underline">{value}</a></p>
  : <p><span className="font-medium">{label} </span>{value}</p>;

function VerificationEvidence({ item }: { item: CriterionVerification }) {
  const safeEvidence = isSafeEvidenceHref(item.evidenceRef);
  return <li className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-3 text-xs dark:bg-white/5">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-2 py-0.5 font-semibold ${statusClass[item.status]}`}>{item.status}</span><span className="text-[#787774] dark:text-[#9B9A97]">{item.submittedBy} · {new Date(item.submittedAt).toLocaleString()}</span></div>
    <p className="mt-2"><span className="font-medium">{item.evidenceType}: </span>{safeEvidence ? <a href={item.evidenceRef} target="_blank" rel="noreferrer" className="underline">{item.evidenceRef}</a> : item.evidenceRef}</p>
    <div className="mt-2 space-y-1 text-[#787774] dark:text-[#9B9A97]">{item.taskId && <p><span className="font-medium">Task </span>{item.taskId}</p>}{reference("PR", item.pullRequestRef)}{reference("QA", item.qaRunRef)}</div>
  </li>;
}

function CriterionRevision({ revision }: { revision: AcceptanceCriterionRevision }) {
  return <div className="grid gap-2 text-sm"><p className="whitespace-pre-wrap">{revision.statement}</p><dl className="grid gap-2 text-[#787774] dark:text-[#9B9A97]"><div><dt className="font-medium text-[#111111] dark:text-[#E8E8E7]">Given</dt><dd className="whitespace-pre-wrap">{revision.given || "Not specified"}</dd></div><div><dt className="font-medium text-[#111111] dark:text-[#E8E8E7]">When</dt><dd className="whitespace-pre-wrap">{revision.when || "Not specified"}</dd></div><div><dt className="font-medium text-[#111111] dark:text-[#E8E8E7]">Then</dt><dd className="whitespace-pre-wrap">{revision.then || "Not specified"}</dd></div><div><dt className="font-medium text-[#111111] dark:text-[#E8E8E7]">Verification method</dt><dd className="whitespace-pre-wrap">{revision.verificationMethod}</dd></div><div><dt className="font-medium text-[#111111] dark:text-[#E8E8E7]">Content hash</dt><dd className="break-all font-mono text-xs">{revision.contentHash}</dd></div></dl></div>;
}

export default function StoryCriteriaPanel({ workspaceId, contractId, selectedVersion, permissions }: StoryCriteriaPanelProps) {
  const [activeCriterionId, setActiveCriterionId] = useState("");
  const [selectedRevisionId, setSelectedRevisionId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<VerificationForm>(emptyForm);
  const [error, setError] = useState("");
  const active = selectedVersion.criteria.find((item) => item.acceptanceCriterionId === activeCriterionId);
  const revisionId = selectedRevisionId || active?.acceptanceCriterionRevisionId || "";
  const api = useStoryCriteria(workspaceId, contractId, selectedVersion._id, active?.acceptanceCriterionId ?? "", revisionId, Boolean(active));
  const canSubmit = permissions.includes(WORKSPACE_PERMISSIONS.CRITERION_SUBMIT_VERIFICATION);
  const revisions = useMemo(() => [...(api.revisions.data ?? [])].sort((left, right) => right.revisionNumber - left.revisionNumber), [api.revisions.data]);
  const selectedRevision = revisions.find((item) => item._id === revisionId);
  const nestedNotFound = isNotFound(api.criterion.error) || isNotFound(api.revisions.error) || isNotFound(api.verifications.error);

  useEffect(() => {
    setActiveCriterionId("");
    setSelectedRevisionId("");
    setFormOpen(false);
    setError("");
  }, [selectedVersion._id]);

  useEffect(() => {
    if (active && !selectedRevisionId) setSelectedRevisionId(active.acceptanceCriterionRevisionId);
  }, [active, selectedRevisionId]);

  const selectCriterion = (criterionId: string, snapshotRevisionId: string) => {
    const closing = criterionId === activeCriterionId;
    setActiveCriterionId(closing ? "" : criterionId);
    setSelectedRevisionId(closing ? "" : snapshotRevisionId);
    setFormOpen(false);
    setError("");
  };
  const closeForm = () => { setFormOpen(false); setForm(emptyForm()); setError(""); };
  const submit = async () => {
    const validation = validateVerification(form);
    if (validation) return setError(validation);
    if (!active || !revisionId) return setError("This criterion revision is no longer available.");
    try {
      await api.submitVerification.mutateAsync({
        storyVersionId: selectedVersion._id,
        status: form.status,
        evidenceType: form.evidenceType.trim(),
        evidenceRef: form.evidenceRef.trim(),
        ...(form.taskId.trim() ? { taskId: form.taskId.trim() } : {}),
        ...(form.pullRequestRef.trim() ? { pullRequestRef: form.pullRequestRef.trim() } : {}),
        ...(form.qaRunRef.trim() ? { qaRunRef: form.qaRunRef.trim() } : {}),
      });
      closeForm();
    } catch {
      setError("Unable to submit verification evidence. Refresh this Version and try again.");
    }
  };

  if (!selectedVersion.criteria.length) return <section aria-label="Acceptance criteria" className="p-4"><p className="rounded-md border border-[#EAEAEA] p-4 text-sm text-[#787774] dark:text-[#9B9A97]">This Version has no acceptance criteria.</p></section>;

  return <section aria-label="Acceptance criteria" className="min-w-0 space-y-3 p-4">
    <header><h3 className="text-sm font-semibold">Acceptance criteria</h3><p className="mt-1 text-xs text-[#787774] dark:text-[#9B9A97]">Evidence is appended to the exact immutable Version and criterion revision.</p></header>
    <div className="space-y-2">
      {selectedVersion.criteria.map((item) => {
        const open = item.acceptanceCriterionId === activeCriterionId;
        return <article key={item.acceptanceCriterionId} className="overflow-hidden rounded-md border border-[#EAEAEA]">
          <button type="button" onClick={() => selectCriterion(item.acceptanceCriterionId, item.acceptanceCriterionRevisionId)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 bg-[#F9F9F8] px-3 py-3 text-left text-sm hover:bg-[#F0F0EE] dark:bg-white/5"><span className="min-w-0"><span className="font-mono text-xs text-[#787774] dark:text-[#9B9A97]">{item.key}</span><span className="ml-2 rounded-full bg-[#E1F3FE] px-2 py-0.5 text-[10px] font-semibold text-[#1F6C9F]">{item.priority}</span></span><span aria-hidden="true" className="text-[#787774] dark:text-[#9B9A97]">{open ? "−" : "+"}</span></button>
          {open && <div className="space-y-4 p-3">
            {nestedNotFound ? <p role="status" className="rounded-md border border-[#FBF3DB] bg-[#FBF3DB] p-3 text-sm text-[#956400]">This criterion is no longer available in this contract.</p>
              : api.criterion.isLoading || api.revisions.isLoading ? <p className="text-sm text-[#787774] dark:text-[#9B9A97]">Loading criterion history…</p>
                : api.criterion.isError || api.revisions.isError ? <div role="alert" className="text-sm text-[#9F2F2D]"><p>Criterion history is unavailable.</p><button type="button" onClick={() => { void api.criterion.refetch(); void api.revisions.refetch(); }} className="mt-2 rounded-md border border-[#F5C6C7] px-2 py-1 text-xs font-medium">Retry criterion history</button></div>
                  : <><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-[#787774] dark:text-[#9B9A97]">Version {selectedVersion.versionNumber} uses revision {revisions.find((revision) => revision._id === item.acceptanceCriterionRevisionId)?.revisionNumber ?? ""}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${api.criterion.data?.lifecycle === "RETIRED" ? "bg-[#FBF3DB] text-[#956400]" : "bg-[#EDF3EC] text-[#346538]"}`}>{api.criterion.data?.lifecycle}</span></div>
                    {api.criterion.data?.retiredAt && <p className="text-xs text-[#787774] dark:text-[#9B9A97]">Retired {new Date(api.criterion.data.retiredAt).toLocaleString()}</p>}
                    <div className="flex flex-wrap gap-2" aria-label="Criterion revisions">{revisions.map((revision) => <button key={revision._id} type="button" onClick={() => { setSelectedRevisionId(revision._id); setFormOpen(false); }} aria-pressed={revision._id === revisionId} className={`rounded-md border px-2 py-1 text-xs ${revision._id === revisionId ? "border-[#111111] bg-[#111111] text-white dark:border-[#E8E8E7] dark:bg-[#E8E8E7] dark:text-[#111111]" : "border-[#EAEAEA]"}`}>Revision {revision.revisionNumber}</button>)}</div>
                    {selectedRevision ? <CriterionRevision revision={selectedRevision} /> : <p role="status" className="text-sm text-[#956400]">This Version references a revision that is no longer available.</p>}
                    <section aria-label="Verification evidence" className="border-t border-[#EAEAEA] pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold">Verification evidence</h4>{canSubmit && selectedRevision && <button type="button" onClick={() => { setFormOpen(true); setError(""); }} className="rounded-md bg-[#111111] px-3 py-2 text-xs font-medium text-white dark:bg-[#E8E8E7] dark:text-[#111111]">Add verification evidence</button>}</div>{api.verifications.isLoading ? <p className="mt-3 text-sm text-[#787774] dark:text-[#9B9A97]">Loading verification evidence…</p> : api.verifications.isError ? <div role="alert" className="mt-3 text-sm text-[#9F2F2D]"><p>Verification evidence is unavailable.</p><button type="button" onClick={() => { void api.verifications.refetch(); }} className="mt-2 rounded-md border border-[#F5C6C7] px-2 py-1 text-xs font-medium">Retry verification evidence</button></div> : (api.verifications.data ?? []).length === 0 ? <p className="mt-3 text-sm text-[#787774] dark:text-[#9B9A97]">No verification evidence has been submitted for this revision.</p> : <ul className="mt-3 space-y-2">{(api.verifications.data ?? []).map((item) => <VerificationEvidence key={item._id} item={item} />)}</ul>}</section></>}
          </div>}
        </article>;
      })}
    </div>
    <Modal open={formOpen} onClose={closeForm} title="Add verification evidence" description={`Version ${selectedVersion.versionNumber} · ${active?.key ?? "Criterion"}`} footer={<ModalFooter onCancel={closeForm} onConfirm={submit} confirmLabel="Submit verification" loading={api.submitVerification.isPending} />}>
      <div className="grid gap-3"><label className="text-sm font-medium">Status<select aria-label="Status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as VerificationStatus }))} className="mt-1 w-full rounded-md border border-[#EAEAEA] bg-white p-2 text-sm dark:bg-[#202020]"><option value="PASSED">Passed</option><option value="FAILED">Failed</option><option value="INCONCLUSIVE">Inconclusive</option></select></label><label className="text-sm font-medium">Evidence type<input aria-label="Evidence type" value={form.evidenceType} maxLength={500} onChange={(event) => setForm((current) => ({ ...current, evidenceType: event.target.value }))} className="mt-1 w-full rounded-md border border-[#EAEAEA] p-2 text-sm" /></label><label className="text-sm font-medium">Evidence reference<textarea aria-label="Evidence reference" value={form.evidenceRef} maxLength={2000} onChange={(event) => setForm((current) => ({ ...current, evidenceRef: event.target.value }))} className="mt-1 min-h-20 w-full rounded-md border border-[#EAEAEA] p-2 text-sm" /></label><label className="text-sm font-medium">Task ID<input aria-label="Task ID" value={form.taskId} maxLength={24} onChange={(event) => setForm((current) => ({ ...current, taskId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#EAEAEA] p-2 text-sm" /></label><label className="text-sm font-medium">Pull request reference<input aria-label="Pull request reference" value={form.pullRequestRef} maxLength={500} onChange={(event) => setForm((current) => ({ ...current, pullRequestRef: event.target.value }))} className="mt-1 w-full rounded-md border border-[#EAEAEA] p-2 text-sm" /></label><label className="text-sm font-medium">QA run reference<input aria-label="QA run reference" value={form.qaRunRef} maxLength={500} onChange={(event) => setForm((current) => ({ ...current, qaRunRef: event.target.value }))} className="mt-1 w-full rounded-md border border-[#EAEAEA] p-2 text-sm" /></label>{error && <p role="alert" className="text-sm text-[#9F2F2D]">{error}</p>}</div>
    </Modal>
  </section>;
}
