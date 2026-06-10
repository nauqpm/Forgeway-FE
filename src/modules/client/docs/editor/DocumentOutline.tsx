// Component hiển thị mục lục của tài liệu dựa trên các heading (H1, H2, H3) có trong nội dung editor.
// Nó tự động cập nhật khi nội dung editor thay đổi hoặc khi người dùng di chuyển con trỏ đến một heading khác.
// Người dùng có thể click vào một mục trong outline để cuộn đến vị trí tương ứng trong tài liệu.
"use client";

import React, { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
import { List } from "lucide-react";

interface HeadingItem {
  text: string;
  level: number;
  id: string;
}

export default function DocumentOutline({ editor }: { editor: Editor | null }) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  useEffect(() => {
    if (!editor) return;

    const updateOutline = () => {
      const items: HeadingItem[] = [];
      const editorEl = document.querySelector(".tiptap");
      if (!editorEl) return;

      const headingEls = editorEl.querySelectorAll("h1, h2, h3");
      headingEls.forEach((el, index) => {
        if (!el.id) {
          el.id = `doc-heading-${index}`;
        }
        items.push({
          text: el.textContent || "",
          level: parseInt(el.tagName.substring(1), 10),
          id: el.id,
        });
      });
      setHeadings(items);
    };

    updateOutline();
    editor.on("update", updateOutline);
    editor.on("selectionUpdate", updateOutline);

    return () => {
      editor.off("update", updateOutline);
      editor.off("selectionUpdate", updateOutline);
    };
  }, [editor]);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 p-5 overflow-y-auto custom-scrollbar shrink-0">
      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 shrink-0">
        <List className="w-3.5 h-3.5" />
        Mục lục
      </div>

      {headings.length === 0 ? (
        <div className="text-xs text-gray-400 dark:text-gray-500 italic">
          Không tìm thấy tiêu đề nào trong tài liệu. Hãy thêm Heading (H1, H2, H3) để hiển thị mục lục.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {headings.map((h, i) => (
            <button
              key={`${h.id}-${i}`}
              onClick={() => handleScrollTo(h.id)}
              className="text-left text-xs text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors py-1 hover:underline truncate"
              style={{
                paddingLeft: `${(h.level - 1) * 12}px`,
                fontWeight: h.level === 1 ? "600" : h.level === 2 ? "500" : "400",
              }}
              title={h.text}
            >
              {h.text || "Tiêu đề trống"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
