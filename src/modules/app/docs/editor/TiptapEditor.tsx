"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import "highlight.js/styles/github.css";

import { useEffect, useRef } from "react";
import { useDocsStore } from "../store/docs.store";
import EditorToolbar from "./EditorToolbar";
import EditorHeader from "./EditorHeader";

const lowlight = createLowlight(common);

export default function TiptapEditor() {
  const { documents, selectedDocumentId, updateDocument, setIsSaving } = useDocsStore();
  const document = documents.find(d => d.id === selectedDocumentId);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
        heading: {
          levels: [1, 2, 3]
        }
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Nhập nội dung vào đây...",
      }),
    ],
    content: document?.content || "",
    editorProps: {
      attributes: {
        className: "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none max-w-none px-8 pb-32",
      },
    },
    onUpdate: ({ editor }) => {
      if (!selectedDocumentId) return;
      
      setIsSaving(true);
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        updateDocument(selectedDocumentId, { content: editor.getHTML() });
        setIsSaving(false);
      }, 1000); // Autosave after 1s debounce
    },
  });

  // Load content when document changes
  useEffect(() => {
    if (editor && document) {
      const currentContent = editor.getHTML();
      if (currentContent !== document.content) {
        editor.commands.setContent(document.content);
      }
    }
  }, [selectedDocumentId, editor]); // We don't want to sync on every document update (like when autosaving)

  if (!document) return null;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <EditorHeader doc={document} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {/* Sticky Toolbar with Blur */}
        <div className="sticky top-0 z-20">
          <EditorToolbar editor={editor} />
        </div>

        <div className="max-w-[760px] mx-auto px-10 py-16">
          {/* Page Title Section */}
          <div className="mb-12 group">
            <input
              type="text"
              value={document.title}
              onChange={(e) => updateDocument(document.id, { title: e.target.value })}
              className="w-full text-5xl font-extrabold border-none outline-none focus:ring-0 bg-transparent text-[#172B4D] placeholder:text-gray-100 transition-all tracking-tight leading-tight"
              placeholder="Untitled Page"
            />
          </div>
          
          {/* Editor Content Area */}
          <div className="min-h-[600px] pb-40">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
