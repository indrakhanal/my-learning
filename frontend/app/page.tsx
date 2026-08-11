import { NoteList } from "../components/NoteList";

const api = process.env.NEXT_PUBLIC_API_URL;
export const dynamic = "force-dynamic";

export default async function Home() {
  let notes = [];
  if (api) {
    try {
      const response = await fetch(`${api}/notes`, { cache: "no-store" });
      if (response.ok) notes = await response.json();
      else console.error(`Notes API returned ${response.status}`);
    } catch (error) {
      console.error("Notes API is unavailable", error);
    }
  } else {
    console.error("NEXT_PUBLIC_API_URL is not configured");
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-eyebrow">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <circle cx="5" cy="5" r="5" fill="currentColor" />
          </svg>
          Knowledge Base
        </div>
        <h1>Published learning notes</h1>
        <p>
          Ideas worth keeping, explored in public. A curated collection of thoughts on software,
          design, and the art of building things.
        </p>
        <div className="hero-divider" />
      </section>

      {/* ── Notes Grid ── */}
      <NoteList notes={notes} />
    </>
  );
}
