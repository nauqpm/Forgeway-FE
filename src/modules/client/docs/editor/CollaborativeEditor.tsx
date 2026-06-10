// Component dùng để hiển thị nội dung của editor,
// nó nhận một prop là editor (đối tượng Editor từ tiptap) 
// và sử dụng EditorContent để render nội dung của editor.
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
