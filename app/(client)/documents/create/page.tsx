"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { documentService } from "@/modules/docs/services/documentService";
import EditorToolbar from "@/modules/docs/editor/EditorToolbar";
import { getEditorExtensions } from "@/modules/docs/editor/editorExtensions";

const sanitizeEditorHtml = (html: string): string => {
  if (typeof window === "undefined") return html;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DP = require("dompurify");
  return DP.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["style", "target", "rel", "colspan", "rowspan"],
  });
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    return res?.data?.message || res?.data?.error || fallback;
  }
  return fallback;
};

export default function CreateOnlineDocumentPage() {
  usePageTitle('New Document');
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getEditorExtensions("Start typing..."),
    content: "",
    editorProps: {
      attributes: {
        class:
          "tiptap-content prose m-5 focus:outline-none max-w-none px-2 pb-32",
      },
    },
    onUpdate: () => setIsDirty(true),
  });

  const createDocumentMutation = useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) =>
      documentService.createOnline(name, content),
    onSuccess: () => {
      setIsDirty(false);
      toast.success("Document created successfully");
      router.push("/documents");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create document"));
    },
  });

  const loading = createDocumentMutation.isPending;
  const hasUnsavedChanges = isDirty || loading;

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const content = editor ? sanitizeEditorHtml(editor.getHTML()) : "<p></p>";
    createDocumentMutation.mutate({ name: title.trim(), content });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="app-page-narrow py-8 pb-12 px-4">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/documents"
          className="rounded-[6px] p-1.5 transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
        >
          <ArrowLeft className="h-5 w-5 text-[#787774] dark:text-[#9B9A97]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">Create Online Document</h1>
          <p className="mt-0.5 text-sm text-[#787774] dark:text-[#9B9A97]">
            Create a document in your personal document library.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020]"
      >
        <div className="workspace-panel space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
              Document title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Enter document title"
              className="w-full rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#252525] px-4 py-2.5 text-sm text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
              Content
            </label>
            <div className="overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#252525]">
              <EditorToolbar editor={editor} />
              <div className="min-h-[26.25rem] dark:prose-invert">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#EAEAEA] dark:border-white/[0.06] bg-[#F7F6F3] dark:bg-[#252525] px-[var(--workspace-surface-pad)] py-4">
          {/* <Link
            href="/documents"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Link> */}
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="flex items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] disabled:opacity-50"
          >
            {loading ? "Creating..." : <>
              <Save className="h-4 w-4" /> Create Document
            </>}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
