import Header from "@/modules/client/common/header/Header";
import Footer from "@/modules/client/common/footer/Footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-950 dark:to-gray-900 flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
