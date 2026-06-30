import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vlot — budgetplanner",
  description: "Wat houd ik over, en hoeveel moet ik reserveren?",
};

// Runs before first paint so the saved theme is applied with no light-mode
// flash. Falls back to the OS preference when the user hasn't chosen yet.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var dark=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(dark)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl-BE" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
