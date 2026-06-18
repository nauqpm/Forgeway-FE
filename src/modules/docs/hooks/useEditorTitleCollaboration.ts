// Hook managing collaborative document title status in the editor,
// syncs title changes across clients using Yjs.
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
      setEditTitle(newTitle);
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
