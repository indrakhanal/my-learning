import { ChapterView } from "../../../../../components/ChapterView";

const api = process.env.NEXT_PUBLIC_API_URL;
export const dynamic = "force-dynamic";

export default async function ChapterPage({ params }: { params: { slug: string, id: string } }) {
  let course = null;
  let chapter = null;
  
  if (api) {
    try {
      // We need the course to verify it's published and get its title/slug for the breadcrumb
      const courseRes = await fetch(`${api}/courses/${params.slug}`, { cache: "no-store" });
      if (courseRes.ok) {
        course = await courseRes.json();
        
        // Verify that the requested item is a top-level chapter or a subchapter in this course.
        const chapterExists = course.chapters.some((c: any) =>
          c.id === params.id || c.subchapters.some((subchapter: any) => subchapter.id === params.id)
        );
        
        if (chapterExists) {
          const chapterRes = await fetch(`${api}/courses/${course.id}/chapters/${params.id}`, { cache: "no-store" });
          if (chapterRes.ok) {
            chapter = await chapterRes.json();
            chapter.course = { title: course.title, slug: course.slug }; // attach course info for breadcrumb
          }
        }
      }
    } catch (error) {
      console.error("API is unavailable", error);
    }
  }

  if (!chapter) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h1>Chapter not found</h1>
        <p style={{ color: "var(--text-muted)" }}>This chapter may not exist or belongs to an unpublished course.</p>
      </div>
    );
  }

  return <ChapterView chapter={chapter} outline={course.chapters} />;
}
