import "@/styles/globals.css";
import "@/styles/suneditor.min.css";
import QueryProvider from "@/common/providers/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import TokenHandler from "@/common/components/TokenHandler";
import ToastProvider from "@/common/providers/ToastProvider";
import { Suspense } from "react";

export const   metadata = {
    title: "SDLC Platform — Project Management for Modern Teams",
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
    <html lang="vi">
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
            `,
          }}
        />
      </head>
      <body className="">
        <Suspense>
          <QueryProvider>
            <AuthProvider>
              <TokenHandler />
              <ToastProvider />
              {children}
            </AuthProvider>
          </QueryProvider>
        </Suspense>
      </body>
    </html>
  );
}
