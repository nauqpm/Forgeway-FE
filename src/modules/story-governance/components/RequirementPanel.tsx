"use client";

import { useMemo, useRef, useState } from "react";
import { PiArchive, PiPlus } from "react-icons/pi";
import { Button } from "@/shared/components/ui/Button";
import { Input, Select, Textarea } from "@/shared/components/ui/Input";
import { Modal, ModalFooter } from "@/shared/components/ui/Modal";
import {
  WORKSPACE_PERMISSIONS,
  type WorkspacePermission,
} from "@/modules/workspace/shared/constants/workspacePermissions";
import { useStoryGovernance } from "../hooks/useStoryGovernance";
import type { CreateRequirementInput, RawRequirement } from "../types/storyGovernance.type";

type Props = {
  workspaceId: string;
  permissions: WorkspacePermission[];
  onSelect?: (requirement: RawRequirement) => void;
};
const emptyForm = (): CreateRequirementInput => ({
  key: "",
  title: "",
  body: "",
  sourceType: "manual",
  sourceRef: "",
  sourceMetadata: undefined,
});

export default function RequirementPanel({ workspaceId, permissions, onSelect }: Props) {
  const [filter, setFilter] = useState<"active" | "archived">("active");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [metadata, setMetadata] = useState("");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const { requirements, createRequirement, archiveRequirement } = useStoryGovernance(workspaceId);
  const canCreate = permissions.includes(WORKSPACE_PERMISSIONS.STORY_CREATE);
  const canArchive = permissions.includes(WORKSPACE_PERMISSIONS.STORY_ARCHIVE);
  const items = useMemo(
    () => (requirements.data ?? []).filter((item) => (item.status ?? "active") === filter),
    [filter, requirements.data]
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.key.trim() || form.key.length > 100)
      return setError("Key is required and must be 100 characters or fewer.");
    if (!form.title.trim() || form.title.length > 255)
      return setError("Title is required and must be 255 characters or fewer.");
    if (!form.body.trim() || form.body.length > 10000)
      return setError("Body is required and must be 10,000 characters or fewer.");
    if (form.sourceRef && form.sourceRef.length > 255)
      return setError("Source reference must be 255 characters or fewer.");
    let sourceMetadata: Record<string, unknown> | undefined;
    try {
      sourceMetadata = metadata.trim() ? JSON.parse(metadata) : undefined;
    } catch {
      return setError("Source metadata must be a JSON object.");
    }
    if (sourceMetadata && (Array.isArray(sourceMetadata) || typeof sourceMetadata !== "object"))
      return setError("Source metadata must be a JSON object.");
    setError("");
    createRequirement.mutate(
      {
        ...form,
        key: form.key.trim(),
        title: form.title.trim(),
        sourceRef: form.sourceRef?.trim() || undefined,
        sourceMetadata,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setForm(emptyForm());
          setMetadata("");
        },
        onError: () => setError("Could not create requirement. Please try again."),
      }
    );
  };

  if (requirements.isLoading)
    return (
      <section
        aria-label="Requirements loading"
        className="animate-pulse rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
      >
        <div className="h-5 w-32 rounded bg-[var(--color-surface-2)]" />
        <div className="mt-4 h-20 rounded bg-[var(--color-surface-2)]" />
      </section>
    );
  if (requirements.isError)
    return (
      <section
        role="alert"
        className="rounded-[6px] border border-[#F5C6C7] bg-[var(--color-surface)] p-5 text-sm text-[#9F2F2D]"
      >
        Requirements could not be loaded. Refresh the page to try again.
      </section>
    );

  return (
    <section
      aria-labelledby="requirements-heading"
      className="min-h-0 min-w-0 overflow-y-auto bg-[var(--color-surface)] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="requirements-heading" className="font-semibold">
            Requirements
          </h2>
          <p className="text-xs text-[#787774] dark:text-[#9B9A97]">Source material for story contracts</p>
        </div>
        {canCreate && (
          <Button type="button" size="sm" icon={<PiPlus aria-hidden="true" />} onClick={() => setIsOpen(true)}>
            Create requirement
          </Button>
        )}
      </div>
      <div className="mt-4 flex gap-2" aria-label="Requirement status">
        <Button
          type="button"
          size="sm"
          variant={filter === "active" ? "primary" : "secondary"}
          aria-pressed={filter === "active"}
          onClick={() => setFilter("active")}
        >
          Active
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === "archived" ? "primary" : "secondary"}
          aria-pressed={filter === "archived"}
          onClick={() => setFilter("archived")}
        >
          Archived
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((item) => (
            <article
              key={item._id}
              className="rounded-[6px] border border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-2)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]"
            >
              <button
                type="button"
                onClick={() => onSelect?.(item)}
                className="w-full p-3 text-left focus-visible:outline-none"
              >
                <span className="font-mono text-xs text-[#787774] dark:text-[#9B9A97]">{item.key}</span>
                <p className="mt-1 text-sm font-medium">{item.title}</p>
              </button>
              {canArchive && filter === "active" && (
                <div className="px-3 pb-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Archive requirement ${item.key}`}
                    icon={<PiArchive aria-hidden="true" />}
                    onClick={() => {
                      if (window.confirm("Archive this requirement? Existing contracts will remain readable."))
                        archiveRequirement.mutate(item._id);
                    }}
                  >
                    Archive
                  </Button>
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-[6px] border border-dashed border-[var(--color-border)] p-4 text-center text-sm text-[#787774] dark:text-[#9B9A97]">
            <p>{filter === "active" ? "No requirements yet" : "No archived requirements"}</p>
            {filter === "active" && (
              <p className="mt-1">Create a requirement to establish the source for a story contract.</p>
            )}
          </div>
        )}
      </div>
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create requirement"
        size="lg"
        footer={
          <ModalFooter
            onCancel={() => setIsOpen(false)}
            onConfirm={() => formRef.current?.requestSubmit()}
            confirmLabel="Save requirement"
            loading={createRequirement.isPending}
          />
        }
      >
        <form ref={formRef} noValidate onSubmit={submit} className="grid gap-3">
          {error && (
            <p role="alert" className="text-sm text-[#9F2F2D]">
              {error}
            </p>
          )}
          <Input
            label="Key"
            aria-label="Key"
            required
            autoFocus
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            maxLength={100}
          />
          <Input
            label="Title"
            aria-label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={255}
          />
          <Textarea
            label="Body"
            aria-label="Body"
            required
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            maxLength={10000}
            className="min-h-24"
          />
          <Select
            label="Source"
            aria-label="Source"
            value={form.sourceType}
            onChange={(e) => setForm({ ...form, sourceType: e.target.value as CreateRequirementInput["sourceType"] })}
          >
            <option value="manual">Manual</option>
            <option value="jira">Jira</option>
          </Select>
          <Input
            label="Source reference"
            aria-label="Source reference"
            value={form.sourceRef}
            onChange={(e) => setForm({ ...form, sourceRef: e.target.value })}
            maxLength={255}
          />
          <Textarea
            label="Source metadata (JSON object)"
            aria-label="Source metadata (JSON object)"
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            className="min-h-20 font-mono text-xs"
          />
        </form>
      </Modal>
    </section>
  );
}
