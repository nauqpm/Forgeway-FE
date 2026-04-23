// AboutUsClient.tsx
"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Globe, Star, Heart, Zap } from "lucide-react";

const stats = [
  { id: 1, value: "10K+", label: "Active Users" },
  { id: 2, value: "500+", label: "Companies" },
  { id: 3, value: "99.9%", label: "Uptime" },
  { id: 4, value: "50+", label: "Countries" },
];

const features = [
  "Kanban & Scrum boards",
  "Task tracking with priorities",
  "Sprint planning & velocity",
  "Team collaboration & comments",
  "Knowledge base (spaces & pages)",
  "Role-based access control",
  "Real-time updates",
  "Fast, modern UI",
];

const AboutUsClient = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" /> Project Management Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            AL-TASK is the
            <br />
            <span className="text-indigo-600">Jira + Confluence</span> alternative
            <br />
            your team will actually use
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
            Inspired by the best tools in the industry. We took what works from Jira and Confluence,
            removed the complexity, and built something teams love to use.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 font-medium transition-colors">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/#features"
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 font-medium border border-gray-200 transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.id} className="text-center">
                <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">What's included</h2>
          <p className="text-gray-500 text-center mb-12">Everything your team needs to manage work effectively.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-indigo-200 mb-8">Join thousands of teams already using AL-TASK.</p>
          <Link href="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-3.5 rounded-xl hover:bg-indigo-50 font-semibold transition-colors">
            Start for Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutUsClient;
