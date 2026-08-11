export const metadata = {
  title: "About | Learning Notes",
};

export default function About() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 0" }}>
      <section className="glass-card">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "var(--accent-gradient)",
            margin: "0 auto 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "3rem",
            color: "white",
            fontWeight: "bold"
          }}>
            JD
          </div>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>Jane Doe</h1>
          <p style={{ fontSize: "1.1rem", color: "var(--accent-color)" }}>Software Engineer & Lifelong Learner</p>
        </div>
        
        <div className="prose">
          <h2>About Me</h2>
          <p>
            Welcome to my personal learning notes. I use this space to document my journey, share insights, and keep track of interesting ideas I stumble upon.
          </p>
          <p>
            I believe in "learning in public" — sharing imperfect, ongoing thoughts rather than waiting for polished perfection. Here you'll find notes on software architecture, design systems, and whatever else captures my curiosity.
          </p>
          
          <h2 style={{ marginTop: "2rem" }}>Connect</h2>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <a href="#" className="btn-primary">GitHub</a>
            <a href="#" className="btn-primary" style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-primary)" }}>Twitter / X</a>
            <a href="#" className="btn-primary" style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-primary)" }}>LinkedIn</a>
          </div>
        </div>
      </section>
    </div>
  );
}
