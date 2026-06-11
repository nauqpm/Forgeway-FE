// Component to render editor content,
// it receives an editor prop (Editor instance from Tiptap) 
// and uses EditorContent to render the editor content.
"use client";

import { EditorContent, Editor } from "@tiptap/react";

interface CollaborativeEditorProps {
  editor: Editor | null;
}

export default function CollaborativeEditor({ editor }: CollaborativeEditorProps) {
  if (!editor) return null;

  return (
    <div className="dark:prose-invert">
      <EditorContent editor={editor} />
    </div>
  );
}
