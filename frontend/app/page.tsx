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
      <section className="hero">
        <h1>Published learning notes</h1>
        <p>Ideas worth keeping, exploring in public. Welcome to my personal knowledge base.</p>
      </section>
      <NoteList notes={notes} />
    </>
  ); 
}
