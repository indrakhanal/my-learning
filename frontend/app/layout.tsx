import "./styles.css";
import Link from "next/link";
import { ServiceWorkerRegistration } from "../components/ServiceWorkerRegistration";

export const metadata = {
  title: "Learning Notes",
  description: "Personal notes, published thoughtfully — a curated knowledge base.",
  manifest: "/manifest.webmanifest",
  themeColor: "#0d1117",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Learning Notes" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <ServiceWorkerRegistration />

        {/* ── Top Header ── */}
        <header>
          <div className="header-content">
            <Link href="/" className="logo">
              <span className="logo-icon" aria-hidden="true">📚</span>
              Learning Notes
            </Link>

            {/* Desktop nav (hidden on mobile — use bottom-nav instead) */}
            <nav className="header-nav" aria-label="Main navigation">
              <Link href="/">Notes</Link>
              <Link href="/courses">Courses</Link>
              <Link href="/about">About</Link>
              <Link href="/admin" className="btn-primary" style={{ minHeight: "36px", padding: "0.35rem 1rem", fontSize: "0.875rem" }}>
                Admin
              </Link>
            </nav>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="fade-in">
          {children}
        </main>

        {/* ── Bottom Navigation (Mobile PWA) ── */}
        <nav className="bottom-nav" aria-label="Mobile navigation">
          <Link href="/" className="bottom-nav-link" id="bnav-home">
            <span className="bottom-nav-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            Notes
          </Link>
          <Link href="/courses" className="bottom-nav-link" id="bnav-courses">
            <span className="bottom-nav-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
              </svg>
            </span>
            Courses
          </Link>
          <Link href="/about" className="bottom-nav-link" id="bnav-about">
            <span className="bottom-nav-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </span>
            About
          </Link>
          <Link href="/admin" className="bottom-nav-link" id="bnav-admin">
            <span className="bottom-nav-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </span>
            Admin
          </Link>
        </nav>
      </body>
    </html>
  );
}
