"use client";

import React, { useState, useEffect, useRef } from 'react';
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
    <div className="flex flex-wrap items-center gap-1 p-2 bg-[#F4F5F7] dark:bg-gray-800 border-b border-[#DFE1E6] dark:border-gray-700 rounded-t-md">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-[#EBECF0] dark:hover:bg-gray-700 transition-colors ${editor.isActive('bold') ? 'bg-[#EBECF0] dark:bg-gray-700 text-[#0052CC]' : 'text-[#42526E] dark:text-gray-300'}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-[#EBECF0] dark:hover:bg-gray-700 transition-colors ${editor.isActive('italic') ? 'bg-[#EBECF0] dark:bg-gray-700 text-[#0052CC]' : 'text-[#42526E] dark:text-gray-300'}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-[#EBECF0] dark:hover:bg-gray-700 transition-colors ${editor.isActive('strike') ? 'bg-[#EBECF0] dark:bg-gray-700 text-[#0052CC]' : 'text-[#42526E] dark:text-gray-300'}`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-[#DFE1E6] dark:bg-gray-700 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded hover:bg-[#EBECF0] dark:hover:bg-gray-700 transition-colors ${editor.isActive('codeBlock') ? 'bg-[#EBECF0] dark:bg-gray-700 text-[#0052CC]' : 'text-[#42526E] dark:text-gray-300'}`}
        title="Code Block"
      >
        <Code className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-[#EBECF0] dark:hover:bg-gray-700 transition-colors ${editor.isActive('blockquote') ? 'bg-[#EBECF0] dark:bg-gray-700 text-[#0052CC]' : 'text-[#42526E] dark:text-gray-300'}`}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
      
      <div className="w-px h-4 bg-[#DFE1E6] dark:bg-gray-700 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-[#EBECF0] dark:hover:bg-gray-700 transition-colors ${editor.isActive('bulletList') ? 'bg-[#EBECF0] dark:bg-gray-700 text-[#0052CC]' : 'text-[#42526E] dark:text-gray-300'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-[#EBECF0] dark:hover:bg-gray-700 transition-colors ${editor.isActive('orderedList') ? 'bg-[#EBECF0] dark:bg-gray-700 text-[#0052CC]' : 'text-[#42526E] dark:text-gray-300'}`}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-[#DFE1E6] dark:bg-gray-700 mx-1" />

      <button
        onClick={() => {
          const url = window.prompt('URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-1.5 rounded hover:bg-[#EBECF0] dark:hover:bg-gray-700 transition-colors ${editor.isActive('link') ? 'bg-[#EBECF0] dark:bg-gray-700 text-[#0052CC]' : 'text-[#42526E] dark:text-gray-300'}`}
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
  const previousInitialContentRef = useRef(initialContent || '');

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
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] p-4 text-[#172B4D] dark:text-white',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    const nextInitialContent = initialContent || '';
    if (!isEditing && previousInitialContentRef.current !== nextInitialContent) {
      previousInitialContentRef.current = nextInitialContent;
      setContent(nextInitialContent);
      if (editor) {
        editor.commands.setContent(nextInitialContent);
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
        className="p-4 hover:bg-[#EBECF0] dark:hover:bg-gray-700 rounded border border-transparent hover:border-[#DFE1E6] dark:hover:border-gray-700 cursor-pointer transition-colors min-h-[60px] prose prose-sm max-w-none text-slate-800 dark:text-white"
      >
        {content && content !== '<p></p>' ? (
          <div
            className="[&_*]:text-inherit [&_p]:my-0 text-slate-800 dark:text-white"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
          />
        ) : (
          <p className="text-[#5E6C84] dark:text-gray-400 text-sm m-0">Add a description...</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border-2 border-[#0052CC] rounded-md overflow-hidden bg-[#FFFFFF] dark:bg-gray-900">
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-3 py-1.5 bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-medium rounded transition-colors"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 hover:bg-[#EBECF0] dark:hover:bg-gray-700 text-[#172B4D] dark:text-white text-sm font-medium rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
