"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

function ToolButton({
  active,
  label,
  title,
  onClick,
}: {
  active?: boolean;
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "tool active" : "tool"}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  onImageUpload,
}: {
  value: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string | null>;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "tiptap-content",
        "aria-label": "Note content editor",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="rich-editor" style={{ padding: "1rem", color: "var(--text-muted)", textAlign: "center" }}>
        Loading editor…
      </div>
    );
  }

  const addLink = () => {
    const href = window.prompt("Paste a link URL");
    if (href) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const addImage = () => {
    const src = window.prompt("Paste a public image URL");
    if (src) editor.chain().focus().setImage({ src, alt: "" }).run();
  };

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0];
    event.target.value = "";
    if (!image || !onImageUpload || !editor) return;
    setUploading(true);
    try {
      const url = await onImageUpload(image);
      if (url) editor.chain().focus().setImage({ src: url, alt: image.name }).run();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rich-editor">
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={handleImageUpload}
        aria-label="Upload inline image"
      />

      <div className="toolbar" role="toolbar" aria-label="Text formatting toolbar">
        {/* Text formatting */}
        <ToolButton
          label="𝐁"
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolButton
          label="𝘐"
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolButton
          label="S̶"
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />

        {/* Headings */}
        <ToolButton
          label="H2"
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolButton
          label="H3"
          title="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />

        {/* Lists */}
        <ToolButton
          label="• List"
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolButton
          label="1. List"
          title="Ordered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />

        {/* Block */}
        <ToolButton
          label="❝"
          title="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolButton
          label="&lt;/&gt; Code"
          title="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />

        {/* Link */}
        <ToolButton
          label="🔗"
          title="Insert link"
          active={editor.isActive("link")}
          onClick={addLink}
        />

        {/* Images */}
        <ToolButton
          label="🖼 URL"
          title="Insert image from URL"
          onClick={addImage}
        />
        {onImageUpload && (
          <ToolButton
            label={uploading ? "⏳" : "⬆ Upload"}
            title={uploading ? "Uploading…" : "Upload image"}
            onClick={() => fileInput.current?.click()}
          />
        )}

        {/* Clear */}
        <ToolButton
          label="✕ Clear"
          title="Clear formatting"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
