import { NoteList } from "../components/NoteList";
const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export const dynamic = "force-dynamic";
export default async function Home() { 
  const notes = await fetch(`${api}/notes`, { next: { revalidate: 60 } }).then(r => r.ok ? r.json() : []); 
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
