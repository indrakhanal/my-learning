"use client";

import sanitizeHtml from "sanitize-html";
import { useEffect, useState } from "react";

type Note = {
  title: string;
  content: string;
  tags: { tag: { name: string } }[];
  attachments: { id: string; url: string; filename: string; kind: "IMAGE" | "FILE" }[];
  resources: { id: string; label: string; url: string }[];
};

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      setProgress(pct);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="reading-progress" aria-hidden="true">
      <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}

export function NoteView({ note }: { note: Note }) {
  const cleanContent = sanitizeHtml(note.content, {
    allowedTags: ["p", "br", "strong", "em", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "img", "code", "pre"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https"],
  });

  const hasSidebar = note.resources.length > 0 || note.attachments.length > 0;

  return (
    <>
      <ReadingProgress />
      <div className={hasSidebar ? "note-detail-layout" : "note-detail-layout no-sidebar"}>
        {/* ── Main Article ── */}
        <article className="glass-card note-article">
          <p className="note-eyebrow">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true" style={{ marginRight: "4px" }}>
              <circle cx="4" cy="4" r="4" />
            </svg>
            Learning Note
          </p>
          <h1>{note.title}</h1>

          {note.tags.length > 0 && (
            <div className="note-tags">
              {note.tags.map(item => (
                <span key={item.tag.name} className="tag">{item.tag.name}</span>
              ))}
            </div>
          )}

          <div className="note-content" dangerouslySetInnerHTML={{ __html: cleanContent }} />
        </article>

        {/* ── Sidebar ── */}
        {hasSidebar && (
          <aside aria-label="Note resources">
            <div className="glass-card sidebar-card">
              <div className="sidebar-heading">
                <div>
                  <p className="sidebar-heading-label">Reference</p>
                  <h2>Links &amp; attachments</h2>
                </div>
              </div>

              {note.resources.length > 0 && (
                <section className="sidebar-section">
                  <h3>Useful links</h3>
                  <ul className="sidebar-link-list">
                    {note.resources.map(resource => (
                      <li key={resource.id}>
                        <a href={resource.url} target="_blank" rel="noreferrer">
                          <span>{resource.label}</span>
                          <small>Open ↗</small>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {note.attachments.length > 0 && (
                <section className="sidebar-section">
                  <h3>Attachments</h3>
                  <div className="sidebar-attachments">
                    {note.attachments.map(attachment =>
                      attachment.kind === "IMAGE" ? (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="attachment-card"
                        >
                          <img src={attachment.url} alt={attachment.filename} />
                          <span>{attachment.filename}</span>
                        </a>
                      ) : (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="file-card"
                        >
                          <span className="file-icon">PDF</span>
                          <span>{attachment.filename}</span>
                        </a>
                      )
                    )}
                  </div>
                </section>
              )}
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
