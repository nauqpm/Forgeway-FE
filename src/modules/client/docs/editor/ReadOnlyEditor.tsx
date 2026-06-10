// Component đại diện cho editor tài liệu ở chế độ chỉ đọc,
// hiển thị nội dung của tài liệu mà không cho phép người dùng chỉnh sửa.
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
