"use client";

import Link from "next/link";
import { useState } from "react";

export type OutlineChapter = {
  id: string;
  title: string;
  order: number;
  subchapters: { id: string; title: string; order: number; parentId: string | null }[];
};

export function CourseOutline({
  chapters,
  courseSlug,
  currentChapterId,
}: {
  chapters: OutlineChapter[];
  courseSlug: string;
  currentChapterId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="course-outline" aria-label="Course contents">
      <button
        type="button"
        className="course-outline-toggle btn-secondary"
        aria-expanded={isOpen}
        aria-controls="course-outline-navigation"
        onClick={() => setIsOpen(open => !open)}
      >
        Contents
      </button>
      <nav id="course-outline-navigation" className={`course-outline-nav${isOpen ? " is-open" : ""}`}>
        <div className="course-outline-heading">
          <span>Course contents</span>
          <button type="button" className="course-outline-close" onClick={() => setIsOpen(false)} aria-label="Close course contents">Close</button>
        </div>
        <ol className="course-outline-list">
          {chapters.map((chapter, index) => {
            const chapterActive = chapter.id === currentChapterId;
            const subchapterActive = chapter.subchapters.some(item => item.id === currentChapterId);
            return (
              <li key={chapter.id}>
                <Link
                  href={`/courses/${courseSlug}/chapters/${chapter.id}`}
                  className={`course-outline-link${chapterActive ? " active" : ""}`}
                  aria-current={chapterActive ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  <span>{index + 1}</span>{chapter.title}
                </Link>
                {chapter.subchapters.length > 0 && (
                  <ol className={`course-outline-sublist${subchapterActive ? " has-active-child" : ""}`}>
                    {chapter.subchapters.map((subchapter, subIndex) => {
                      const active = subchapter.id === currentChapterId;
                      return (
                        <li key={subchapter.id}>
                          <Link
                            href={`/courses/${courseSlug}/chapters/${subchapter.id}`}
                            className={`course-outline-link subchapter${active ? " active" : ""}`}
                            aria-current={active ? "page" : undefined}
                            onClick={() => setIsOpen(false)}
                          >
                            <span>{index + 1}.{subIndex + 1}</span>{subchapter.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
