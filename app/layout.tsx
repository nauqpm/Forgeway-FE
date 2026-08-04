import "@/styles/globals.css";
import "@/styles/suneditor.min.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import QueryProvider from "@/shared/providers/QueryProvider";
import TokenHandler from "@/modules/auth/shared/components/TokenHandler";
import ToastProvider from "@/shared/providers/ToastProvider";
import CountryFlagPolyfill from "@/shared/providers/CountryFlagPolyfill";
import { Suspense } from "react";

export const metadata = {
  title: {
    template: '%s - SDLC Platform - Automation Land',
    default: 'SDLC Platform - Automation Land',
  },
  description: "SDLC Platform is a Jira + Confluence alternative. Manage projects, track tasks, plan sprints, and store team knowledge — all in one place.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=5", sizes: "any" },
      { url: "/icon.png?v=5", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico?v=5",
    apple: "/apple-icon.png?v=5",
  },
  openGraph: {
    title: "SDLC Platform",
    type: "website",
    locale: "en_US",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico?v=5" sizes="any" />
        <link rel="icon" type="image/png" href="/icon.png?v=5" sizes="512x512" />
        <link rel="shortcut icon" href="/favicon.ico?v=5" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('app-theme') || 'system';
                  var classList = document.documentElement.classList;
                  classList.remove('light', 'dark');
                  if (theme === 'system') {
                    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    classList.add(systemTheme);
                  } else {
                    classList.add(theme);
                  }
                } catch (e) {}
              })();
              (function() {
                try {
                  var scale = localStorage.getItem('app-font-scale') || '1';
                  document.documentElement.style.setProperty('--font-scale', scale);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="" suppressHydrationWarning>
        <Suspense>
          <QueryProvider>
            <CountryFlagPolyfill />
            <TokenHandler />
            <ToastProvider />
            {children}
          </QueryProvider>
        </Suspense>
      </body>
    </html>
  );
}
