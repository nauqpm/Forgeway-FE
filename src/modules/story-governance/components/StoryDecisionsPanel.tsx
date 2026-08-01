"use client";

import { useEffect, useRef, useState } from "react";

import {
  WORKSPACE_PERMISSIONS,
  type WorkspacePermission,
} from "@/modules/workspace/shared/constants/workspacePermissions";
import { Modal, ModalFooter } from "@/shared/components/ui/Modal";
import { useStoryDecisions } from "../hooks/useStoryGovernance";
import type {
  DecisionOption,
  DecisionProposal,
  DecisionProposalInput,
  DecisionRecord,
  DecisionResolutionInput,
} from "../types/storyGovernance.type";

type Props = {
  workspaceId: string;
  contractId: string;
  permissions: WorkspacePermission[];
  selectedDraftId?: string;
};

type ProposalForm = {
  question: string;
  options: DecisionOption[];
  recommendation: string;
};

const emptyProposal = (): ProposalForm => ({
  question: "",
  options: [{ key: "", label: "" }],
  recommendation: "",
});

const errorText = () => "Could not complete this decision action. Try again.";

const validateProposal = (form: ProposalForm) => {
  const question = form.question.trim();
  if (!question) return "Question is required.";
  if (question.length > 100) return "Question must be 100 characters or fewer.";
  if (!form.options.length) return "Add at least one option.";
  if (form.options.some((option) => !option.key.trim() || !option.label.trim())) {
    return "Every option needs a key and label.";
  }
  if (form.options.some((option) => option.key.trim().length > 500)) {
    return "Option keys must be 500 characters or fewer.";
  }
  if (form.options.some((option) => option.label.trim().length > 10_000)) {
    return "Option labels must be 10,000 characters or fewer.";
  }
  const keys = form.options.map((option) => option.key.trim());
  if (new Set(keys).size !== keys.length) return "Option keys must be unique.";
  if (form.recommendation.trim().length > 10_000) {
    return "Recommendation must be 10,000 characters or fewer.";
  }
  return "";
};

const proposalInput = (form: ProposalForm): DecisionProposalInput => ({
  question: form.question.trim(),
  options: form.options.map((option) => ({
    key: option.key.trim(),
    label: option.label.trim(),
  })),
  ...(form.recommendation.trim() ? { recommendation: form.recommendation.trim() } : {}),
});

const proposalForm = (proposal: DecisionProposal): ProposalForm => ({
  question: proposal.question,
  options: proposal.options.map((option) => ({ ...option })),
  recommendation: proposal.recommendation ?? "",
});

const validateResolution = (
  proposal: DecisionProposal | undefined,
  form: DecisionResolutionInput,
) => {
  if (
    !proposal?.options.some((option) => option.key === form.selectedOption)
    || !form.rationale.trim()
  ) {
    return "Select a valid option and provide a rationale.";
  }
  if (form.rationale.trim().length > 2_000) {
    return "Rationale must be 2,000 characters or fewer.";
  }
  return "";
};

export default function StoryDecisionsPanel({
  workspaceId,
  contractId,
  permissions,
}: Props) {
  const api = useStoryDecisions(workspaceId, contractId);
  const [editing, setEditing] = useState<DecisionProposal | "new" | null>(null);
  const [proposal, setProposal] = useState<ProposalForm>(emptyProposal);
  const [approving, setApproving] = useState<DecisionProposal | null>(null);
  const [superseding, setSuperseding] = useState<DecisionRecord | null>(null);
  const [resolution, setResolution] = useState<DecisionResolutionInput>({
    selectedOption: "",
    rationale: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refreshedIntegrityRef = useRef("");
  const canPropose = permissions.includes(WORKSPACE_PERMISSIONS.DECISION_PROPOSE);
  const canApprove = permissions.includes(WORKSPACE_PERMISSIONS.DECISION_APPROVE);
  const proposals = api.proposals.data ?? [];
  const decisions = api.decisions.data ?? [];
  const recordsByProposal = new Map(decisions.map((record) => [record.sourceProposalId, record]));
  const missingRecordIds = proposals
    .filter((item) => item.state === "APPROVED" && !recordsByProposal.has(item._id))
    .map((item) => item._id)
    .sort();
  const integritySignature = missingRecordIds.join(",");

  useEffect(() => {
    if (!integritySignature || refreshedIntegrityRef.current === integritySignature) return;
    refreshedIntegrityRef.current = integritySignature;
    void api.refresh();
  }, [api, integritySignature]);

  const openProposalForm = (item: DecisionProposal | "new") => {
    setEditing(item);
    setProposal(item === "new" ? emptyProposal() : proposalForm(item));
    setError("");
  };

  const saveProposal = () => {
    const validation = validateProposal(proposal);
    if (validation) return setError(validation);
    const input = proposalInput(proposal);
    const onSuccess = () => {
      setEditing(null);
      setError("");
      setNotice(editing === "new" ? "Proposal created." : "Proposal updated.");
    };
    const onError = async () => {
      await api.refresh();
      setError(errorText());
    };
    if (editing === "new") api.createProposal.mutate(input, { onSuccess, onError });
    else if (editing) {
      api.updateProposal.mutate({ proposalId: editing._id, input }, { onSuccess, onError });
    }
  };

  const openResolution = (
    item: DecisionProposal,
    target: "approve" | "supersede",
    record?: DecisionRecord,
  ) => {
    setResolution({ selectedOption: "", rationale: "" });
    setError("");
    if (target === "approve") setApproving(item);
    else setSuperseding(record ?? null);
  };

  const approve = () => {
    if (!approving) return;
    const validation = validateResolution(approving, resolution);
    if (validation) return setError(validation);
    api.approveProposal.mutate(
      {
        proposalId: approving._id,
        input: { ...resolution, rationale: resolution.rationale.trim() },
      },
      {
        onSuccess: () => {
          setApproving(null);
          setError("");
          setNotice("Decision record created.");
        },
        onError: async () => {
          await api.refresh();
          setError(errorText());
        },
      },
    );
  };

  const supersede = () => {
    if (!superseding) return;
    const source = proposals.find((item) => item._id === superseding.sourceProposalId);
    const validation = validateResolution(source, resolution);
    if (validation) return setError(validation);
    api.supersedeDecision.mutate(
      {
        decisionId: superseding._id,
        input: { ...resolution, rationale: resolution.rationale.trim() },
      },
      {
        onSuccess: () => {
          setSuperseding(null);
          setError("");
          setNotice("Official decision superseded.");
        },
        onError: async () => {
          await api.refresh();
          setError(errorText());
        },
      },
    );
  };

  if (api.proposals.isLoading || api.decisions.isLoading) {
    return <section aria-label="Decisions loading" className="min-w-0 p-4 text-sm text-[#787774] dark:text-[#9B9A97]">Loading decisions…</section>;
  }
  if (api.proposals.isError || api.decisions.isError) {
    return <section role="alert" className="min-w-0 p-4 text-sm text-[#9F2F2D]">Decision history is unavailable.</section>;
  }

  const sourceFor = (record: DecisionRecord) =>
    proposals.find((item) => item._id === record.sourceProposalId);
  const orderedDecisions = [...decisions].sort(
    (left, right) =>
      new Date(left.decidedAt).getTime() - new Date(right.decidedAt).getTime(),
  );
  const resolutionProposal = approving
    ?? (superseding ? sourceFor(superseding) : undefined);

  return (
    <section aria-label="Story decisions" className="min-w-0 space-y-6 p-4 text-[#2F3437] dark:text-[#E8E8E7]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EAEAEA] pb-4 dark:border-white/[0.06]">
        <div>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[#787774] dark:text-[#9B9A97]">Decision governance</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">Proposals and official decisions</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#787774] dark:text-[#9B9A97]">
            Proposals remain provisional until approval creates an immutable Decision Record.
          </p>
        </div>
        {canPropose && (
          <button type="button" onClick={() => openProposalForm("new")} className="rounded-[6px] bg-[#111111] px-3 py-2 text-sm font-medium text-white active:scale-[0.98] dark:bg-[#E8E8E7] dark:text-[#111111]">
            New proposal
          </button>
        )}
      </header>

      {!editing && !approving && !superseding && (error || notice) && (
        <p role={error ? "alert" : "status"} className={`rounded-[8px] border px-3 py-2 text-sm ${error ? "border-[#F5C6C7] bg-[#FDEBEC] text-[#9F2F2D]" : "border-[#D5E4D2] bg-[#EDF3EC] text-[#346538]"}`}>
          {error || notice}
        </p>
      )}

      {missingRecordIds.length > 0 && (
        <p role="alert" className="rounded-[8px] border border-[#F5C6C7] bg-[#FDEBEC] p-3 text-sm text-[#9F2F2D]">
          An approved proposal is missing its Decision Record. The decision data is being refreshed.
        </p>
      )}

      <section aria-label="Decision proposals">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[#787774] dark:text-[#9B9A97]">Proposals</p>
            <h3 className="mt-1 font-semibold">Decision proposals</h3>
          </div>
          <span className="font-mono text-xs text-[#787774] dark:text-[#9B9A97]">{proposals.length}</span>
        </div>
        {proposals.length === 0 ? (
          <p className="mt-3 border-t border-[#EAEAEA] py-6 text-sm text-[#787774] dark:text-[#9B9A97]">No decision proposals yet.</p>
        ) : (
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {proposals.map((item) => {
              const record = recordsByProposal.get(item._id);
              const open = item.state === "OPEN";
              return (
                <article key={item._id} aria-label="Decision proposal" className="rounded-[10px] border border-[#EAEAEA] bg-white p-4 dark:border-white/[0.06] dark:bg-[#202020]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      {open ? (
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#956400]">OPEN · PROPOSAL</p>
                      ) : item.state === "APPROVED" ? (
                        <p aria-label="APPROVED · PROPOSAL RESOLVED" className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#346538]"><span>APPROVED</span><span aria-hidden="true"> · PROPOSAL RESOLVED</span></p>
                      ) : (
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#787774] dark:text-[#9B9A97]">{item.state} · PROPOSAL</p>
                      )}
                      <h4 className="mt-2 font-medium leading-6">{item.question}</h4>
                    </div>
                    <span className="font-mono text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">{item._id}</span>
                  </div>
                  {open && <p className="mt-2 text-sm text-[#956400]">Not an official decision</p>}
                  {item.state === "APPROVED" && record && (
                    <a href={`#decision-${record._id}`} className="mt-2 inline-block text-sm font-medium text-[#346538] underline decoration-[#BFD2BC] underline-offset-4">
                      Official decision: {record._id}
                    </a>
                  )}
                  {item.state === "APPROVED" && !record && (
                    <p className="mt-2 text-sm text-[#9F2F2D]">Decision Record missing.</p>
                  )}
                  <ul className="mt-3 space-y-1 border-t border-[#EAEAEA] pt-3 text-sm dark:border-white/[0.06]">
                    {item.options.map((option) => <li key={option.key}><span className="font-mono text-xs text-[#787774] dark:text-[#9B9A97]">{option.key}</span> — {option.label}</li>)}
                  </ul>
                  {item.recommendation && <p className="mt-3 text-sm text-[#787774] dark:text-[#9B9A97]">Recommendation: {item.recommendation}</p>}
                  {(open && (canPropose || canApprove)) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {canPropose && <button type="button" onClick={() => openProposalForm(item)} className="rounded-[6px] border border-[#EAEAEA] px-2.5 py-1.5 text-sm">Edit proposal</button>}
                      {canApprove && <button type="button" onClick={() => openResolution(item, "approve")} className="rounded-[6px] bg-[#111111] px-2.5 py-1.5 text-sm text-white dark:bg-[#E8E8E7] dark:text-[#111111]">Approve proposal</button>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section aria-label="Official decisions">
        <div className="border-t border-[#EAEAEA] pt-5 dark:border-white/[0.06]">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[#787774] dark:text-[#9B9A97]">Immutable ledger</p>
          <h3 className="mt-1 font-semibold">Official decisions</h3>
        </div>
        {orderedDecisions.length === 0 ? (
          <p className="mt-3 text-sm text-[#787774] dark:text-[#9B9A97]">No official decisions yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {orderedDecisions.map((record) => (
              <article id={`decision-${record._id}`} key={record._id} aria-label="Decision record" className="rounded-[10px] border border-[#EAEAEA] bg-[#F9F9F8] p-4 dark:border-white/[0.06] dark:bg-[#252525]">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#346538]">OFFICIAL DECISION</p>
                    <h4 className="mt-2 font-medium">{record.question}</h4>
                  </div>
                  <span className="font-mono text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">{record._id}</span>
                </div>
                <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                  <div><dt className="text-[#787774] dark:text-[#9B9A97]">Selected option</dt><dd className="font-medium">{record.selectedOption}</dd></div>
                  <div><dt className="text-[#787774] dark:text-[#9B9A97]">Source proposal</dt><dd className="font-mono text-xs">{record.sourceProposalId}</dd></div>
                  <div className="md:col-span-2"><dt className="text-[#787774] dark:text-[#9B9A97]">Rationale</dt><dd className="leading-6">{record.rationale}</dd></div>
                  <div><dt className="text-[#787774] dark:text-[#9B9A97]">Decided by</dt><dd>{record.decidedBy}</dd></div>
                  <div><dt className="text-[#787774] dark:text-[#9B9A97]">Decided at</dt><dd>{new Date(record.decidedAt).toLocaleString()}</dd></div>
                  {record.supersedesDecisionRecordId && <div className="md:col-span-2"><dt className="text-[#787774] dark:text-[#9B9A97]">Supersedes</dt><dd className="font-mono text-xs">{record.supersedesDecisionRecordId}</dd></div>}
                </dl>
                {canApprove && sourceFor(record) && (
                  <button type="button" onClick={() => openResolution(sourceFor(record)!, "supersede", record)} className="mt-4 rounded-[6px] border border-[#EAEAEA] px-2.5 py-1.5 text-sm">
                    Supersede decision
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New decision proposal" : "Edit decision proposal"}
        size="lg"
        footer={<ModalFooter onCancel={() => setEditing(null)} onConfirm={saveProposal} confirmLabel="Save proposal" loading={api.createProposal.isPending || api.updateProposal.isPending} />}
      >
        <ProposalFields form={proposal} onChange={setProposal} />
        {error && <p role="alert" className="mt-3 text-sm text-[#9F2F2D]">{error}</p>}
      </Modal>

      <Modal
        open={approving !== null}
        onClose={() => setApproving(null)}
        title="Approve proposal"
        footer={<ModalFooter onCancel={() => setApproving(null)} onConfirm={approve} confirmLabel="Approve decision" loading={api.approveProposal.isPending} />}
      >
        <ResolutionFields proposal={resolutionProposal} form={resolution} onChange={setResolution} />
        {error && <p role="alert" className="mt-3 text-sm text-[#9F2F2D]">{error}</p>}
      </Modal>

      <Modal
        open={superseding !== null}
        onClose={() => setSuperseding(null)}
        title="Supersede decision"
        footer={<ModalFooter onCancel={() => setSuperseding(null)} onConfirm={supersede} confirmLabel="Supersede decision" loading={api.supersedeDecision.isPending} />}
      >
        <ResolutionFields proposal={resolutionProposal} form={resolution} onChange={setResolution} />
        {error && <p role="alert" className="mt-3 text-sm text-[#9F2F2D]">{error}</p>}
      </Modal>
    </section>
  );
}

function ProposalFields({
  form,
  onChange,
}: {
  form: ProposalForm;
  onChange: (form: ProposalForm) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">Question<input aria-label="Question" value={form.question} onChange={(event) => onChange({ ...form, question: event.target.value })} maxLength={100} className="mt-1 w-full rounded-[6px] border border-[#EAEAEA] p-2 font-normal" /></label>
      <fieldset>
        <legend className="text-sm font-medium">Options</legend>
        <div className="mt-2 space-y-2">
          {form.options.map((option, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-[12rem_1fr_auto]">
              <input aria-label={`Option key ${index + 1}`} value={option.key} onChange={(event) => onChange({ ...form, options: form.options.map((item, current) => current === index ? { ...item, key: event.target.value } : item) })} maxLength={500} placeholder="Key" className="rounded-[6px] border border-[#EAEAEA] p-2 font-mono text-sm" />
              <input aria-label={`Option label ${index + 1}`} value={option.label} onChange={(event) => onChange({ ...form, options: form.options.map((item, current) => current === index ? { ...item, label: event.target.value } : item) })} maxLength={10_000} placeholder="Label" className="rounded-[6px] border border-[#EAEAEA] p-2 text-sm" />
              <button type="button" aria-label={`Remove option ${index + 1}`} disabled={form.options.length === 1} onClick={() => onChange({ ...form, options: form.options.filter((_, current) => current !== index) })} className="rounded-[6px] border border-[#EAEAEA] px-2 text-sm disabled:opacity-40">Remove</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onChange({ ...form, options: [...form.options, { key: "", label: "" }] })} className="mt-2 rounded-[6px] border border-[#EAEAEA] px-2.5 py-1.5 text-sm">Add option</button>
      </fieldset>
      <label className="block text-sm font-medium">Recommendation<textarea aria-label="Recommendation" value={form.recommendation} onChange={(event) => onChange({ ...form, recommendation: event.target.value })} maxLength={10_000} className="mt-1 min-h-20 w-full rounded-[6px] border border-[#EAEAEA] p-2 font-normal" /></label>
    </div>
  );
}

function ResolutionFields({
  proposal,
  form,
  onChange,
}: {
  proposal?: DecisionProposal;
  form: DecisionResolutionInput;
  onChange: (form: DecisionResolutionInput) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">Selected option<select aria-label="Selected option" value={form.selectedOption} onChange={(event) => onChange({ ...form, selectedOption: event.target.value })} className="mt-1 w-full rounded-[6px] border border-[#EAEAEA] p-2 font-normal"><option value="">Select an option</option>{(proposal?.options ?? []).map((option) => <option key={option.key} value={option.key}>{option.key} — {option.label}</option>)}</select></label>
      <label className="block text-sm font-medium">Rationale<textarea aria-label="Rationale" value={form.rationale} onChange={(event) => onChange({ ...form, rationale: event.target.value })} maxLength={2_000} className="mt-1 min-h-24 w-full rounded-[6px] border border-[#EAEAEA] p-2 font-normal" /></label>
    </div>
  );
}
