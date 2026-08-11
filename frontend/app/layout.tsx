import "./styles.css";
import Link from "next/link";
import { ServiceWorkerRegistration } from "../components/ServiceWorkerRegistration";

export const metadata = {
  title: "Learning Notes", 
  description: "Personal notes, published thoughtfully.",
  manifest: "/manifest.webmanifest",
  themeColor: "#3f5dcc",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Learning Notes" }
};

export default function Layout({ children }: { children: React.ReactNode }) { 
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistration />
        <header>
          <div className="header-content">
            <Link href="/" className="logo">Learning Notes</Link>
            <nav>
              <Link href="/">Home</Link>
              <Link href="/about">About</Link>
              <Link href="/admin" className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Admin</Link>
            </nav>
          </div>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  ); 
}
