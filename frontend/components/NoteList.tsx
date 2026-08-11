import Link from "next/link";
type Note = { id: string; title: string; content: string; tags: { tag: { name: string } }[]; updatedAt: string };
export function NoteList({ notes }: { notes: Note[] }) { 
  if (!notes.length) return <p>No published notes yet.</p>; 
  return (
    <div className="notes-grid">
      {notes.map(note => { 
        const excerpt = note.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); 
        return (
          <article key={note.id} className="glass-card note-card">
            <h2><Link href={`/notes/${note.id}`}>{note.title}</Link></h2>
            <p>{excerpt.slice(0, 160)}{excerpt.length > 160 ? "…" : ""}</p>
            <div className="note-meta">
              <div className="tags">
                {note.tags.map(x => <span key={x.tag.name} className="tag">{x.tag.name}</span>)}
              </div>
              <small>{new Date(note.updatedAt).toLocaleDateString()}</small>
            </div>
          </article>
        ); 
      })}
    </div>
  ); 
}
