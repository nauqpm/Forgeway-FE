// Component representing document editor in read-only mode,
// displaying content without allowing any edits.
"use client";

import { EditorContent, Editor } from "@tiptap/react";

interface ReadOnlyEditorProps {
  editor: Editor | null;
}

export default function ReadOnlyEditor({ editor }: ReadOnlyEditorProps) {
  if (!editor) return null;

  return (
    <div className="dark:prose-invert">
      <EditorContent editor={editor} />
    </div>
  );
}
