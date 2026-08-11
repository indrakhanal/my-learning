"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

function ToolButton({ active, label, onClick }: { active?: boolean; label: string; onClick: () => void }) { return <button type="button" className={active ? "tool active" : "tool"} onClick={onClick}>{label}</button>; }

export function RichTextEditor({ value, onChange, onImageUpload }: { value: string; onChange: (html: string) => void; onImageUpload?: (file: File) => Promise<string | null> }) {
  const editor = useEditor({ extensions: [StarterKit, Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }), Image], content: value, editorProps: { attributes: { class: "tiptap-content", "aria-label": "Note content" } }, onUpdate: ({ editor: instance }) => onChange(instance.getHTML()) });
  const fileInput = useRef<HTMLInputElement>(null); const [uploading, setUploading] = useState(false);
  useEffect(() => { if (editor && value !== editor.getHTML()) editor.commands.setContent(value); }, [editor, value]);
  if (!editor) return <div className="rich-editor loading">Loading editor…</div>;
  const activeEditor = editor;
  const addLink = () => { const href = window.prompt("Paste a link URL"); if (href) activeEditor.chain().focus().extendMarkRange("link").setLink({ href }).run(); };
  const addImage = () => { const src = window.prompt("Paste a public image URL"); if (src) activeEditor.chain().focus().setImage({ src, alt: "" }).run(); };
  async function uploadInlineImage(event: React.ChangeEvent<HTMLInputElement>) { const image = event.target.files?.[0]; event.target.value = ""; if (!image || !onImageUpload) return; setUploading(true); try { const url = await onImageUpload(image); if (url) activeEditor.chain().focus().setImage({ src: url, alt: image.name }).run(); } finally { setUploading(false); } }
  return <div className="rich-editor"><input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={uploadInlineImage} /><div className="toolbar" aria-label="Editor toolbar"><ToolButton label="B" active={activeEditor.isActive("bold")} onClick={() => activeEditor.chain().focus().toggleBold().run()} /><ToolButton label="I" active={activeEditor.isActive("italic")} onClick={() => activeEditor.chain().focus().toggleItalic().run()} /><ToolButton label="H2" active={activeEditor.isActive("heading", { level: 2 })} onClick={() => activeEditor.chain().focus().toggleHeading({ level: 2 }).run()} /><ToolButton label="• List" active={activeEditor.isActive("bulletList")} onClick={() => activeEditor.chain().focus().toggleBulletList().run()} /><ToolButton label="1. List" active={activeEditor.isActive("orderedList")} onClick={() => activeEditor.chain().focus().toggleOrderedList().run()} /><ToolButton label="Link" active={activeEditor.isActive("link")} onClick={addLink} /><ToolButton label="Image URL" onClick={addImage} />{onImageUpload && <ToolButton label={uploading ? "Uploading…" : "Upload image"} onClick={() => fileInput.current?.click()} />}<ToolButton label="Clear" onClick={() => activeEditor.chain().focus().clearNodes().unsetAllMarks().run()} /></div><EditorContent editor={activeEditor} /></div>;
}
