"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WORKSPACE_PERMISSIONS, type WorkspacePermission } from "@/modules/workspace/shared/constants/workspacePermissions";
import { Modal } from "@/shared/components/ui/Modal";
import { useStoryApprovals, useStoryVersionImpact } from "../hooks/useStoryGovernance";
import type { ApprovalRequest, StoryContract, StoryVersion } from "../types/storyGovernance.type";
import { clearOperationKey, getOperationKey } from "../utils/storyGovernance";

export type StoryApprovalsPanelProps = {
  workspaceId: string;
  contract: StoryContract;
  versions: StoryVersion[];
  permissions: WorkspacePermission[];
  onOpenVersion?: (versionId: string) => void;
};

type Resolution = { kind: "approve" | "reject"; request: ApprovalRequest; version: StoryVersion } | null;
const errorCode = (error: unknown) => (error as { response?: { data?: { code?: string } } }).response?.data?.code;
const approvalOperation = (workspaceId: string, contractId: string, resolution: NonNullable<Resolution>) =>
  `approve:${workspaceId}:${contractId}:${resolution.version._id}:${resolution.request._id}`;

export default function StoryApprovalsPanel({ workspaceId, contract, versions, permissions, onOpenVersion }: StoryApprovalsPanelProps) {
  const api = useStoryApprovals(workspaceId, contract._id, permissions.includes(WORKSPACE_PERMISSIONS.STORY_READ));
  const [resolution, setResolution] = useState<Resolution>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [approvedVersionId, setApprovedVersionId] = useState<string>();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const canRequest = contract.status === "active" && permissions.includes(WORKSPACE_PERMISSIONS.STORY_SUBMIT);
  const canResolve = contract.status === "active" && permissions.includes(WORKSPACE_PERMISSIONS.STORY_APPROVE);
  const canReadImpact = permissions.includes(WORKSPACE_PERMISSIONS.STORY_READ_IMPACT);
  const impact = useStoryVersionImpact(workspaceId, contract._id, approvedVersionId, canReadImpact);
  const requestsByVersion = useMemo(() => new Map((api.approvals.data?.requests ?? []).filter((request) => request.state === "PENDING").map((request) => [request.storyVersionId, request])), [api.approvals.data?.requests]);
  const history = useMemo(() => [...(api.approvals.data?.requests ?? [])].sort((left, right) => (left.createdAt ?? left.resolvedAt ?? "").localeCompare(right.createdAt ?? right.resolvedAt ?? "")), [api.approvals.data?.requests]);

  useEffect(() => { if (resolution) confirmRef.current?.focus(); }, [resolution]);
  const close = () => {
    if (resolution?.kind === "approve") clearOperationKey(approvalOperation(workspaceId, contract._id, resolution));
    setResolution(null);
    setReason("");
  };
  const closeAfterFailure = () => { setResolution(null); setReason(""); };
  const request = async (versionId: string) => {
    setApprovedVersionId(undefined);
    setMessage("");
    try { await api.requestApproval.mutateAsync(versionId); }
    catch { setMessage("Approval is already pending or could not be requested. Refresh and try again."); }
  };
  const approve = async () => {
    if (!resolution || resolution.kind !== "approve") return;
    const operation = approvalOperation(workspaceId, contract._id, resolution);
    const operationKey = getOperationKey(operation);
    setApprovedVersionId(undefined);
    setMessage("");
    try {
      const result = await api.approveVersion.mutateAsync({ versionId: resolution.version._id, input: { approvalRequestId: resolution.request._id, expectedCurrentVersionId: contract.currentApprovedStoryVersionId ?? null }, operationKey });
      close();
      if (!result.approved) return setMessage("Approval recorded. Another approval is still required.");
      setApprovedVersionId(resolution.version._id);
      setMessage("Version approved.");
      onOpenVersion?.(resolution.version._id);
    } catch (error) {
      closeAfterFailure();
      const code = errorCode(error);
      if (code === "APPROVAL_VERSION_CONFLICT" || code === "IDEMPOTENCY_CONFLICT") {
        clearOperationKey(operation);
        await api.refreshApprovalAuthority(resolution.version._id);
        setMessage(code === "IDEMPOTENCY_CONFLICT"
          ? "Approval operation conflicted. Refreshed the current record; review it before trying again."
          : "Approval state changed. Refreshed the current record; review it before trying again.");
      } else if (code === "APPROVAL_POLICY_NOT_SATISFIED") setMessage("An independent approval is still required before this Version can be approved.");
      else setMessage("Unable to approve this Version. Refresh and try again.");
    }
  };
  const reject = async () => {
    if (!resolution || resolution.kind !== "reject") return;
    setApprovedVersionId(undefined);
    setMessage("");
    try { await api.rejectVersion.mutateAsync({ versionId: resolution.version._id, input: { approvalRequestId: resolution.request._id, ...(reason.trim() ? { reason: reason.trim() } : {}) } }); close(); setMessage("Version rejected and retained in approval history."); }
    catch { setMessage("Unable to reject this Version. Refresh and try again."); }
  };
  const selectedVersion = resolution?.version;
  const impactCopy = approvedVersionId && canReadImpact && !impact.isLoading && !impact.isError ? ` ${impact.data?.length ?? 0} Task impact assessment${impact.data?.length === 1 ? " requires" : "s require"} review.` : "";
  const messageRole = message.startsWith("Unable") || message.startsWith("Approval is") || message.startsWith("Approval state") || message.startsWith("Approval operation") ? "alert" : "status";

  if (api.approvals.isError) return <section aria-label="Story approvals" className="p-4"><div role="alert" className="rounded-md border border-[#F5C6C7] bg-[#FDEBEC] p-4 text-sm text-[#9F2F2D]">Approval history is unavailable.<button type="button" onClick={() => void api.approvals.refetch()} className="ml-3 underline">Retry</button></div></section>;
  return <section aria-label="Story approvals" className="space-y-4 p-4"><header><h3 className="text-sm font-semibold">Approval history</h3><p className="text-xs text-[#787774]">Immutable approval requests and decisions for this Story contract.</p></header>
    {message && <p role={messageRole} className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-3 text-sm text-[#343434]">{message}{impactCopy}</p>}
    {api.approvals.isLoading ? <p className="text-sm text-[#787774]">Loading approvals…</p> : <>
      <div className="space-y-2">{history.length === 0 ? <p className="rounded-md border border-dashed border-[#EAEAEA] p-4 text-sm text-[#787774]">No approval requests yet.</p> : history.map((item) => { const linked = versions.find((version) => version._id === item.storyVersionId); const record = (api.approvals.data?.records ?? []).find((candidate) => candidate.approvalRequestId === item._id); return <article key={item._id} aria-label="Approval history record" className="rounded-md border border-[#EAEAEA] p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{linked ? `Version ${linked.versionNumber}` : "Unavailable Version"}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.state === "PENDING" ? "bg-[#FBF3DB] text-[#956400]" : item.state === "REJECTED" ? "bg-[#FDEBEC] text-[#9F2F2D]" : "bg-[#EDF3EC] text-[#346538]"}`}>{item.state}</span></div>{record && <p className="mt-2 text-xs text-[#787774]">{record.decision}{record.reason ? ` · ${record.reason}` : ""}</p>}</article>; })}</div>
      <div className="space-y-2">{versions.slice().sort((left, right) => right.versionNumber - left.versionNumber).map((version) => { const pending = requestsByVersion.get(version._id); if (contract.currentApprovedStoryVersionId === version._id) return null; return <div key={version._id} className="flex items-center justify-between rounded-md border border-[#EAEAEA] p-3"><span className="text-sm">Version {version.versionNumber}</span><div className="flex gap-2">{canRequest && <button type="button" onClick={() => void request(version._id)} disabled={api.requestApproval.isPending} className="rounded-md border border-[#EAEAEA] px-2 py-1 text-xs disabled:opacity-40">Request approval for Version {version.versionNumber}</button>}{canResolve && pending && <><button type="button" onClick={() => setResolution({ kind: "approve", request: pending, version })} className="rounded-md bg-[#111111] px-2 py-1 text-xs text-white dark:bg-[#E8E8E7] dark:text-[#111111]">Approve Version {version.versionNumber}</button><button type="button" onClick={() => setResolution({ kind: "reject", request: pending, version })} className="rounded-md border border-[#F5C6C7] px-2 py-1 text-xs text-[#9F2F2D]">Reject Version {version.versionNumber}</button></>}</div></div>; })}</div>
    </>}
    <Modal open={Boolean(resolution)} onClose={close} title={resolution?.kind === "approve" ? "Approve Version" : "Reject Version"} description={selectedVersion ? `${contract.key} · Version ${selectedVersion.versionNumber}${resolution?.kind === "approve" ? ` · Current approved: ${contract.currentApprovedStoryVersionId ? `Version ${versions.find((version) => version._id === contract.currentApprovedStoryVersionId)?.versionNumber ?? "unavailable"}` : "None"}` : ""}` : undefined} footer={<><button type="button" onClick={close} className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#EAEAEA] bg-[#F9F9F8] px-3 text-xs font-medium">Cancel</button><button ref={confirmRef} type="button" onClick={resolution?.kind === "approve" ? approve : reject} disabled={api.approveVersion.isPending || api.rejectVersion.isPending} className={`inline-flex h-8 items-center justify-center rounded-[6px] px-3 text-xs font-medium disabled:opacity-40 ${resolution?.kind === "reject" ? "border border-[#F5C6C7] bg-[#FDEBEC] text-[#9F2F2D]" : "bg-[#111111] text-white dark:bg-[#E8E8E7] dark:text-[#111111]"}`}>{resolution?.kind === "approve" ? "Approve Version" : "Reject Version"}</button></>}>
      {resolution?.kind === "approve" ? <p className="text-sm text-[#787774]">Approve this immutable Version using the current approved Version as the concurrency check.</p> : <label className="text-sm font-medium">Reason<textarea aria-label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={100} className="mt-2 min-h-20 w-full rounded-md border border-[#EAEAEA] p-2 text-sm" /></label>}
    </Modal>
  </section>;
}
