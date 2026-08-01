"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal, ModalFooter } from "@/shared/components/ui/Modal";
import { queryKeys } from "@/shared/constants/queryKeys";
import { getBoardTasks } from "@/modules/workspace/shared/services/taskQueries";
import { WORKSPACE_PERMISSIONS, type WorkspacePermission } from "@/modules/workspace/shared/constants/workspacePermissions";
import { useStoryVersionImpact, useStoryVersions } from "../hooks/useStoryGovernance";
import type { ChangeImpact, StoryContract, StoryVersion, StoryVersionChange, StoryVersionChangeSet } from "../types/storyGovernance.type";
import { deriveVersionState, groupChanges } from "../utils/storyGovernance";

type Props = {
  workspaceId: string;
  workspaceKey: string;
  contract: StoryContract;
  permissions: WorkspacePermission[];
  initialVersionId?: string | null;
};

const changeArrays: Array<[keyof Pick<StoryVersionChangeSet, "scopeChanges" | "businessRuleChanges" | "permissionChanges" | "requirementChanges" | "acceptanceCriterionChanges" | "decisionChanges" | "dependencyChanges">, string]> = [
  ["scopeChanges", "Scope"], ["businessRuleChanges", "Business rule"], ["permissionChanges", "Permission"], ["requirementChanges", "Requirement"], ["acceptanceCriterionChanges", "Acceptance criterion"], ["decisionChanges", "Decision"], ["dependencyChanges", "Dependency"],
];
const impactClass: Record<ChangeImpact, string> = { BLOCKING: "bg-[#FDEBEC] text-[#9F2F2D]", REVIEW_REQUIRED: "bg-[#FBF3DB] text-[#956400]", INFORMATIONAL: "bg-[#E1F3FE] text-[#1F6C9F]" };
const versionClass: Record<string, string> = { APPROVED: "bg-[#EDF3EC] text-[#346538]", SUPERSEDED: "bg-[#F7F6F3] text-[#787774]", REJECTED: "bg-[#FDEBEC] text-[#9F2F2D]", PENDING_APPROVAL: "bg-[#FBF3DB] text-[#956400]", SNAPSHOT: "bg-[#E1F3FE] text-[#1F6C9F]" };

const VersionState = ({ value }: { value: string }) => <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${versionClass[value]}`}>{value.replaceAll("_", " ")}</span>;

export default function StoryVersionWorkspace({ workspaceId, workspaceKey, contract, permissions, initialVersionId }: Props) {
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [confirmLink, setConfirmLink] = useState(false);
  const [taskId, setTaskId] = useState("");
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const { versions, approvals, comparison, linkTask } = useStoryVersions(workspaceId, contract._id, fromId, toId);
  const canReadImpact = permissions.includes(WORKSPACE_PERMISSIONS.STORY_READ_IMPACT);
  const canLink = contract.status === "active" && permissions.includes(WORKSPACE_PERMISSIONS.STORY_READ) && permissions.includes(WORKSPACE_PERMISSIONS.STORY_RESOLVE_IMPACT) && Boolean(contract.currentApprovedStoryVersionId);
  const tasks = useQuery({ queryKey: queryKeys.tasks.byWorkspace(workspaceId), queryFn: () => getBoardTasks(workspaceId), enabled: Boolean(workspaceId && canLink) });
  const list = useMemo(() => [...(versions.data ?? [])].sort((left, right) => right.versionNumber - left.versionNumber), [versions.data]);
  const selected = list.find((version) => version._id === selectedVersionId) ?? list[0];
  const impacts = useStoryVersionImpact(workspaceId, contract._id, selected?._id, canReadImpact);
  const canRead = permissions.includes(WORKSPACE_PERMISSIONS.STORY_READ);
  const canCompare = permissions.includes(WORKSPACE_PERMISSIONS.STORY_COMPARE_VERSIONS);
  const currentApproved = list.find((version) => version._id === contract.currentApprovedStoryVersionId);

  useEffect(() => { setFromId(""); setToId(""); }, [contract._id]);
  useEffect(() => { setSelectedVersionId((current) => list.some((version) => version._id === initialVersionId) ? initialVersionId ?? undefined : list.some((version) => version._id === current) ? current : list[0]?._id); }, [initialVersionId, list]);
  useEffect(() => { if (confirmLink) confirmButtonRef.current?.focus(); }, [confirmLink]);
  const groupedChanges = useMemo(() => comparison.data ? groupChanges(comparison.data) : null, [comparison.data]);
  const task = (tasks.data ?? []).find((item) => item.id === taskId);
  const stateFor = (version: StoryVersion) => deriveVersionState(version, contract, approvals.data ?? { requests: [], records: [] });
  const copyHash = async () => { if (selected?.contentHash) await navigator.clipboard?.writeText(selected.contentHash); };
  const closeLink = () => { setLinkOpen(false); setConfirmLink(false); setTaskId(""); };
  const submitLink = async () => {
    if (!currentApproved || !task) return;
    try { await linkTask.mutateAsync({ versionId: currentApproved._id, taskId, taskKey: task.key }); closeLink(); }
    catch { /* Keep the confirmation open so its generic retry message remains visible. */ }
  };

  if (!canRead) return <section className="p-4"><p className="text-sm text-[#787774]">You do not have permission to view Versions.</p></section>;
  if (versions.isError || approvals.isError) return <section aria-label="Story Versions" className="p-4"><div role="alert" className="rounded-md border border-[#F5C6C7] bg-[#FDEBEC] p-4 text-sm text-[#9F2F2D]"><p>Version history is unavailable.</p><button type="button" onClick={() => { void versions.refetch(); void approvals.refetch(); }} className="mt-3 rounded-md border border-[#F5C6C7] px-2 py-1 text-xs font-medium">Retry</button></div></section>;

  return <section aria-label="Story Versions" className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-4">
    <header className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">Immutable Versions</h3><p className="text-xs text-[#787774]">Snapshots are read-only records of submitted Story content.</p></div>{currentApproved && <p className="text-xs text-[#346538]">Current approved: Version {currentApproved.versionNumber}</p>}</header>
    {versions.isLoading ? <p className="text-sm text-[#787774]">Loading Versions…</p> : list.length === 0 ? <p className="rounded-md border border-[#EAEAEA] p-4 text-sm text-[#787774]">No immutable versions yet.</p> : <div className="grid min-h-0 gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="max-h-72 overflow-y-auto rounded-md border border-[#EAEAEA] p-2 lg:max-h-none">
        {list.map((version) => <button key={version._id} type="button" onClick={() => setSelectedVersionId(version._id)} aria-pressed={selected?._id === version._id} className={`mb-1 flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left ${selected?._id === version._id ? "bg-[#F7F6F3] ring-1 ring-[#EAEAEA] dark:bg-white/10" : "hover:bg-[#F7F6F3] dark:hover:bg-white/5"}`}><span className="text-xs font-medium">Version {version.versionNumber}</span><VersionState value={stateFor(version)} /></button>)}
      </div>
      {selected && <article className="min-w-0 rounded-md border border-[#EAEAEA] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-semibold">Version {selected.versionNumber}</h4><p className="mt-1 font-mono text-xs text-[#787774] break-all">{selected.contentHash}</p></div><button type="button" onClick={copyHash} className="rounded-md border border-[#EAEAEA] px-2 py-1 text-xs">Copy content hash</button></div><div className="mt-4 grid gap-4 text-sm"><section><h5 className="font-medium">Problem</h5><p className="mt-1 whitespace-pre-wrap text-[#787774]">{selected.contentSnapshot.problem}</p></section><section><h5 className="font-medium">Requirement links</h5><ul className="mt-1 space-y-1 text-xs text-[#787774]">{selected.requirementLinkSnapshot.map((link) => <li key={`${link.requirementId}-${link.relationship}`}>{link.requirementId} <span className="font-semibold">{link.relationship}</span>{link.evidenceNote ? ` · ${link.evidenceNote}` : ""}</li>)}</ul></section><section><h5 className="font-medium">Criteria</h5><ul className="mt-1 space-y-1 text-xs text-[#787774]">{selected.criteria.map((criterion) => <li key={criterion.acceptanceCriterionRevisionId}>{criterion.key} · {criterion.priority}</li>)}</ul></section><section><h5 className="font-medium">Decision records</h5><p className="mt-1 text-xs text-[#787774]">{selected.decisionRecordIds.length ? selected.decisionRecordIds.join(", ") : "No decision records."}</p></section></div></article>}
    </div>}

    {canCompare && list.length > 1 && <section className="rounded-md border border-[#EAEAEA] p-4"><h3 className="text-sm font-semibold">Semantic diff</h3><div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="text-xs">Compare from version<select aria-label="Compare from version" value={fromId} onChange={(event) => setFromId(event.target.value)} className="mt-1 w-full rounded-md border border-[#EAEAEA] bg-white p-2 text-sm dark:bg-[#202020]"><option value="">Select a Version</option>{list.map((version) => <option key={version._id} value={version._id}>Version {version.versionNumber}</option>)}</select></label><label className="text-xs">Compare to version<select aria-label="Compare to version" value={toId} onChange={(event) => setToId(event.target.value)} className="mt-1 w-full rounded-md border border-[#EAEAEA] bg-white p-2 text-sm dark:bg-[#202020]"><option value="">Select a Version</option>{list.map((version) => <option key={version._id} value={version._id}>Version {version.versionNumber}</option>)}</select></label></div>{comparison.isLoading && <p className="mt-3 text-xs text-[#787774]">Loading semantic diff…</p>}{comparison.isError && <p role="alert" className="mt-3 text-xs text-[#9F2F2D]">This Version comparison is unavailable.</p>}{groupedChanges && <DiffLedger changes={groupedChanges} source={comparison.data!} />}</section>}

    {selected && canReadImpact && <section className="rounded-md border border-[#EAEAEA] p-4"><div><h3 className="text-sm font-semibold">Version impact</h3><p className="text-xs text-[#787774]">Task assessments for Version {selected.versionNumber}.</p></div>{impacts.isLoading ? <p className="mt-3 text-xs text-[#787774]">Loading Task impact…</p> : impacts.isError ? <p role="alert" className="mt-3 text-xs text-[#9F2F2D]">Task impact is unavailable.</p> : (impacts.data ?? []).length === 0 ? <p className="mt-3 text-sm text-[#787774]">No Task impact for this Version.</p> : <ImpactGroups assessments={impacts.data ?? []} tasks={tasks.data ?? []} workspaceKey={workspaceKey} />}</section>}
    {canLink && <section aria-label="Task link" className="rounded-md border border-[#EAEAEA] p-4"><button type="button" onClick={() => setLinkOpen(true)} className="rounded-md bg-[#111111] px-3 py-2 text-xs font-medium text-white dark:bg-[#E8E8E7] dark:text-[#111111]">Link current approved Version to Task</button></section>}

    <Modal open={linkOpen} onClose={closeLink} title="Link Task to approved Version" description={currentApproved ? `${contract.key} · Version ${currentApproved.versionNumber}${confirmLink && task ? ` · ${task.key}` : ""}` : undefined} footer={confirmLink ? <><button type="button" onClick={() => setConfirmLink(false)} className="inline-flex h-8 items-center justify-center rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-3 text-xs font-medium">Back</button><button ref={confirmButtonRef} type="button" onClick={submitLink} disabled={linkTask.isPending} className="inline-flex h-8 items-center justify-center rounded-md bg-[#111111] px-3 text-xs font-medium text-white disabled:opacity-40 dark:bg-[#E8E8E7] dark:text-[#111111]">{linkTask.isPending ? "Linking…" : "Link Task"}</button></> : <ModalFooter onCancel={closeLink} onConfirm={() => setConfirmLink(true)} confirmLabel="Continue to confirmation" loading={tasks.isLoading || !taskId} />}>{confirmLink ? <><p className="text-sm text-[#787774]">This links the selected Task to the current approved immutable Version.</p>{linkTask.isError && <p role="alert" className="mt-3 text-sm text-[#9F2F2D]">Unable to link this Task. Refresh the workspace and try again.</p>}</> : <label className="text-sm font-medium" htmlFor="story-task">Task<select id="story-task" aria-label="Task" value={taskId} onChange={(event) => setTaskId(event.target.value)} className="mt-2 w-full rounded-md border border-[#EAEAEA] bg-white p-2 text-sm dark:bg-[#202020]"><option value="">Select an existing Task</option>{(tasks.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.key} · {item.title}</option>)}</select></label>}</Modal>
  </section>;
}

function DiffLedger({ changes, source }: { changes: Record<ChangeImpact, StoryVersionChange[]>; source: StoryVersionChangeSet }) {
  const labels = new Map(changeArrays);
  return <div className="mt-4 overflow-x-auto"><table role="table" aria-label="Semantic version diff" className="min-w-full overflow-x-auto text-left text-xs"><thead><tr className="border-b border-[#EAEAEA] text-[#787774]"><th className="p-2">Impact</th><th className="p-2">Area</th><th className="p-2">Change</th><th className="p-2">Record</th><th className="p-2">Revision</th></tr></thead><tbody>{(["BLOCKING", "REVIEW_REQUIRED", "INFORMATIONAL"] as ChangeImpact[]).map((impact) => <Fragment key={impact}><tr><th colSpan={5} className="border-y border-[#EAEAEA] bg-[#F9F9F8] p-2 text-left text-xs dark:bg-white/5">{impact.replaceAll("_", " ")} ({changes[impact].length})</th></tr>{changes[impact].map((change) => {
    const area = changeArrays.find(([key]) => (source[key] as StoryVersionChange[]).includes(change));
    return <tr key={`${impact}-${area?.[0]}-${change.entityId}`}><td className="p-2"><span className={`rounded-full px-2 py-0.5 font-semibold ${impactClass[impact]}`}>{impact}</span></td><td className="p-2">{area ? labels.get(area[0]) : "Version"}</td><td className="p-2">{change.changeType}</td><td className="p-2">{change.entityId}</td><td className="p-2">{change.oldRevisionId || change.newRevisionId ? `${change.oldRevisionId ?? "—"} → ${change.newRevisionId ?? "—"}` : "—"}</td></tr>;
  })}</Fragment>)}</tbody></table></div>;
}

function ImpactGroups({ assessments, tasks, workspaceKey }: { assessments: import("../types/storyGovernance.type").StoryImpactAssessment[]; tasks: Awaited<ReturnType<typeof getBoardTasks>>; workspaceKey: string }) {
  const groups = (["CURRENT", "REVIEW_REQUIRED", "REBASE_REQUIRED"] as const).map((state) => [state, assessments.filter((assessment) => assessment.requirementsState === state)] as const).filter(([, items]) => items.length);
  return <div className="mt-3 space-y-3">{groups.map(([state, items]) => <section key={state} aria-label={`${state.replaceAll("_", " ")} impact`}><h4 className="text-xs font-semibold text-[#787774]">{state.replaceAll("_", " ")} ({items.length})</h4><ul className="mt-2 space-y-2">{items.map((assessment) => { const taskMatch = tasks.find((item) => item.id === assessment.taskId); return <li key={assessment._id} className="rounded-md border border-[#EAEAEA] p-3 text-xs"><p className="font-medium">{assessment.requirementsState.replaceAll("_", " ")} · {assessment.state}</p><p className="mt-1 text-[#787774]">Affected criteria: {assessment.affectedCriterionIds.join(", ") || "None"}</p>{taskMatch && <a className="mt-1 inline-block underline" href={`/workspaces/${workspaceKey}/board/key/${taskMatch.key}`}>{taskMatch.key}</a>}</li>; })}</ul></section>)}</div>;
}
