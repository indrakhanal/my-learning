import { NoteView } from "../../../components/NoteView";
const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export const dynamic = "force-dynamic";
export default async function NotePage({ params }: { params: { id: string } }) { const r = await fetch(`${api}/notes/${params.id}`, { next: { revalidate: 60 } }); if (!r.ok) return <p>Note not found.</p>; return <NoteView note={await r.json()} />; }
