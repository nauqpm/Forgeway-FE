"use client";

import { FormEvent, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import DOMPurify from "dompurify";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { documentService } from "@/modules/client/docs/services/documentService";
import EditorToolbar from "@/modules/client/docs/editor/EditorToolbar";
import { getEditorExtensions } from "@/modules/client/docs/editor/editorExtensions";

const sanitizeEditorHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["style", "target", "rel", "colspan", "rowspan"],
  });

export default function CreateOnlineDocumentPage() {
  usePageTitle('New Document');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");

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
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const content = editor ? sanitizeEditorHtml(editor.getHTML()) : "<p></p>";
      await documentService.createOnline(
        title.trim(),
        content,
      );
      toast.success("Document created successfully");
      router.push("/documents");
    } catch {
      toast.error("Failed to create document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page-narrow">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/documents"
          className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Online Document</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Create a document in your personal document library.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="workspace-panel space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Document title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Content
            </label>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <EditorToolbar editor={editor} />
              <div className="min-h-[420px] dark:prose-invert">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-[var(--workspace-surface-pad)] py-4 dark:border-gray-700 dark:bg-gray-800">
          <Link
            href="/documents"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : <>
              <Save className="h-4 w-4" /> Create Document
            </>}
          </button>
        </div>
      </form>
    </div>
  );
}
