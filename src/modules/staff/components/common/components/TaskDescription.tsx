"use client";

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';
import 'highlight.js/styles/github.css';
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Link as LinkIcon
} from 'lucide-react';

const lowlight = createLowlight(common);

interface TaskDescriptionProps {
  initialContent: string;
  onSave: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-[#F9F9F8] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/8 rounded-t-[6px]">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors ${editor.isActive('bold') ? 'bg-[#F7F6F3] dark:bg-white/8 text-[#2563EB] dark:text-[#3B82F6]' : 'text-[#787774] dark:text-[#9B9A97]'}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors ${editor.isActive('italic') ? 'bg-[#F7F6F3] dark:bg-white/8 text-[#2563EB] dark:text-[#3B82F6]' : 'text-[#787774] dark:text-[#9B9A97]'}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors ${editor.isActive('strike') ? 'bg-[#F7F6F3] dark:bg-white/8 text-[#2563EB] dark:text-[#3B82F6]' : 'text-[#787774] dark:text-[#9B9A97]'}`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-[#EAEAEA] dark:bg-white/8 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors ${editor.isActive('codeBlock') ? 'bg-[#F7F6F3] dark:bg-white/8 text-[#2563EB] dark:text-[#3B82F6]' : 'text-[#787774] dark:text-[#9B9A97]'}`}
        title="Code Block"
      >
        <Code className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors ${editor.isActive('blockquote') ? 'bg-[#F7F6F3] dark:bg-white/8 text-[#2563EB] dark:text-[#3B82F6]' : 'text-[#787774] dark:text-[#9B9A97]'}`}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
      
      <div className="w-px h-4 bg-[#EAEAEA] dark:bg-white/8 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors ${editor.isActive('bulletList') ? 'bg-[#F7F6F3] dark:bg-white/8 text-[#2563EB] dark:text-[#3B82F6]' : 'text-[#787774] dark:text-[#9B9A97]'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors ${editor.isActive('orderedList') ? 'bg-[#F7F6F3] dark:bg-white/8 text-[#2563EB] dark:text-[#3B82F6]' : 'text-[#787774] dark:text-[#9B9A97]'}`}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-[#EAEAEA] dark:bg-white/8 mx-1" />

      <button
        onClick={() => {
          const url = window.prompt('URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors ${editor.isActive('link') ? 'bg-[#F7F6F3] dark:bg-white/8 text-[#2563EB] dark:text-[#3B82F6]' : 'text-[#787774] dark:text-[#9B9A97]'}`}
        title="Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function TaskDescription({ initialContent, onSave }: TaskDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent || '');

  const editor = useEditor({
    extensions: [
      StarterKit,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#0052CC] hover:underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: 'Add a description...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[7.5rem] p-4 text-[#172B4D] dark:text-white',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!isEditing && initialContent !== content) {
      setContent(initialContent || '');
      if (editor) {
        editor.commands.setContent(initialContent || '');
      }
    }
  }, [initialContent, isEditing, editor]);

  const handleSave = () => {
    onSave(content);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setContent(initialContent || '');
    if (editor) {
      editor.commands.setContent(initialContent || '');
    }
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="p-4 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/8 cursor-pointer transition-colors min-h-15 prose prose-sm max-w-none text-[#111111] dark:text-[#E8E8E7]"
      >
        {content && content !== '<p></p>' ? (
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
        ) : (
          <p className="text-[#787774] dark:text-[#9B9A97] text-sm m-0">Add a description...</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border-2 border-[#2563EB] rounded-[6px] overflow-hidden bg-white dark:bg-[#202020]">
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium rounded-[6px] transition-colors"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 text-[#111111] dark:text-[#E8E8E7] text-sm font-medium rounded-[6px] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
