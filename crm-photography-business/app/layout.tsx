import { Fira_Sans, Fira_Code } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import styles from "./layout.module.css";

// Self-hosted at build time by next/font — the console stays usable offline.
const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira-sans",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-fira-code",
});

export const metadata = {
  title: "Agency Admin Console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${firaSans.variable} ${firaCode.variable}`}>
      <body>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}>
            Agency Admin
          </Link>
          <nav className={styles.nav}>
            <Link href="/photographers">Photographers</Link>
            <Link href="/convocation-events">Convocation Events</Link>
            <Link href="/bookings">Bookings</Link>
            <Link href="/scheduled-tasks">Scheduled Tasks</Link>
          </nav>
        </header>
        <main className={styles.main}>{children}</main>
      </body>
    </html>
  );
}
