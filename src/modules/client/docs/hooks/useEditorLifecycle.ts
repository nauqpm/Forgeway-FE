// Hook quản lý vòng đời của editor tài liệu, bao gồm việc tạo và hủy editor khi cần thiết,
// nó cung cấp hai instance editor: một cho chế độ chỉ đọc (readEditor) và một cho chế độ chỉnh sửa cộng tác (editEditor),
// cùng với các hàm để tạo và hủy editor chỉnh sửa cộng tác dựa trên kết nối Yjs và awareness.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, Editor } from "@tiptap/react";
import { getEditorExtensions, getCollaborativeEditorExtensions } from "../editor/editorExtensions";
import type * as Y from "yjs";
import imageService from "@/common/services/imageService";
import { toast } from "react-hot-toast";
import { EditorView } from "@tiptap/pm/view";

const toImageUrl = (url: string) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SERVER_URL || "";
  return `${base}${url}`;
};

const cleanPastedHTML = (html: string): string => {
  // Remove XML/MS Word conditional comments
  let clean = html.replace(/<!--[\s\S]*?-->/g, "");
  // Remove style blocks
  clean = clean.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  // Remove font-family styling
  clean = clean.replace(/font-family:[^;"]*;?/gi, "");
  // Remove MS Word specific classes
  clean = clean.replace(/\bMso\w+\b/g, "");
  return clean;
};

const uploadAndInsertImage = async (view: EditorView, file: File) => {
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (file.size > MAX_IMAGE_SIZE) {
    toast.error("Kích thước ảnh tối đa là 5MB");
    return;
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    toast.error("Định dạng ảnh không hợp lệ");
    return;
  }

  const localUrl = URL.createObjectURL(file);
  const { schema } = view.state;
  const node = schema.nodes.image.create({
    src: localUrl,
    uploading: true,
    alt: file.name,
    caption: "",
  });

  const tr = view.state.tr.replaceSelectionWith(node);
  view.dispatch(tr);

  try {
    const result = await imageService.uploadImage(file, true);
    const serverUrl = toImageUrl(result.imageUrl || result.url || "");
    if (!serverUrl) {
      throw new Error("Failed to get image URL");
    }

    let found = false;
    view.state.doc.descendants((n, pos) => {
      if (n.type.name === "image" && n.attrs.src === localUrl) {
        const updateTr = view.state.tr.setNodeMarkup(pos, undefined, {
          ...n.attrs,
          src: serverUrl,
          uploading: false,
        });
        view.dispatch(updateTr);
        found = true;
        return false;
      }
    });

    if (!found) {
      view.dispatch(view.state.tr.replaceSelectionWith(schema.nodes.image.create({
        src: serverUrl,
        alt: file.name,
      })));
    }
  } catch (error) {
    console.error("Paste/Drop upload failed:", error);
    view.state.doc.descendants((n, pos) => {
      if (n.type.name === "image" && n.attrs.src === localUrl) {
        const deleteTr = view.state.tr.delete(pos, pos + n.nodeSize);
        view.dispatch(deleteTr);
        return false;
      }
    });
    toast.error("Tải ảnh lên thất bại");
  } finally {
    URL.revokeObjectURL(localUrl);
  }
};

export function useEditorLifecycle(initialContent: string) {
  const readEditor = useEditor({
    immediatelyRender: false,
    extensions: getEditorExtensions(""),
    content: initialContent,
    editable: false,
    editorProps: {
      attributes: {
        class:
          "tiptap-content prose m-5 focus:outline-none max-w-none px-2 pb-32",
      },
    },
  });

  const editEditorRef = useRef<Editor | null>(null);
  const [, setEditorUpdateTick] = useState(0);

  const createCollaborativeEditor = useCallback((ydoc: Y.Doc, awareness?: any) => {
    if (editEditorRef.current) {
      editEditorRef.current.destroy();
    }

    let editor: Editor;
    try {
      editor = new Editor({
        extensions: getCollaborativeEditorExtensions(
          "Nhập nội dung vào đây...",
          ydoc,
          awareness,
        ),
        editable: true,
        editorProps: {
          attributes: {
            class:
              "tiptap-content prose m-5 focus:outline-none max-w-none px-2 pb-32",
          },
          transformPastedHTML: cleanPastedHTML,
          handleDrop: (view, event) => {
            if (!view.editable) return false;
            const files = event.dataTransfer?.files;
            if (!files || files.length === 0) return false;
            const file = files[0];
            if (file && file.type.startsWith("image/")) {
              event.preventDefault();
              void uploadAndInsertImage(view, file);
              return true;
            }
            return false;
          },
          handlePaste: (view, event) => {
            if (!view.editable) return false;
            const items = event.clipboardData?.items;
            if (!items) return false;
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) {
                  event.preventDefault();
                  void uploadAndInsertImage(view, file);
                  return true;
                }
              }
            }
            return false;
          },
        },
      });
    } catch (e: any) {
      console.error("DEBUG - createCollaborativeEditor threw error:", e);
      if (e.stack) {
        console.error("DEBUG - Stack trace:", e.stack);
      }
      throw e;
    }

    const tick = () => setEditorUpdateTick((t) => t + 1);
    editor.on("update", tick);
    editor.on("selectionUpdate", tick);

    editEditorRef.current = editor;
    setEditorUpdateTick((t) => t + 1);
    return editor;
  }, []);

  const destroyCollaborativeEditor = useCallback(() => {
    if (editEditorRef.current) {
      editEditorRef.current.off("update");
      editEditorRef.current.off("selectionUpdate");
      editEditorRef.current.destroy();
      editEditorRef.current = null;
      setEditorUpdateTick((t) => t + 1);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (editEditorRef.current) {
        editEditorRef.current.destroy();
        editEditorRef.current = null;
      }
    };
  }, []);

  return {
    readEditor,
    editEditor: editEditorRef.current,
    createCollaborativeEditor,
    destroyCollaborativeEditor,
  };
}
