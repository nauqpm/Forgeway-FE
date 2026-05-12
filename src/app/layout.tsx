import "@/styles/globals.css";
import "@/styles/suneditor.min.css";
import QueryProvider from "@/modules/admin/common/providers/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import TokenHandler from "@/common/components/TokenHandler";
import ToastProvider from "@/common/providers/ToastProvider";
import { Suspense } from "react";

export const   metadata = {
    title: "AL-TASK — Project Management for Modern Teams",
    description: "AL-TASK is a Jira + Confluence alternative. Manage projects, track tasks, plan sprints, and store team knowledge — all in one place.",
    openGraph: {
      title: "AL-TASK",
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
        <link rel="icon" href="/logo-yaviet/logo 1.png" sizes="any" />
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
