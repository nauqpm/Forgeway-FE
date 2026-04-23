// components/MenuPC.tsx
"use client";
import Link from "next/link";
import { Zap, ChevronDown, User, LayoutDashboard, Settings } from "lucide-react";
import { useState } from "react";

const MenuPC = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <nav className="hidden md:flex items-center gap-1">
      <NavItem href="/#features" label="Features" />
      <NavItem href="/#how-it-works" label="How It Works" />
      <NavItem href="/#pricing" label="Pricing" />
      <NavItem href="/#testimonials" label="Testimonials" />
    </nav>
  );
};

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}
      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50">
      {label}
    </Link>
  );
}

export default MenuPC;
