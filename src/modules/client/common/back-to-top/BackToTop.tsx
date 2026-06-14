"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 grid h-11 w-11 place-items-center rounded-full border border-[#DBEAFE] dark:border-white/10 bg-white/90 dark:bg-[#252525]/90 text-[#2563EB] dark:text-indigo-300 shadow-lg shadow-blue-100/50 dark:shadow-black/40 backdrop-blur transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-[#2563EB] hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 dark:focus:ring-indigo-500/40 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
