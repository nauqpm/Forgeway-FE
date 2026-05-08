"use client";

import Link from "next/link";
import { CheckSquare, FolderKanban, BookOpen, Users, ArrowRight, BarChart3, Zap, Shield } from "lucide-react";

const highlights = [
  { icon: CheckSquare, title: "Task Management", desc: "Full-featured issue tracking with priorities, assignees, labels, and due dates." },
  { icon: FolderKanban, title: "Kanban & Scrum", desc: "Choose between Kanban boards or Scrum sprints. Your workflow, your way." },
  { icon: BookOpen, title: "Knowledge Base", desc: "Organize team documentation in spaces and pages. Never lose an SOP again." },
  { icon: Users, title: "Team Management", desc: "Invite members, assign roles, and control access at every level." },
  { icon: BarChart3, title: "Reporting", desc: "Track velocity, burndown charts, and team performance at a glance." },
  { icon: Shield, title: "Security", desc: "Enterprise-grade security with role-based access control and SSO support." },
];

export default function PostListClientPage() {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Project Management
            <br />
            <span className="text-indigo-600">Made Simple</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-8">
            Everything your team needs to plan, track, and ship great work —
            without the complexity of traditional project management tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl hover:bg-indigo-700 font-semibold transition-colors shadow-lg shadow-indigo-200">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-3.5 rounded-xl hover:bg-gray-50 font-medium border border-gray-200 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Powerful features, simple to use</h2>
          <p className="text-gray-500 text-center mb-12">Everything you need to run successful projects, all in one place.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((h) => (
              <div key={h.title} className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <h.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{h.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">See AL-TASK in action</h2>
          <p className="text-gray-500 mb-8">Join thousands of teams already using AL-TASK to manage their work.</p>
          <Link href="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl hover:bg-indigo-700 font-semibold transition-colors">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
