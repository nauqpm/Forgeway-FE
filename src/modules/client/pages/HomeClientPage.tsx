"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Menu, X, Zap, LayoutDashboard, CheckSquare, BookOpen, Users,
  Shield, ChevronDown, ArrowRight, Play, Star, Clock, BarChart3
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Kanban Boards",
    desc: "Visual project boards with drag-and-drop task management. Track work across columns in real-time.",
    color: "bg-indigo-500",
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    desc: "Create, assign, and track tasks with priorities, deadlines, labels, and story points.",
    color: "bg-blue-500",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    desc: "Manage team members, assign roles, and collaborate seamlessly across projects.",
    color: "bg-green-500",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    desc: "Organize documents, SOPs, and team knowledge in Confluence-like spaces and pages.",
    color: "bg-purple-500",
  },
  {
    icon: BarChart3,
    title: "Sprint Planning",
    desc: "Plan sprints, track velocity, and measure team performance with detailed reports.",
    color: "bg-amber-500",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Granular permissions with owner, admin, member, and viewer roles for every workspace.",
    color: "bg-red-500",
  },
];

const testimonials = [
  { name: "Minh Trần", role: "Engineering Manager", avatar: "M", content: "AL-TASK transformed how our team handles projects. Sprint planning is now 10x faster." },
  { name: "Linh Nguyễn", role: "Product Owner", avatar: "L", content: "The best Jira alternative we've tried. Clean, fast, and actually gets used by the whole team." },
  { name: "Hoàng Lê", role: "Startup Founder", avatar: "H", content: "Set up in minutes. Our team of 15 manages all projects without any training needed." },
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "500+", label: "Companies" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "User Rating" },
];

export default function HomeClientPage() {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      {/* ===== NAVBAR ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">AL-TASK</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
              <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
                  <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
              {mobileOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm font-medium text-gray-600 py-2">Features</a>
            <a href="#how-it-works" className="block text-sm font-medium text-gray-600 py-2">How It Works</a>
            <a href="#testimonials" className="block text-sm font-medium text-gray-600 py-2">Testimonials</a>
            <a href="#pricing" className="block text-sm font-medium text-gray-600 py-2">Pricing</a>
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <Link href="/login" className="block text-center py-2 text-sm font-medium text-gray-600">Sign In</Link>
              <Link href="/register" className="block text-center bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium">Get Started Free</Link>
            </div>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Now in Public Beta — Free for small teams
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Project Management
              <br />
              <span className="text-indigo-600">Without the Complexity</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 mb-8 leading-relaxed">
              AL-TASK brings Jira and Confluence power to teams of all sizes. Manage projects, assign tasks, track sprints, and store team knowledge — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl hover:bg-indigo-700 font-semibold text-base transition-colors shadow-lg shadow-indigo-200">
                Start for Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-3.5 rounded-xl hover:bg-gray-50 font-semibold text-base transition-colors border border-gray-200 shadow-sm">
                <Play className="w-5 h-5" /> Watch Demo
              </Link>
            </div>
            <p className="text-sm text-gray-400 mt-4">No credit card required &middot; Free forever for up to 5 users</p>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-gray-400 font-medium">AL-TASK Dashboard</span>
              </div>
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 p-6 min-h-[320px] flex items-center justify-center">
                <div className="grid grid-cols-4 gap-3 w-full">
                  {["To Do", "In Progress", "In Review", "Done"].map((col, i) => (
                    <div key={col} className="bg-white/5 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-white/80">{col}</span>
                        <span className="text-[10px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded-full">{[3, 5, 2, 4][i]}</span>
                      </div>
                      {[0, 1].map(row => (
                        <div key={row} className="bg-white/10 rounded-lg p-2.5">
                          <div className="h-2 w-16 bg-white/20 rounded mb-1.5" />
                          <div className="h-1.5 w-10 bg-white/10 rounded" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything your team needs</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">From small teams to enterprise organizations, AL-TASK scales to match how your team works.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all group">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Get started in minutes</h2>
            <p className="text-lg text-gray-500">Three simple steps to transform how your team works.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Workspace", desc: "Set up your workspace and invite team members with customizable roles." },
              { step: "02", title: "Build Projects", desc: "Create projects with Kanban or Scrum boards. Define workflows and statuses." },
              { step: "03", title: "Ship Faster", desc: "Assign tasks, run sprints, track progress, and ship great products together." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-600">{item.step}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-indigo-600">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Loved by teams everywhere</h2>
          </div>
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-indigo-600">{testimonials[activeTestimonial].avatar}</span>
            </div>
            <p className="text-lg text-gray-700 mb-6 italic leading-relaxed">"{testimonials[activeTestimonial].content}"</p>
            <p className="font-semibold text-gray-900">{testimonials[activeTestimonial].name}</p>
            <p className="text-sm text-gray-500">{testimonials[activeTestimonial].role}</p>
            <div className="flex items-center justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === activeTestimonial ? "bg-indigo-600" : "bg-gray-300"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-500">Start free, upgrade when you need more.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">Free</h3>
              <p className="text-gray-500 text-sm mb-6">For small teams getting started</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500 ml-2">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Up to 5 team members", "3 active projects", "Kanban boards", "Task management", "Basic reporting", "Knowledge base (5 pages)"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                Get Started
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-indigo-600 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">POPULAR</div>
              <h3 className="font-semibold text-white text-lg mb-1">Pro</h3>
              <p className="text-indigo-200 text-sm mb-6">For growing teams</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$12</span>
                <span className="text-indigo-200 ml-2">/user/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Unlimited team members", "Unlimited projects", "Scrum & Kanban boards", "Sprint planning & velocity", "Advanced reporting", "Unlimited knowledge base", "Priority support", "Custom workflows"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-indigo-100">
                    <CheckSquare className="w-4 h-4 text-indigo-300 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-white text-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
                Start 14-day Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to work smarter?</h2>
          <p className="text-lg text-gray-400 mb-8">Join thousands of teams already using AL-TASK to ship better products, faster.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl hover:bg-indigo-700 font-semibold text-base transition-colors">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-950 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">AL-TASK</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} AL-TASK. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
