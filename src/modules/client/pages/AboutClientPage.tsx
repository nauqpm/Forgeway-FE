"use client";
import React from "react";
import Link from "next/link";
import {
  Zap, CheckCircle, Users, Globe, Heart,
  ArrowRight, Star, Shield, Clock, BarChart3, BookOpen
} from "lucide-react";

const values = [
  { icon: Globe, title: "User-First Design", desc: "Every feature is built with the user in mind. We obsess over the details so your team can focus on what matters." },
  { icon: CheckCircle, title: "Radical Simplicity", desc: "No bloated interfaces. No steep learning curves. Get your team up and running in minutes, not weeks." },
  { icon: Heart, title: "Built with Care", desc: "We treat every interaction with respect — from the fastest load time to the smallest UI detail." },
  { icon: Star, title: "Always Improving", desc: "We ship new features weekly. Your feedback drives our roadmap and we're always listening." },
];

const team = [
  { name: "Alex Nguyen", role: "Founder & CEO", avatar: "A" },
  { name: "Sarah Chen", role: "Head of Engineering", avatar: "S" },
  { name: "Mike Johnson", role: "Head of Product", avatar: "M" },
  { name: "Lisa Park", role: "Head of Design", avatar: "L" },
];

export default function AboutClientPage() {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            We're building the future of
            <br />
            <span className="text-indigo-600">team collaboration</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-8">
            AL-TASK started with a simple belief: project management software should work for you, not against you.
            We build tools that help teams ship faster and collaborate better.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 font-medium transition-colors">
              Start Building <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/#features" className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 font-medium border border-gray-200 transition-colors">
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                We believe great work happens when great tools get out of the way.
                AL-TASK is designed to be intuitive enough for any team — from 2-person startups
                to enterprises with hundreds of collaborators.
              </p>
              <p className="text-gray-500 leading-relaxed mb-6">
                Inspired by the best tools in the industry — Jira, Confluence, Linear, Notion —
                we took what works and eliminated what doesn't. The result is a platform that
                your entire team will actually want to use.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "2019", label: "Founded" },
                  { value: "50+", label: "Countries" },
                  { value: "10K+", label: "Users" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-indigo-50 rounded-2xl p-8">
              <blockquote className="text-lg text-indigo-900 italic leading-relaxed">
                "We set out to build the project management tool we always wished existed — one that gets out of your way and lets you focus on shipping great products."
              </blockquote>
              <p className="mt-4 text-sm font-medium text-indigo-700">— The AL-TASK Team</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <v.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet the team</h2>
          <p className="text-gray-500 mb-12">Passionate builders working to make team collaboration better.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                  {member.avatar}
                </div>
                <p className="font-semibold text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to join us?</h2>
          <p className="text-indigo-200 mb-8">Start your free account today and see the difference AL-TASK can make for your team.</p>
          <Link href="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-3.5 rounded-xl hover:bg-indigo-50 font-semibold transition-colors">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
