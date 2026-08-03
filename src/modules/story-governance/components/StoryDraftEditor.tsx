"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  WORKSPACE_PERMISSIONS,
  type WorkspacePermission,
} from "@/modules/workspace/shared/constants/workspacePermissions";
import {
  useStoryDecisions,
  useStoryDrafts,
  useStoryGovernance,
} from "../hooks/useStoryGovernance";
import type {
  AcceptanceCriterionInput,
  RawRequirement,
  StoryContent,
  StoryContentEntry,
  StoryContract,
  StoryDraft,
  StoryDraftRequirementLinkInput,
} from "../types/storyGovernance.type";
import {
  clearOperationKey,
  getOperationKey,
  setDraftNavigationDirty,
  type DraftFormState,
  validateDraftForm,
} from "../utils/storyGovernance";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";

export type StoryDraftEditorProps = {
  workspaceId: string;
  contract: StoryContract;
  draftId: string;
  permissions: WorkspacePermission[];
  onOpenVersion(versionId: string): void;
};

const contentFields: Array<[
  keyof Pick<StoryContent, "scope" | "outOfScope" | "businessRules" | "permissionRequirements" | "constraints" | "dependencies" | "risks">,
  string,
]> = [
  ["scope", "Scope"],
  ["outOfScope", "Out of scope"],
  ["businessRules", "Business rules"],
  ["permissionRequirements", "Permission requirements"],
  ["constraints", "Constraints"],
  ["dependencies", "Dependencies"],
  ["risks", "Risks"],
];
const roles: StoryDraftRequirementLinkInput["role"][] = ["PRIMARY", "SUPPORTING", "CONSTRAINT", "CONFLICT"];
const emptyCriterion = (): AcceptanceCriterionInput => ({
  key: "",
  priority: "MUST",
  statement: "",
  given: "",
  when: "",
  then: "",
  verificationMethod: "",
});
const newRow = (): StoryContentEntry => ({ id: crypto.randomUUID(), text: "" });
const emptyContent = (): StoryContent => ({
  problem: "",
  expectedOutcome: "",
  actors: [],
  scope: [],
  outOfScope: [],
  businessRules: [],
  permissionRequirements: [],
  constraints: [],
  dependencies: [],
  risks: [],
});
const formFrom = (draft: StoryDraft): DraftFormState => ({
  content: {
    ...emptyContent(),
    ...draft.content,
    actors: Array.isArray(draft.content?.actors) ? [...draft.content.actors] : [],
    ...Object.fromEntries(
      contentFields.map(([field]) => [
        field,
        Array.isArray(draft.content?.[field])
          ? draft.content[field].map((entry) => ({ ...entry }))
          : [],
      ]),
    ),
  },
  requirementLinks: (draft.requirementLinks ?? []).map((link) => ({ ...link })),
  criterionInputs: (draft.criterionInputs ?? []).map((criterion) => ({ ...criterion })),
  decisionProposalIds: [...(draft.decisionProposalIds ?? [])],
});
const errorMessage = (error: unknown) => {
  const code = (error as { response?: { data?: { code?: string } } }).response?.data?.code;
  const knownMessages: Record<string, string> = {
    DRAFT_REVISION_CONFLICT: "This draft changed elsewhere. Review the latest draft before saving again.",
    DRAFT_BASE_VERSION_STALE: "A newer version is approved. Rebase this draft before submitting.",
    PRIMARY_REQUIREMENT_REQUIRED: "Keep exactly one primary requirement before submitting.",
    CRITERION_KEY_DUPLICATE: "Acceptance criterion keys must be unique.",
    INVALID_ACCEPTANCE_CRITERION: "Review the invalid acceptance criterion before submitting.",
    IDEMPOTENCY_CONFLICT: "This draft action conflicts with a completed operation. Refresh and try again.",
  };
  return {
    code,
    text: code ? knownMessages[code] ?? "Could not complete this draft action. Try again." : "Could not complete this draft action. Try again.",
  };
};

export default function StoryDraftEditor({
  workspaceId,
  contract,
  draftId,
  permissions,
  onOpenVersion,
}: StoryDraftEditorProps) {
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(draftId || null);
  const { requirements } = useStoryGovernance(workspaceId);
  const draftApi = useStoryDrafts(workspaceId, contract._id, selectedDraftId);
  const decisionApi = useStoryDecisions(
    workspaceId,
    contract._id,
    permissions.includes(WORKSPACE_PERMISSIONS.STORY_READ),
  );
  const [form, setForm] = useState<DraftFormState | null>(null);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState(false);
  const [serverRevision, setServerRevision] = useState<number | null>(null);
  const [confirmDraftId, setConfirmDraftId] = useState<string | null>(null);
  const [submitConfirming, setSubmitConfirming] = useState(false);
  const problemRef = useRef<HTMLTextAreaElement>(null);
  const submitPendingRef = useRef(false);
  const autoSelectDraftRef = useRef(!draftId);
  const refreshedDecisionIntegrityRef = useRef("");
  const canCreate = contract.status === "active" && permissions.includes(WORKSPACE_PERMISSIONS.STORY_CREATE_DRAFT);
  const canEdit = contract.status === "active" && permissions.includes(WORKSPACE_PERMISSIONS.STORY_EDIT_DRAFT);
  const canSubmit = contract.status === "active" && permissions.includes(WORKSPACE_PERMISSIONS.STORY_SUBMIT);
  const draft = draftApi.draft.data;
  const activeRequirements = useMemo(
    () => (requirements.data ?? []).filter((requirement) => (requirement.status ?? "active") === "active"),
    [requirements.data],
  );
  const operation = selectedDraftId ? `submit:${workspaceId}:${contract._id}:${selectedDraftId}` : "";
  const decisionRecordsByProposal = useMemo(
    () => new Map((decisionApi.decisions.data ?? []).map((record) => [record.sourceProposalId, record])),
    [decisionApi.decisions.data],
  );
  const approvedMissingRecordIds = useMemo(
    () => (decisionApi.proposals.data ?? [])
      .filter((proposal) => proposal.state === "APPROVED" && !decisionRecordsByProposal.has(proposal._id))
      .map((proposal) => proposal._id)
      .sort(),
    [decisionApi.proposals.data, decisionRecordsByProposal],
  );
  const decisionIntegritySignature = approvedMissingRecordIds.join(",");

  useEffect(() => {
    if (!draft || draft._id === loadedDraftId) return;
    setForm(formFrom(draft));
    setLoadedDraftId(draft._id);
    setDirty(false);
    setConflict(false);
    setServerRevision(null);
    setError("");
  }, [draft, loadedDraftId]);

  useEffect(() => {
    if (!selectedDraftId && autoSelectDraftRef.current && draftApi.drafts.data?.length) {
      autoSelectDraftRef.current = false;
      setSelectedDraftId(
        draftApi.drafts.data.find((item) => item.status === "active")?._id
          ?? draftApi.drafts.data[0]._id,
      );
    }
  }, [draftApi.drafts.data, selectedDraftId]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    setDraftNavigationDirty(dirty);
    return () => setDraftNavigationDirty(false);
  }, [dirty]);

  useEffect(() => {
    if (
      !decisionIntegritySignature
      || refreshedDecisionIntegrityRef.current === decisionIntegritySignature
    ) return;
    refreshedDecisionIntegrityRef.current = decisionIntegritySignature;
    void decisionApi.refresh();
  }, [decisionApi, decisionIntegritySignature]);

  const change = (next: DraftFormState) => {
    if (operation) clearOperationKey(operation);
    setSubmitConfirming(false);
    setForm(next);
    setDirty(true);
    setError("");
  };
  const updateContent = (field: keyof StoryContent, value: StoryContent[keyof StoryContent]) => {
    if (form) change({ ...form, content: { ...form.content, [field]: value } });
  };
  const selectDraft = (nextId: string) => {
    if (nextId === selectedDraftId) return;
    if (dirty) return setConfirmDraftId(nextId);
    autoSelectDraftRef.current = false;
    setSelectedDraftId(nextId);
    setLoadedDraftId(null);
  };
  const create = () => draftApi.createDraft.mutate(undefined, {
    onSuccess: (created) => {
      autoSelectDraftRef.current = false;
      setSelectedDraftId(created._id);
      setLoadedDraftId(created._id);
      setForm(formFrom(created));
      setDirty(false);
      setConflict(false);
      setServerRevision(null);
      setNotice("Draft created.");
    },
    onError: (cause) => setError(errorMessage(cause).text),
  });
  const requestCreate = () => dirty ? setConfirmDraftId("__create__") : create();
  const reload = async () => {
    const latest = await draftApi.draft.refetch();
    if (!latest.data) return;
    setForm(formFrom(latest.data));
    setLoadedDraftId(latest.data._id);
    setDirty(false);
    setConflict(false);
    setServerRevision(null);
    setError("");
  };
  const copyChanges = async () => {
    if (form && navigator.clipboard) await navigator.clipboard.writeText(JSON.stringify(form, null, 2));
    setNotice("Local changes copied.");
  };
  const focusCriterion = () =>
    document.querySelector<HTMLInputElement>('[aria-invalid="true"], [id^="criterion-key-"]')?.focus();
  const focusRequirement = () => document.getElementById("requirement-0")?.focus();

  const validate = (includeDecisionAttachments = true) => {
    if (!form || !draft) return false;
    const errors = validateDraftForm(
      includeDecisionAttachments ? form : { ...form, decisionProposalIds: [] },
      new Set(activeRequirements.map((item) => item._id)),
      new Set(draft.requirementLinks.map((link) => link.requirementId)),
    );
    if (!errors.length) return true;
    setError(errors[0]);
    if (errors.some((item) => item.toLowerCase().includes("criterion"))) focusCriterion();
    else if (errors.some((item) => item.includes("Requirement") || item.includes("primary"))) focusRequirement();
    else problemRef.current?.focus();
    return false;
  };

  const save = () => {
    if (!draft || !form || !canEdit || conflict || !validate(false)) return;
    draftApi.updateDraft.mutate(
      {
        expectedDraftRevision: draft.draftRevision,
        content: form.content,
        requirementLinks: form.requirementLinks,
        criterionInputs: form.criterionInputs,
      },
      {
        onSuccess: (saved) => {
          setForm(formFrom(saved));
          setLoadedDraftId(saved._id);
          setDirty(false);
          setNotice(`Saved revision ${saved.draftRevision}.`);
        },
        onError: async (cause) => {
          const result = errorMessage(cause);
          if (result.code !== "DRAFT_REVISION_CONFLICT") return setError(result.text);
          setConflict(true);
          const latest = await draftApi.draft.refetch();
          setServerRevision(latest.data?.draftRevision ?? null);
          setError("This draft changed elsewhere. Review the latest draft before saving again.");
        },
      },
    );
  };

  const updateDecisionAttachments = (nextIds: string[]) => {
    if (!draft || !form || !canEdit || draft.status !== "active") return;
    const previousIds = [...form.decisionProposalIds];
    setForm({ ...form, decisionProposalIds: [...nextIds] });
    draftApi.updateDraft.mutate(
      {
        expectedDraftRevision: draft.draftRevision,
        decisionProposalIds: nextIds,
      },
      {
        onSuccess: () => {
          setError("");
          setNotice("Decision attachments updated.");
        },
        onError: async (cause) => {
          setForm((current) => current
            ? { ...current, decisionProposalIds: previousIds }
            : current);
          const result = errorMessage(cause);
          if (result.code === "DRAFT_REVISION_CONFLICT") {
            setConflict(true);
            await Promise.all([draftApi.draft.refetch(), decisionApi.refresh()]);
          }
          setError(result.text);
        },
      },
    );
  };

  const submit = () => {
    if (!draft || draft.status !== "active" || !form || !canSubmit || conflict || submitPendingRef.current || draftApi.submitDraft.isPending || !validate()) return;
    submitPendingRef.current = true;
    const operationKey = getOperationKey(operation);
    draftApi.submitDraft.mutate(operationKey, {
      onSuccess: async (version) => {
        submitPendingRef.current = false;
        setSubmitConfirming(false);
        clearOperationKey(operation);
        setDirty(false);
        await draftApi.invalidateAfterSubmit();
        setNotice("Draft submitted.");
        onOpenVersion(version._id);
      },
      onError: async (cause) => {
        submitPendingRef.current = false;
        setSubmitConfirming(false);
        const result = errorMessage(cause);
        if (result.code === "IDEMPOTENCY_CONFLICT") {
          clearOperationKey(operation);
          await draftApi.refreshAuthoritative();
        }
        if (result.code === "DRAFT_BASE_VERSION_STALE") await draftApi.refreshAuthoritative();
        if (result.code === "PRIMARY_REQUIREMENT_REQUIRED") focusRequirement();
        if (result.code === "CRITERION_KEY_DUPLICATE" || result.code === "INVALID_ACCEPTANCE_CRITERION") focusCriterion();
        setError(
          result.code === "DRAFT_BASE_VERSION_STALE"
            ? "A newer version is approved. Rebase this draft before submitting."
            : result.text,
        );
      },
    });
  };

  const abandon = () => {
    if (!draft || !window.confirm("Abandon this draft? This cannot be undone.")) return;
    draftApi.abandonDraft.mutate(draft._id, {
      onSuccess: async () => {
        autoSelectDraftRef.current = false;
        await draftApi.invalidateDrafts(draft._id);
        setSelectedDraftId(null);
        setLoadedDraftId(null);
        setForm(null);
        setNotice("Draft abandoned.");
      },
      onError: (cause) => setError(errorMessage(cause).text),
    });
  };

  const rebase = () => {
    if (!draft) return;
    draftApi.rebaseDraft.mutate(draft._id, {
      onSuccess: async (rebased) => {
        await draftApi.invalidateDrafts(draft._id, rebased._id);
        setSelectedDraftId(rebased._id);
        setLoadedDraftId(rebased._id);
        setForm(formFrom(rebased));
        setDirty(false);
        setConflict(false);
        setServerRevision(null);
        setNotice("Draft rebased. Review any reported conflicts before saving.");
      },
      onError: (cause) => setError(errorMessage(cause).text),
    });
  };

  if (draftApi.drafts.isLoading || (selectedDraftId && draftApi.draft.isLoading)) {
    return <section aria-label="Draft editor loading" className="min-w-0 animate-pulse p-4"><div className="h-8 w-48 rounded bg-[var(--color-surface-2)]" /></section>;
  }
  if (draftApi.drafts.isError || (selectedDraftId && draftApi.draft.isError)) {
    return <section role="alert" className="p-4 text-sm text-red-700">Drafts could not be loaded. Refresh the page to try again.</section>;
  }
  if (!selectedDraftId) {
    return <section aria-label="Story draft editor" className="min-w-0 p-4"><p className="text-sm text-[var(--color-ink-2)]">No Draft selected.</p><div className="mt-3 flex flex-wrap gap-2">{(draftApi.drafts.data ?? []).length > 0 && <><label className="sr-only" htmlFor="draft-list-selector">Select an existing draft</label><select id="draft-list-selector" value="" onChange={(event) => selectDraft(event.target.value)} className="rounded-md border p-2 text-sm"><option value="">Select an existing draft</option>{(draftApi.drafts.data ?? []).map((item) => <option key={item._id} value={item._id}>{item.status} · r{item.draftRevision}</option>)}</select></>}{canCreate && <Button type="button" onClick={requestCreate} disabled={draftApi.createDraft.isPending}>Create draft</Button>}</div></section>;
  }
  if (!draft || !form) return null;

  const readOnly = draft.status !== "active" || !canEdit;
  const duplicateCriterionKeys = new Set(
    form.criterionInputs
      .map((criterion) => criterion.key.trim())
      .filter((key, index, keys) => key && keys.indexOf(key) !== index),
  );
  const unresolvedConflicts = (draft.rebaseConflicts ?? []).filter((item) => item.resolution === "UNRESOLVED");
  const proposals = decisionApi.proposals.data ?? [];
  const decisionDataUnavailable = decisionApi.proposals.isError || decisionApi.decisions.isError;
  const selectableDecisionIds = new Set(
    proposals
      .filter((proposal) =>
        proposal.state === "APPROVED"
        && decisionRecordsByProposal.has(proposal._id))
      .map((proposal) => proposal._id),
  );
  const ineligibleAttachedIds = decisionDataUnavailable
    ? []
    : form.decisionProposalIds.filter((proposalId) => !selectableDecisionIds.has(proposalId));
  const discardEdits = () => {
    const next = confirmDraftId;
    setDirty(false);
    setConfirmDraftId(null);
    if (next === "__create__") create();
    else if (next) {
      setSelectedDraftId(next);
      setLoadedDraftId(null);
    }
  };

  return <section aria-label="Story draft editor" className="min-w-0 space-y-5 p-4">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
      <div>
        <p className="font-mono text-xs text-[var(--color-ink-2)]">Draft revision {draft.draftRevision}</p>
        <h2 className="mt-1 text-lg font-semibold">{contract.title}</h2>
        {draft.baseStoryVersionId && <p className="mt-1 text-xs text-[var(--color-ink-2)]">Based on approved version {draft.baseStoryVersionId}</p>}
        <p className="mt-1 text-sm text-[var(--color-ink-2)]">{draft.status === "active" ? "Edit explicitly, then save or submit." : `This ${draft.status} draft is read-only.`}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="draft-selector">Select draft</label>
        <select id="draft-selector" value={selectedDraftId} onChange={(event) => selectDraft(event.target.value)} disabled={submitConfirming || draftApi.submitDraft.isPending} className="rounded-md border p-2 text-sm disabled:opacity-50">
          {(draftApi.drafts.data ?? []).map((item) => <option key={item._id} value={item._id}>{item.status} · r{item.draftRevision}</option>)}
        </select>
        {canCreate && <button type="button" onClick={requestCreate} disabled={submitConfirming || draftApi.createDraft.isPending || draftApi.submitDraft.isPending} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">New draft</button>}
      </div>
    </header>

    {(error || notice) && <p role={error ? "alert" : "status"} className={error ? "rounded-md border border-red-200 p-3 text-sm text-red-700" : "text-sm text-emerald-700"}>{error || notice}</p>}
    {conflict && <div className="rounded-md border border-amber-200 bg-amber-50 p-3"><p className="text-sm">{serverRevision ? `Server revision ${serverRevision} is available.` : "A newer server revision is available."}</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={reload} className="rounded border px-2 py-1 text-sm">Reload server draft</button><button type="button" onClick={copyChanges} className="rounded border px-2 py-1 text-sm">Copy my changes</button></div></div>}
    {unresolvedConflicts.length > 0 && <div role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm"><p className="font-medium">{unresolvedConflicts.length} unresolved rebase {unresolvedConflicts.length === 1 ? "conflict" : "conflicts"}</p><ul className="mt-1 list-disc pl-5">{unresolvedConflicts.map((item, index) => <li key={`${item.category}-${item.entityId}-${index}`}>{item.category}: {item.entityId} ({item.impactLevel})</li>)}</ul></div>}
    {approvedMissingRecordIds.length > 0 && <div role="status" className="rounded-[8px] border border-[#F5C6C7] bg-[#FDEBEC] p-3 text-sm text-[#9F2F2D]">An approved proposal is missing its Decision Record. Decision data is being refreshed.</div>}
    {ineligibleAttachedIds.length > 0 && <div role="alert" className="rounded-[8px] border border-[#F5C6C7] bg-[#FDEBEC] p-3 text-sm text-[#9F2F2D]">This Draft contains an ineligible decision attachment. Remove or repair it before submitting.</div>}
    <Modal
      open={Boolean(confirmDraftId)}
      onClose={() => setConfirmDraftId(null)}
      title="Discard draft edits"
      hideCloseButton
      footer={<><button type="button" onClick={() => setConfirmDraftId(null)} className="rounded border px-2 py-1">Keep editing</button><button type="button" onClick={discardEdits} className="rounded border px-2 py-1">Discard edits</button></>}
    >
      <p className="text-sm">You have unsaved edits.</p>
    </Modal>
    <Modal
      open={submitConfirming}
      onClose={() => {
        if (draftApi.submitDraft.isPending) return;
        clearOperationKey(operation);
        setSubmitConfirming(false);
      }}
      title="Confirm draft submission"
      hideCloseButton
      closeOnBackdrop={!draftApi.submitDraft.isPending}
      footer={<><Button type="button" variant="secondary" onClick={() => { clearOperationKey(operation); setSubmitConfirming(false); }} disabled={draftApi.submitDraft.isPending}>Cancel submit</Button><Button type="button" onClick={submit} disabled={draftApi.submitDraft.isPending}>Confirm submit</Button></>}
    >
      <p className="text-sm">Submit this Draft as an immutable Version?</p>
    </Modal>
    {dirty && <p className="text-sm text-amber-700">Save changes before submitting.</p>}

    <fieldset disabled={readOnly || submitConfirming || draftApi.updateDraft.isPending || draftApi.submitDraft.isPending} className="space-y-5 disabled:opacity-70">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">Problem<textarea ref={problemRef} aria-label="Problem" value={form.content.problem} onChange={(event) => updateContent("problem", event.target.value)} maxLength={100000} className="mt-1 min-h-28 w-full rounded-md border p-2 font-normal" /></label>
        <label className="text-sm font-medium">Expected outcome<textarea aria-label="Expected outcome" value={form.content.expectedOutcome} onChange={(event) => updateContent("expectedOutcome", event.target.value)} maxLength={100000} className="mt-1 min-h-28 w-full rounded-md border p-2 font-normal" /></label>
      </div>
      <ListEditor label="Actors" values={form.content.actors} onChange={(actors) => updateContent("actors", actors)} />
      <div className="grid gap-4 xl:grid-cols-2">
        {contentFields.map(([field, label]) => <EntryEditor key={field} label={label} values={form.content[field]} onChange={(values) => updateContent(field, values)} />)}
      </div>

      <fieldset>
        <legend className="font-medium">Requirement links</legend>
        <div className="mt-2 space-y-3">
          {form.requirementLinks.map((link, index) => <div key={index} className="grid gap-2 rounded-md border p-3 xl:grid-cols-[1fr_10rem_1fr_auto]">
            <label className="sr-only" htmlFor={`requirement-${index}`}>Requirement {index + 1}</label>
            <select id={`requirement-${index}`} value={link.requirementId} onChange={(event) => change({ ...form, requirementLinks: form.requirementLinks.map((item, current) => current === index ? { ...item, requirementId: event.target.value } : item) })} className="rounded border p-2">
              <option value="">Select requirement</option>
              {[...activeRequirements, ...(requirements.data ?? []).filter((item) => item.status === "archived" && item._id === link.requirementId)].map((item: RawRequirement) => <option key={item._id} value={item._id}>{item.key} — {item.title}{item.status === "archived" ? " (archived)" : ""}</option>)}
            </select>
            <select aria-label={`Relationship ${index + 1}`} value={link.role} onChange={(event) => change({ ...form, requirementLinks: form.requirementLinks.map((item, current) => current === index ? { ...item, role: event.target.value as StoryDraftRequirementLinkInput["role"] } : item) })} className="rounded border p-2">{roles.map((role) => <option key={role}>{role}</option>)}</select>
            <label className="sr-only" htmlFor={`evidence-${index}`}>Evidence note {index + 1}</label>
            <input id={`evidence-${index}`} value={link.evidenceNote ?? ""} onChange={(event) => change({ ...form, requirementLinks: form.requirementLinks.map((item, current) => current === index ? { ...item, evidenceNote: event.target.value } : item) })} maxLength={2000} placeholder="Evidence note" className="rounded border p-2" />
            {!readOnly && <button type="button" aria-label={`Remove requirement link ${index + 1}`} onClick={() => change({ ...form, requirementLinks: form.requirementLinks.filter((_, current) => current !== index) })} className="rounded border px-2">Remove</button>}
          </div>)}
        </div>
        {!readOnly && <button type="button" onClick={() => change({ ...form, requirementLinks: [...form.requirementLinks, { requirementId: "", role: "SUPPORTING", evidenceNote: "" }] })} className="mt-2 rounded border px-2 py-1 text-sm">Add requirement link</button>}
      </fieldset>

      <fieldset>
        <legend className="font-medium">Acceptance criteria</legend>
        <div className="mt-2 space-y-3">
          {form.criterionInputs.map((criterion, index) => {
            const duplicate = duplicateCriterionKeys.has(criterion.key.trim());
            const update = (patch: Partial<AcceptanceCriterionInput>) => change({ ...form, criterionInputs: form.criterionInputs.map((item, current) => current === index ? { ...item, ...patch } : item) });
            return <div key={index} className="grid gap-2 rounded-md border p-3 md:grid-cols-2">
              <label className="text-sm">Key<input id={`criterion-key-${index}`} aria-label={`Criterion key ${index + 1}`} aria-invalid={duplicate} value={criterion.key} onChange={(event) => update({ key: event.target.value })} maxLength={100} className="mt-1 w-full rounded border p-2" /></label>
              <label className="text-sm">Priority<select aria-label={`Criterion priority ${index + 1}`} value={criterion.priority} onChange={(event) => update({ priority: event.target.value as AcceptanceCriterionInput["priority"] })} className="mt-1 w-full rounded border p-2"><option>MUST</option><option>SHOULD</option><option>COULD</option></select></label>
              <label className="text-sm md:col-span-2">Statement<textarea aria-label={`Criterion statement ${index + 1}`} value={criterion.statement} onChange={(event) => update({ statement: event.target.value })} maxLength={10000} className="mt-1 min-h-20 w-full rounded border p-2" /></label>
              {(["given", "when", "then"] as const).map((field) => <label key={field} className="text-sm capitalize">{field}<textarea aria-label={`Criterion ${field} ${index + 1}`} value={criterion[field] ?? ""} onChange={(event) => update({ [field]: event.target.value })} maxLength={10000} className="mt-1 min-h-16 w-full rounded border p-2" /></label>)}
              <label className="text-sm">Verification method<input aria-label={`Criterion verification method ${index + 1}`} value={criterion.verificationMethod} onChange={(event) => update({ verificationMethod: event.target.value })} maxLength={255} className="mt-1 w-full rounded border p-2" /></label>
              {!readOnly && <button type="button" aria-label={`Remove criterion ${index + 1}`} onClick={() => change({ ...form, criterionInputs: form.criterionInputs.filter((_, current) => current !== index) })} className="justify-self-start rounded border px-2 py-1 text-sm">Remove</button>}
            </div>;
          })}
        </div>
        {!readOnly && <button type="button" onClick={() => change({ ...form, criterionInputs: [...form.criterionInputs, emptyCriterion()] })} className="mt-2 rounded border px-2 py-1 text-sm">Add criterion</button>}
      </fieldset>

      <fieldset>
        <legend className="font-medium">Decision proposals</legend>
        <p className="mt-1 text-sm text-[#787774]">Only approved proposals backed by an immutable Decision Record can be attached.</p>
        {decisionApi.proposals.isLoading || decisionApi.decisions.isLoading ? (
          <p className="mt-3 text-sm text-[#787774]">Loading decision proposals…</p>
        ) : decisionDataUnavailable ? (
          <div role="alert" className="mt-3 rounded-[8px] border border-[#F5C6C7] bg-[#FDEBEC] p-3 text-sm text-[#9F2F2D]">
            <p>Decision data is unavailable. Existing attachments have not been reclassified.</p>
            <button type="button" onClick={() => void decisionApi.refresh()} className="mt-2 rounded-[6px] border border-[#F5C6C7] px-2 py-1 text-xs">Retry decision data</button>
          </div>
        ) : (
          <div className="mt-3 grid gap-2 xl:grid-cols-2">
            {proposals.map((proposal) => {
              const record = decisionRecordsByProposal.get(proposal._id);
              const eligible = proposal.state === "APPROVED" && Boolean(record);
              const checked = form.decisionProposalIds.includes(proposal._id);
              return <div key={proposal._id} className={`rounded-[8px] border p-3 ${eligible ? "border-[#D5E4D2] bg-[#EDF3EC]/50" : "border-[#EAEAEA] bg-[#F9F9F8]"} dark:border-white/[0.06] dark:bg-white/[0.02]`}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    aria-label={proposal.question}
                    checked={checked}
                    disabled={!eligible || readOnly || draftApi.updateDraft.isPending}
                    onChange={(event) => updateDecisionAttachments(
                      event.target.checked
                        ? [...form.decisionProposalIds, proposal._id]
                        : form.decisionProposalIds.filter((id) => id !== proposal._id),
                    )}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    {proposal.state === "OPEN" ? <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#956400]">OPEN · PROPOSAL</p> : proposal.state === "APPROVED" && record ? <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#346538]">APPROVED · PROPOSAL RESOLVED</p> : <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#9F2F2D]">{proposal.state} · RECORD UNAVAILABLE</p>}
                    <p className="mt-1 text-sm font-medium">{proposal.question}</p>
                    {proposal.state === "OPEN" && <p className="mt-1 text-xs text-[#956400]">Not an official decision — approval required</p>}
                    {record && <p className="mt-1 font-mono text-[0.6875rem] text-[#346538]">Official decision: {record._id}</p>}
                    {proposal.state === "APPROVED" && !record && <p className="mt-1 text-xs text-[#9F2F2D]">Approved proposal is missing its Decision Record.</p>}
                  </div>
                </div>
                {checked && !eligible && <button type="button" onClick={() => updateDecisionAttachments(form.decisionProposalIds.filter((id) => id !== proposal._id))} className="mt-2 rounded-[6px] border border-[#F5C6C7] px-2 py-1 text-xs text-[#9F2F2D]">Remove attachment</button>}
              </div>;
            })}
            {ineligibleAttachedIds.filter((id) => !proposals.some((proposal) => proposal._id === id)).map((id) => <div key={id} className="rounded-[8px] border border-[#F5C6C7] bg-[#FDEBEC] p-3 text-sm text-[#9F2F2D]"><p className="font-medium">Unknown proposal attachment</p><p className="mt-1 font-mono text-xs">{id}</p><button type="button" onClick={() => updateDecisionAttachments(form.decisionProposalIds.filter((item) => item !== id))} className="mt-2 rounded-[6px] border border-[#F5C6C7] px-2 py-1 text-xs">Remove attachment</button></div>)}
          </div>
        )}
      </fieldset>
    </fieldset>

    <footer className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
      {draft.status === "active" && canEdit && <><button type="button" onClick={save} disabled={submitConfirming || conflict || draftApi.updateDraft.isPending || draftApi.submitDraft.isPending} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">Save draft</button><button type="button" onClick={abandon} disabled={submitConfirming || draftApi.abandonDraft.isPending || draftApi.submitDraft.isPending} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">Abandon draft</button></>}
      {draft.status === "active" && canSubmit && <Button type="button" onClick={() => setSubmitConfirming(true)} disabled={dirty || conflict || decisionDataUnavailable || ineligibleAttachedIds.length > 0 || draftApi.submitDraft.isPending}>Submit draft</Button>}
      {draft.status === "stale" && canEdit && <Button type="button" onClick={rebase} disabled={draftApi.rebaseDraft.isPending || draftApi.submitDraft.isPending}>Rebase draft</Button>}
    </footer>
  </section>;
}

function ListEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return <fieldset><legend className="font-medium">{label}</legend><div className="mt-2 space-y-2">{values.map((value, index) => <div key={index} className="flex gap-2"><input aria-label={`${label} ${index + 1}`} value={value} onChange={(event) => onChange(values.map((item, current) => current === index ? event.target.value : item))} className="min-w-0 flex-1 rounded border p-2" /><button type="button" aria-label={`Remove ${label} ${index + 1}`} onClick={() => onChange(values.filter((_, current) => current !== index))} className="rounded border px-2">Remove</button></div>)}</div><button type="button" onClick={() => onChange([...values, ""])} className="mt-2 rounded border px-2 py-1 text-sm">Add {label.toLowerCase().replace(/s$/, "")}</button></fieldset>;
}

function EntryEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: StoryContentEntry[];
  onChange: (values: StoryContentEntry[]) => void;
}) {
  const move = (index: number, offset: number) => {
    const next = [...values];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  };
  return <fieldset><legend className="font-medium">{label}</legend><div className="mt-2 space-y-2">{values.map((entry, index) => <div key={entry.id} className="flex flex-wrap gap-2"><input aria-label={`${label} ${index + 1}`} value={entry.text} onChange={(event) => onChange(values.map((item) => item.id === entry.id ? { ...item, text: event.target.value } : item))} className="min-w-0 flex-1 rounded border p-2" /><button type="button" aria-label={`Move ${label} ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)} className="rounded border px-2 disabled:opacity-40">↑</button><button type="button" aria-label={`Move ${label} ${index + 1} down`} disabled={index === values.length - 1} onClick={() => move(index, 1)} className="rounded border px-2 disabled:opacity-40">↓</button><button type="button" aria-label={`Remove ${label} ${index + 1}`} onClick={() => onChange(values.filter((item) => item.id !== entry.id))} className="rounded border px-2">Remove</button></div>)}</div><button type="button" onClick={() => onChange([...values, newRow()])} className="mt-2 rounded border px-2 py-1 text-sm">Add row</button></fieldset>;
}
