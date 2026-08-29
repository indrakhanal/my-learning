"use client";

import sanitizeHtml from "sanitize-html";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CourseOutline, type OutlineChapter } from "./CourseOutline";

type Chapter = {
  id: string;
  title: string;
  content: string;
  order: number;
  parentId: string | null;
  course: { title: string, slug: string };
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
      <div className="reading-progress-bar" style={{ width: `${progress}%`, background: "var(--accent)" }} />
    </div>
  );
}

export function ChapterView({ chapter, outline }: { chapter: Chapter; outline: OutlineChapter[] }) {
  const parentIndex = outline.findIndex(item => item.id === (chapter.parentId ?? chapter.id));
  const chapterNumber = parentIndex >= 0 ? parentIndex + 1 : chapter.order;
  const subchapterNumber = chapter.parentId
    ? (outline[parentIndex]?.subchapters.findIndex(item => item.id === chapter.id) ?? -1) + 1
    : null;
  const displayNumber = subchapterNumber ? `${chapterNumber}.${subchapterNumber}` : chapterNumber;
  const cleanContent = sanitizeHtml(chapter.content, {
    allowedTags: ["p", "br", "strong", "em", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "img", "code", "pre"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https"],
  });

  const hasSidebar = chapter.resources.length > 0 || chapter.attachments.length > 0;

  return (
    <>
      <ReadingProgress />
      <div className={`course-reader-layout${hasSidebar ? " has-sidebar" : ""}`}>
        <CourseOutline chapters={outline} courseSlug={chapter.course.slug} currentChapterId={chapter.id} />
        {/* ── Main Article ── */}
        <article className="glass-card note-article">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/courses">Courses</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/courses/${chapter.course.slug}`}>{chapter.course.title}</Link>
            <span aria-hidden="true">/</span>
            <span>{chapter.parentId ? "Subchapter" : "Chapter"} {displayNumber}</span>
          </nav>
          
          <p className="note-eyebrow">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true" style={{ marginRight: "4px" }}>
              <circle cx="4" cy="4" r="4" />
            </svg>
            {chapter.parentId ? "Subchapter" : "Chapter"} {displayNumber}
          </p>
          <h1>{chapter.title}</h1>

          <div className="note-content" dangerouslySetInnerHTML={{ __html: cleanContent }} />
        </article>

        {/* ── Sidebar ── */}
        {hasSidebar && (
          <aside className="note-sidebar" aria-label="Chapter resources">
            <div className="glass-card sidebar-card">
              <div className="sidebar-heading">
                <div>
                  <p className="sidebar-heading-label">Reference</p>
                  <h2>Links &amp; attachments</h2>
                </div>
              </div>

              {chapter.resources.length > 0 && (
                <section className="sidebar-section">
                  <h3>Useful links</h3>
                  <ul className="sidebar-link-list">
                    {chapter.resources.map(resource => (
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

              {chapter.attachments.length > 0 && (
                <section className="sidebar-section">
                  <h3>Attachments</h3>
                  <div className="sidebar-attachments">
                    {chapter.attachments.map(attachment =>
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
