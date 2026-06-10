// Hook quản lý trạng thái tiêu đề của tài liệu trong editor tài liệu khi có tính năng cộng tác,
// nó sử dụng Yjs để đồng bộ tiêu đề giữa các client, cho phép người dùng chỉnh sửa tiêu đề và tự động cập nhật tiêu đề trên tất cả các client đang kết nối.
"use client";

import { useCallback, useEffect, useState } from "react";
import type * as Y from "yjs";

export function useEditorTitleCollaboration(ydoc: Y.Doc | null, initialTitle: string) {
  const [editTitle, setEditTitle] = useState(initialTitle);

  useEffect(() => {
    setEditTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (!ydoc) return;

    const yTitle = ydoc.getText("title");

    const handleTitleChange = () => {
      const newT = yTitle.toString();
      setEditTitle((prev) => (prev !== newT ? newT : prev));
    };

    yTitle.observe(handleTitleChange);
    return () => {
      yTitle.unobserve(handleTitleChange);
    };
  }, [ydoc]);

  const handleTitleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      if (!ydoc) return;

      const yTitle = ydoc.getText("title");
      ydoc.transact(() => {
        yTitle.delete(0, yTitle.length);
        yTitle.insert(0, newTitle);
      });
    },
    [ydoc],
  );

  return { editTitle, handleTitleInput, setEditTitle };
}
