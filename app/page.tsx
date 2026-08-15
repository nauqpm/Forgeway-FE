"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import appleIcon from "../public/apple-icon.png";
import aboutUsImage from "../public/about-us.webp";
import { CtaAuthAction, HeroAuthActions, NavAuthActions } from "./LandingAuthActions";
import BackToTop from "@/shared/components/back-to-top/BackToTop";
import {
  Activity,
  AtSign,
  BarChart3,
  Bell,
  CalendarClock,
  Check,
  Building,
  CheckCircle2,
  ChevronRight,
  Cpu,
  FileText,
  GitBranch,
  History,
  KanbanSquare,
  LayoutGrid,
  Lightbulb,
  MessageSquare,
  MessageSquareText,
  MoreHorizontal,
  PanelRight,
  PencilLine,
  Plus,
  Repeat,
  Rocket,
  Search,
  Eye,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  TrendingUp,
  UserPlus,
  UsersRound,
  Zap,
} from "lucide-react";

const teamSolutions = [
  {
    id: "startup",
    tabLabel: "Startup Teams",
    headline: "Go from idea to launch in record time.",
    description: "For startups, momentum is everything. SDLC Platform provides a lightweight, hyper-fast interface that cuts project overhead. It allows you to align your founding team, track early feedback, and iterate rapidly without the bloat of traditional trackers.",
    bullets: [
      { title: "Zero Setup Friction", desc: "Spin up a project workspace in under 10 seconds." },
      { title: "Flexible Statuses", desc: "Move fast with custom lightweight kanban workflows." },
      { title: "Founder Visibility", desc: "Clear dashboard metrics showing product momentum and tasks." }
    ],
    mockupType: "startup"
  },
  {
    id: "agencies",
    tabLabel: "Agencies",
    headline: "Deliver client projects transparently and on schedule.",
    description: "Manage multiple client organizations under one platform with strict role isolation. Deliver clear visibility to stakeholders, manage resource allocation across sprint teams, and show progress with clean burndown reporting.",
    bullets: [
      { title: "Multi-Tenant Spaces", desc: "Keep separate client projects securely isolated." },
      { title: "Client Read-Only Access", desc: "Share progress with free external guest observer seats." },
      { title: "Sprint Predictability", desc: "Accurate velocity estimation to meet client deadlines." }
    ],
    mockupType: "agencies"
  },
  {
    id: "developers",
    tabLabel: "Developers",
    headline: "Designed for keyboard speed and developer focus.",
    description: "Designed by developers, for developers. SDLC Platform integrates deeply with developer workflows. Minimize keyboard-to-mouse context switching with command menus, rapid task creation, and clean issue links connected to your code.",
    bullets: [
      { title: "Keyboard-First Navigation", desc: "Command menu actions to browse and modify tasks." },
      { title: "Git-Linked Tasks", desc: "Automatically update task status via branch naming patterns." },
      { title: "Clean Code Syntax", desc: "Paste markdown snippets and error trace logs cleanly in discussions." }
    ],
    mockupType: "developers"
  },
  {
    id: "product",
    tabLabel: "Product Teams",
    headline: "Translate vision into structured, shippable roadmaps.",
    description: "Bridge the gap between strategic vision and execution. Create clear epics, map sprints, and prioritize backlogs with intuitive drag-and-drop mechanics. Make sure your engineers are always working on what matters most.",
    bullets: [
      { title: "Backlog Grooming", desc: "Easy drag-and-drop prioritization and story sizing." },
      { title: "Epic Tracking", desc: "Group related features together and track progress percentage." },
      { title: "Stakeholder Alignment", desc: "Visual sprint roadmaps that keep everyone on the same page." }
    ],
    mockupType: "product"
  },
  {
    id: "enterprise",
    tabLabel: "Enterprise Teams",
    headline: "Enterprise-grade governance with modern usability.",
    description: "Scale collaboration securely across hundreds of users. Maintain compliance with fine-grained role-based permissions, advanced security audits, SSO integration, and custom workflow policies that match your enterprise standards.",
    bullets: [
      { title: "Fine-Grained RBAC", desc: "Precise permission matrix for owners, members, and guests." },
      { title: "Audit & Analytics", desc: "Log every workspace action for compliance and security checks." },
      { title: "SSO & SAML Security", desc: "Secure access with enterprise identity provider integrations." }
    ],
    mockupType: "enterprise"
  }
];

const stats = [
  { value: "10,000+", label: "Tasks completed" },
  { value: "500+", label: "Teams onboarded" },
  { value: "99.9%", label: "Platform uptime" },
];

const features = [
  { icon: CheckCircle2, title: "Task Management", text: "Create, assign, prioritize, and track execution across every project stream with precision." },
  { icon: KanbanSquare, title: "Kanban Board", text: "Visualize flow from backlog to done with status columns built for modern delivery teams." },
  { icon: Zap, title: "Sprint Planning", text: "Plan iterations, balance capacity, and keep product priorities connected to execution." },
  { icon: Bell, title: "Notifications", text: "Keep every assignee, reviewer, and stakeholder aligned when work status changes." },
  { icon: UsersRound, title: "Team Collaboration", text: "Use comments, mentions, activity history, and ownership signals in one shared workspace." },
  { icon: Repeat, title: "Real-time Updates", text: "See progress, task movement, and project activity as teams collaborate live across the globe." },
  { icon: TrendingUp, title: "Analytics", text: "Monitor velocity, blockers, workload, and delivery health with focused analytics dashboards." },
  { icon: ShieldCheck, title: "Role Permissions", text: "Protect workspaces with granular access control for admins, members, and external guests." },
];

const kanbanColumns = [
  {
    title: "Todo",
    count: 8,
    countBg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    borderLeft: "border-l-slate-300 dark:border-l-slate-600",
    cards: [
      { title: "Define workspace roles", priority: "PRIORITY P1", badgeBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400", time: "2D AGO" },
      { title: "Create onboarding checklist", priority: "PRIORITY P2", badgeBg: "bg-slate-50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400", time: "2D AGO" },
    ],
  },
  {
    title: "In Progress",
    count: 4,
    countBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    borderLeft: "border-l-blue-500 dark:border-l-blue-500",
    cards: [
      { title: "Sprint board API", priority: "PRIORITY P1", badgeBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400", time: "4H LEFT" },
      { title: "Notification preferences", priority: "PRIORITY P2", badgeBg: "bg-slate-50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400", time: "3D LEFT" },
    ],
  },
  {
    title: "Review",
    count: 3,
    countBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-450",
    borderLeft: "border-l-amber-500 dark:border-l-amber-500",
    cards: [
      { title: "Kanban drag states", priority: "PRIORITY P1", badgeBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400", time: "2H AGO" },
      { title: "Activity feed filters", priority: "PRIORITY P2", badgeBg: "bg-slate-50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400", time: "3D AGO" },
    ],
  },
  {
    title: "Done",
    count: 12,
    countBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450",
    borderLeft: "border-l-emerald-500 dark:border-l-emerald-500",
    isCompleted: true,
    cards: [
      { title: "Workspace dashboard", priority: "COMPLETED", badgeBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400", time: "2D AGO" },
      { title: "Member invite flow", priority: "COMPLETED", badgeBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400", time: "3H AGO" },
    ],
  },
];

const roles = [
  { role: "Admin", access: "FULL SYSTEM CONTROL", level: "100%", icon: ShieldCheck },
  { role: "Workspace Owner", access: "BILLING & MEMBERS", level: "82%", icon: User },
  { role: "Member", access: "CREATE & UPDATE WORK", level: "58%", icon: UsersRound },
  { role: "Guest", access: "READ-ONLY VISIBILITY", level: "30%", icon: Eye },
];

const steps = ["Create Workspace", "Invite Team", "Create Tasks", "Track Progress"];

const faqs = [
  { question: "What is SDLC Platform?", answer: "SDLC Platform is a project management platform for teams that need workspaces, tasks, Kanban boards, sprint planning, collaboration, and project progress tracking in one place." },
  { question: "Who should use SDLC-Platform?", answer: "It is built for developer teams, startups, agencies, freelancers, product managers, project managers, and enterprise teams that need a reliable delivery workspace." },
  { question: "Does SDLC Platform support permissions?", answer: "Yes. The product model includes role-based access for Admins, Workspace Owners, Members, and Guests so teams can manage visibility and control safely." },
  { question: "Can teams track progress in real time?", answer: "Yes. The landing page highlights real-time updates, activity tracking, analytics cards, progress bars, and productivity reporting as core product value." },
];

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return { ref, isVisible };
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto mb-16 max-w-3xl text-center">
      <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 shadow-sm">
        {eyebrow}
      </span>
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl leading-tight">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
        {text}
      </p>
    </div>
  );
}

function DashboardPreview() {
  const metricCards = [
    { label: "completed", value: "24", subtitle: "in the last 7 days", icon: CheckCircle2, tone: "text-emerald-500" },
    { label: "updated", value: "86", subtitle: "in the last 7 days", icon: PencilLine, tone: "text-[#9B9A97]" },
    { label: "created", value: "31", subtitle: "in the last 7 days", icon: FileText, tone: "text-indigo-400" },
    { label: "due soon", value: "12", subtitle: "in the next 7 days", icon: CalendarClock, tone: "text-amber-500" },
  ];

  const previewTasks = [
    { key: "ALT-128", title: "Design workspace permission matrix", priority: "High", type: "Story", avatar: "MN", color: "bg-indigo-600" },
    { key: "ALT-134", title: "Connect sprint board with activity feed", priority: "Medium", type: "Task", avatar: "LT", color: "bg-emerald-600" },
    { key: "ALT-139", title: "QA notification preferences", priority: "Low", type: "Bug", avatar: "QA", color: "bg-amber-600" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="absolute -left-6 top-16 z-20 hidden rounded-xl border border-white/[0.12] bg-[#202020]/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-md md:block">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9B9A97]">Active sprint</p>
        <p className="mt-1 text-xl font-bold text-white">72%</p>
        <div className="mt-3 h-1.5 w-32 rounded-full bg-[#252525]">
          <div className="h-1.5 w-[72%] rounded-full bg-indigo-500" />
        </div>
      </div>
      <div className="absolute -right-6 bottom-16 z-20 hidden rounded-xl border border-white/[0.12] bg-[#202020]/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-md lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9B9A97]">Workspace members</p>
        <div className="mt-3 flex -space-x-2">
          {["PM", "FE", "BE", "QA"].map((item) => (
            <span key={item} className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#1A1A1A] bg-indigo-600 text-[0.625rem] font-bold text-white">{item}</span>
          ))}
        </div>
      </div>
      {/* Rotating gradient border glow wrapper */}
      <div className="relative rounded-2xl p-[2px] overflow-hidden" style={{ isolation: 'isolate' }}>
        {/* Spinning conic gradient border */}
        <div
          className="absolute inset-[-50%] z-0"
          style={{
            background: 'conic-gradient(from 0deg, #ef4444, #f97316, #ef4444, transparent 40%, transparent 60%, #3b82f6, #06b6d4, #3b82f6, transparent 100%)',
            animation: 'spin-border 4s linear infinite',
          }}
        />
        {/* Inner card background mask */}
        <div className="relative z-10 overflow-hidden rounded-[14px] bg-[#1A1A1A] shadow-2xl shadow-indigo-950/40">
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#202020] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-400" />
            <span className="h-3 w-3 rounded-full bg-amber-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-300" />
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-[#1A1A1A] px-3 py-1.5 text-xs text-[#9B9A97] sm:flex">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            SDLC Platform / Product Delivery / Sprint 24
          </div>
        </div>

        <div className="grid min-h-[42.5rem] lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden border-r border-white/[0.06] bg-[#202020]/80 p-4 lg:block">
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#1A1A1A] p-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white p-1 shadow-sm">
                <Image src={appleIcon} alt="SDLC Platform" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Product Delivery</p>
                <p className="text-xs text-[#787774]">Software project</p>
              </div>
            </div>
            {["Summary", "Board", "List", "Backlog", "Calendar", "Settings"].map((item, index) => (
              <div key={item} className={`mb-1.5 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${index === 1 ? "bg-indigo-600 text-white" : "text-[#9B9A97] hover:bg-[#252525] hover:text-[#E8E8E7]"}`}>
                <span>{item}</span>
                {index === 1 ? <ChevronRight className="h-4 w-4" /> : null}
              </div>
            ))}
          </aside>

          <div className="min-w-0 bg-[#1A1A1A] p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 border-b border-white/[0.06] pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#787774]">
                  <span>Workspaces</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>Product Delivery</span>
                </div>
                <h3 className="mt-1 text-xl font-semibold text-white">Board</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#787774]" />
                  <input readOnly placeholder="Search tasks..." className="h-9 w-48 rounded-lg border border-white/[0.08] bg-[#202020] pl-8 pr-3 text-sm text-[#E8E8E7] outline-none" />
                </div>
                <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#202020] px-3 text-sm font-medium text-[#9B9A97]">
                  <SlidersHorizontal className="h-4 w-4" /> Filter
                </button>
                <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white">
                  <Plus className="h-4 w-4" /> Task
                </button>
              </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-4">
              {metricCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#202020] p-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#252525]">
                      <Icon className={`h-5 w-5 ${item.tone}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold leading-none text-white">{item.value}</p>
                      <p className="text-sm font-semibold capitalize text-[#E8E8E7]">{item.label}</p>
                      <p className="text-[0.6875rem] text-[#787774]">{item.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-2xl border border-white/[0.06] bg-[#202020] p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="inline-flex overflow-hidden rounded-lg border border-white/[0.08]">
                    <button className="grid h-8 w-9 place-items-center bg-indigo-600 text-white"><LayoutGrid className="h-4 w-4" /></button>
                    <button className="grid h-8 w-9 place-items-center border-l border-white/[0.08] text-[#9B9A97]"><PanelRight className="h-4 w-4" /></button>
                  </div>
                  <p className="text-xs font-medium text-[#787774]">12 work items</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {["TO DO", "IN PROGRESS", "REVIEW"].map((column, columnIndex) => (
                    <div key={column} className="flex min-h-[24.375rem] flex-col rounded-xl border border-white/[0.06] bg-[#252525]/50">
                      <div className="flex items-center justify-between rounded-t-xl border-b border-white/[0.06] bg-[#252525] px-3 py-2.5">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9B9A97]">
                          {column}
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gray-700 px-1.5 text-[0.625rem] text-[#9B9A97]">{columnIndex + 2}</span>
                        </h4>
                        <MoreHorizontal className="h-4 w-4 text-[#787774]" />
                      </div>
                      <div className="space-y-3 p-3">
                        {previewTasks.slice(columnIndex === 2 ? 1 : 0, columnIndex === 0 ? 2 : 3).map((task, index) => (
                          <div key={`${column}-${task.key}`} className="group rounded-lg border border-white/[0.08] bg-[#1A1A1A] shadow-sm transition hover:border-indigo-500">
                            {columnIndex === 1 && index === 0 ? <div className="h-7 rounded-t-lg bg-indigo-500" /> : null}
                            <div className="p-3.5">
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <p className="text-sm font-medium leading-snug text-white group-hover:text-indigo-300">{task.title}</p>
                                <MoreHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
                              </div>
                              <div className="mb-3 flex flex-wrap gap-1.5">
                                <span className={`rounded px-2 py-0.5 text-[0.625rem] font-semibold ${task.priority === "High" ? "bg-red-950/50 text-red-300" : task.priority === "Medium" ? "bg-amber-950/50 text-amber-300" : "bg-green-950/50 text-green-300"}`}>
                                  {task.priority}
                                </span>
                                <span className="rounded bg-indigo-950/60 px-2 py-0.5 text-[0.625rem] font-semibold text-indigo-300">{task.type}</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
                                <span className="font-mono text-xs font-bold text-[#787774]">{task.key}</span>
                                <span className={`grid h-7 w-7 place-items-center rounded-full ${task.color} text-[0.625rem] font-bold text-white ring-2 ring-[#1A1A1A]`}>{task.avatar}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {columnIndex === 0 ? (
                          <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-white/[0.08] text-sm font-medium text-[#787774]">Drag tasks here</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden min-h-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#202020] xl:block">
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-[#787774]">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    <span>ALT-128</span>
                  </div>
                  <h4 className="mt-2 text-lg font-semibold leading-tight text-white">Design workspace permission matrix</h4>
                </div>
                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[["Status", "In Progress"], ["Priority", "High"], ["Assignee", "Minh Nguyen"], ["Sprint", "Sprint 24"]].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-white/[0.06] bg-[#1A1A1A] p-3">
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-[#787774]">{label}</p>
                        <p className="mt-1 text-sm font-medium text-[#E8E8E7]">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-[#1A1A1A] p-3">
                    <p className="mb-3 text-sm font-semibold text-white">Description</p>
                    <p className="text-sm leading-6 text-[#9B9A97]">Define Admin, Workspace Owner, Member, and Guest permissions for project visibility, task updates, and workspace settings.</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-[#1A1A1A] p-3">
                    <p className="mb-3 text-sm font-semibold text-white">Activity</p>
                    <div className="space-y-3">
                      {["PM mentioned @frontend", "QA added review checklist", "Owner changed due date"].map((item) => (
                        <div key={item} className="flex items-center gap-3 text-sm text-[#9B9A97]">
                          <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-white p-0.5">
                            <Image src={appleIcon} alt="" width={24} height={24} className="h-6 w-6 rounded-full object-contain" />
                          </span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-[#1A1A1A] p-3">
                    <p className="mb-3 text-sm font-semibold text-white">Progress</p>
                    <div className="h-2 rounded-full bg-[#252525]">
                      <div className="h-2 w-[68%] rounded-full bg-indigo-500" />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-[#787774]">
                      <span>6 subtasks</span><span>68%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-[#202020] p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-white">Status overview</h4>
                    <p className="text-xs text-[#787774]">Snapshot of work item status.</p>
                  </div>
                  <button className="text-xs font-medium text-indigo-300">View all</button>
                </div>
                <div className="flex items-center gap-5">
                  <div className="relative h-28 w-28 rounded-full bg-[conic-gradient(#6366f1_0deg_170deg,#3b82f6_170deg_250deg,#22c55e_250deg_360deg)]">
                    <div className="absolute inset-4 grid place-items-center rounded-full bg-[#202020] text-center">
                      <div>
                        <p className="text-2xl font-bold text-white">42</p>
                        <p className="text-[0.625rem] font-semibold text-[#9B9A97]">Items</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[["To Do", "12", "bg-[#787774]/60"], ["In Progress", "18", "bg-indigo-500"], ["Done", "12", "bg-emerald-500"]].map(([label, value, color]) => (
                      <div key={label} className="flex items-center gap-2 text-[#9B9A97]">
                        <span className={`h-3 w-3 rounded-sm ${color}`} />
                        <span>{label}: {value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#202020] p-4">
                <h4 className="text-base font-semibold text-white">Priority breakdown</h4>
                <p className="mb-4 text-xs text-[#787774]">How current work is prioritized.</p>
                <div className="flex h-32 items-end justify-between gap-2 border-b border-l border-white/[0.08] px-3 pb-2">
                  {[34, 76, 52, 28, 12].map((height, index) => (
                    <div key={height} className="flex flex-1 flex-col items-center justify-end gap-2">
                      <div className="w-full max-w-10 rounded-sm bg-[#787774]/60" style={{ height: `${height}%` }} />
                      <span className="text-[0.625rem] text-[#787774]">{["High", "Med", "Low", "Bug", "None"][index]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Close inner card background mask */}
        </div>
        {/* Close rotating gradient border wrapper */}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return null;
}

// Code cũ của trang Home được giữ lại theo yêu cầu
export function LandingPageOld() {
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const activeTeam = teamSolutions[activeTeamIndex];

  const heroReveal = useScrollReveal();
  const solutionsReveal = useScrollReveal();
  const featuresReveal = useScrollReveal();
  const productReveal = useScrollReveal();
  const kanbanReveal = useScrollReveal();
  const collaborationReveal = useScrollReveal();
  const securityReveal = useScrollReveal();
  const howItWorksReveal = useScrollReveal();
  const aboutReveal = useScrollReveal();
  const faqReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();

  return (
    <main className="min-h-screen bg-[#F2FAFF] dark:bg-[#1A1A1A] text-[#111111] dark:text-[#E8E8E7]">
      {/* ambient glow — Option 1 Warm Glowing Atmospheric Orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[40rem] w-[64rem] -translate-x-1/2 rounded-full bg-orange-400/10 dark:bg-orange-500/8 blur-[130px]" />
        <div className="absolute -right-20 top-1/4 h-[32rem] w-[32rem] rounded-full bg-amber-300/15 dark:bg-amber-500/8 blur-[110px]" style={{ animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute -left-20 bottom-1/4 h-[26rem] w-[26rem] rounded-full bg-rose-300/12 dark:bg-rose-600/6 blur-[110px]" style={{ animation: 'float 10s ease-in-out infinite reverse' }} />
        <div className="absolute right-1/3 bottom-0 h-[22rem] w-[22rem] rounded-full bg-orange-200/12 dark:bg-orange-500/6 blur-[90px]" style={{ animation: 'float 12s ease-in-out infinite' }} />
      </div>

      {/* nav */}
      <nav className="sticky top-0 z-50 border-b border-[#CBD5E1] dark:border-white/10 bg-[#F2FAFF]/90 dark:bg-[#1A1A1A]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 rounded-xl px-2.5 py-1.5">
            <span className="grid h-11 w-11 place-items-center p-1">
              <Image src={appleIcon} alt="SDLC Platform" width={38} height={38} className="h-9 w-9 rounded-lg object-contain" />
            </span>
            <span className="flex flex-col text-base font-bold leading-[0.95] tracking-tight text-[#2563EB]">
              <span className="text-2xl">SDLC</span>
              <span>PLATFORM</span>
            </span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-[#64748b] dark:text-slate-300 lg:flex">
            {["Features", "Solutions", "Security", "About"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-orange-500 dark:hover:text-orange-400 font-medium">{item}</a>
            ))}
          </div>
          <NavAuthActions />
        </div>
      </nav>

      {/* hero */}
      <section
        ref={heroReveal.ref}
        className={`relative px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-28 overflow-hidden transition-all duration-1000 ${
          heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Subtle grid line background pattern */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)]" />

        {/* Option 2: Warm Aurora Wave Mesh Background */}
        <div
          className="absolute left-1/2 top-1/3 -z-10 h-[36rem] w-[58rem] rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(249,115,22,0.22),rgba(245,158,11,0.2),rgba(244,63,94,0.16),rgba(249,115,22,0.22))] blur-[95px] pointer-events-none"
          style={{ animation: 'aurora-wave 18s ease-in-out infinite' }}
        />

        {/* Option 1 + 2: Warm Glowing Atmospheric Spotlight Layer */}
        <div className="absolute left-1/2 top-1/3 -z-10 h-[30rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.12)_0%,rgba(245,158,11,0.06)_45%,transparent_75%)] blur-[75px] pointer-events-none" />

        {/* Option 2: Floating Tech Node Particles (Rich Micro Particle Field) */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* Larger accent dots */}
          <div className="absolute top-16 left-[18%] h-2 w-2 rounded-full bg-orange-400/90 shadow-[0_0_12px_rgba(249,115,22,0.9)]" style={{ animation: 'particle-pulse 3s infinite ease-in-out' }} />
          <div className="absolute top-28 right-[20%] h-2.5 w-2.5 rounded-full bg-amber-400/80 shadow-[0_0_14px_rgba(251,191,36,0.9)]" style={{ animation: 'particle-pulse 4s infinite ease-in-out 1s' }} />
          <div className="absolute bottom-24 left-[24%] h-1.5 w-1.5 rounded-full bg-rose-400/90 shadow-[0_0_10px_rgba(244,63,94,0.9)]" style={{ animation: 'particle-pulse 2.5s infinite ease-in-out 0.5s' }} />
          <div className="absolute top-12 right-[32%] h-2 w-2 rounded-full bg-orange-300/80 shadow-[0_0_10px_rgba(253,186,116,0.8)]" style={{ animation: 'particle-pulse 3.5s infinite ease-in-out 1.5s' }} />
          <div className="absolute bottom-32 right-[18%] h-2.5 w-2.5 rounded-full bg-amber-300/90 shadow-[0_0_14px_rgba(252,211,77,0.9)]" style={{ animation: 'particle-pulse 4.5s infinite ease-in-out 0.8s' }} />

          {/* Micro & Tiny particles (1px - 2px) */}
          <div className="absolute top-8 left-[10%] h-1 w-1 rounded-full bg-amber-300/70 shadow-[0_0_6px_rgba(251,191,36,0.8)]" style={{ animation: 'particle-pulse 2.2s infinite ease-in-out 0.3s' }} />
          <div className="absolute top-36 left-[35%] h-1 w-1 rounded-full bg-orange-400/80 shadow-[0_0_6px_rgba(249,115,22,0.8)]" style={{ animation: 'particle-pulse 3.8s infinite ease-in-out 1.2s' }} />
          <div className="absolute top-20 left-[48%] h-1.5 w-1.5 rounded-full bg-rose-300/80 shadow-[0_0_8px_rgba(244,63,94,0.8)]" style={{ animation: 'particle-pulse 2.7s infinite ease-in-out 0.7s' }} />
          <div className="absolute top-44 right-[38%] h-1 w-1 rounded-full bg-amber-200/90 shadow-[0_0_6px_rgba(253,230,138,0.9)]" style={{ animation: 'particle-pulse 4.1s infinite ease-in-out 2s' }} />
          <div className="absolute top-14 right-[12%] h-1 w-1 rounded-full bg-orange-300/70 shadow-[0_0_6px_rgba(249,115,22,0.7)]" style={{ animation: 'particle-pulse 3.1s infinite ease-in-out 0.4s' }} />
          <div className="absolute bottom-20 left-[12%] h-1.5 w-1.5 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.8)]" style={{ animation: 'particle-pulse 2.9s infinite ease-in-out 1.7s' }} />
          <div className="absolute bottom-40 left-[42%] h-1 w-1 rounded-full bg-orange-400/70 shadow-[0_0_6px_rgba(249,115,22,0.7)]" style={{ animation: 'particle-pulse 3.4s infinite ease-in-out 0.9s' }} />
          <div className="absolute bottom-16 right-[30%] h-1.5 w-1.5 rounded-full bg-rose-300/90 shadow-[0_0_8px_rgba(244,63,94,0.9)]" style={{ animation: 'particle-pulse 2.4s infinite ease-in-out 1.4s' }} />
          <div className="absolute bottom-48 right-[10%] h-1 w-1 rounded-full bg-amber-300/80 shadow-[0_0_6px_rgba(251,191,36,0.8)]" style={{ animation: 'particle-pulse 3.6s infinite ease-in-out 0.2s' }} />

          {/* Ultra fine starlight micro dots (2px - 3px) */}
          <div className="absolute top-5 left-[28%] h-[3px] w-[3px] rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.9)]" style={{ animation: 'particle-pulse 2s infinite ease-in-out 0.1s' }} />
          <div className="absolute top-48 left-[15%] h-[2px] w-[2px] rounded-full bg-amber-100/90 shadow-[0_0_6px_rgba(254,243,199,0.9)]" style={{ animation: 'particle-pulse 3.2s infinite ease-in-out 1.1s' }} />
          <div className="absolute top-32 right-[45%] h-[3px] w-[3px] rounded-full bg-orange-200/80 shadow-[0_0_8px_rgba(254,215,170,0.9)]" style={{ animation: 'particle-pulse 2.8s infinite ease-in-out 1.8s' }} />
          <div className="absolute bottom-28 left-[38%] h-[2px] w-[2px] rounded-full bg-amber-300/80 shadow-[0_0_6px_rgba(252,211,77,0.8)]" style={{ animation: 'particle-pulse 3.9s infinite ease-in-out 0.6s' }} />
          <div className="absolute bottom-36 right-[25%] h-[3px] w-[3px] rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.9)]" style={{ animation: 'particle-pulse 2.3s infinite ease-in-out 1.3s' }} />
          <div className="absolute bottom-10 right-[42%] h-[2px] w-[2px] rounded-full bg-orange-300/80 shadow-[0_0_6px_rgba(253,186,116,0.8)]" style={{ animation: 'particle-pulse 3.7s infinite ease-in-out 2.2s' }} />
        </div>

        <div className="relative mx-auto max-w-7xl">
          {/* Hero Flank Floating Cards (Left & Right Flanks) */}
          <div className="hidden xl:block pointer-events-none">
            {/* Left Flank Card 1 - Active Sprint Progress */}
            <div className="pointer-events-auto absolute top-20 left-0 2xl:-left-12 w-60 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-[#1A1A1A]/80 p-3.5 shadow-xl shadow-orange-500/5 dark:shadow-black/40 backdrop-blur-md transition-all duration-500 hover:scale-105 hover:border-orange-400/60 -rotate-3 hover:rotate-0" style={{ animation: 'float 8s ease-in-out infinite' }}>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Sprint 24
                </span>
                <span className="text-orange-500 font-mono">94%</span>
              </div>
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: '94%' }} />
              </div>
              <p className="mt-2 text-[9px] font-medium text-slate-400 dark:text-slate-500">18 tasks remaining in release</p>
            </div>

            {/* Left Flank Card 2 - Merged PR Signal (Positioned at Top-48) */}
            <div className="pointer-events-auto absolute top-48 left-2 2xl:-left-8 w-56 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-[#1A1A1A]/80 p-3 shadow-xl shadow-orange-500/5 dark:shadow-black/40 backdrop-blur-md transition-all duration-500 hover:scale-105 hover:border-orange-400/60 rotate-2 hover:rotate-0" style={{ animation: 'float 10s ease-in-out infinite reverse 1s' }}>
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                  <GitBranch className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">PR #142 Merged</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">OAuth2 flow ready</p>
                </div>
              </div>
            </div>

            {/* Right Flank Card 1 - Realtime Team Members */}
            <div className="pointer-events-auto absolute top-20 right-0 2xl:-right-12 w-60 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-[#1A1A1A]/80 p-3.5 shadow-xl shadow-orange-500/5 dark:shadow-black/40 backdrop-blur-md transition-all duration-500 hover:scale-105 hover:border-orange-400/60 rotate-3 hover:rotate-0" style={{ animation: 'float 9s ease-in-out infinite 0.5s' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-orange-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#1A1A1A]">H</span>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#1A1A1A]">L</span>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#1A1A1A]">M</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">+5 Online</span>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="mt-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">Workspace sync active</p>
            </div>

            {/* Right Flank Card 2 - Cycle Time Insight (Positioned at Top-48) */}
            <div className="pointer-events-auto absolute top-48 right-2 2xl:-right-8 w-56 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-[#1A1A1A]/80 p-3.5 shadow-xl shadow-orange-500/5 dark:shadow-black/40 backdrop-blur-md transition-all duration-500 hover:scale-105 hover:border-orange-400/60 -rotate-2 hover:rotate-0" style={{ animation: 'float 11s ease-in-out infinite reverse 1.5s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Release Cycle</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">3.4 Days Avg</p>
                </div>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-300/60 dark:border-orange-800/40 bg-white/80 dark:bg-white/[0.04] px-4 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)] backdrop-blur-sm" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.1), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }}>
              <Sparkles className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
              <span>SDLC project management for modern product teams</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl leading-[1.1] md:leading-[1.15]">
              Plan, build, and ship <br />
              <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 bg-clip-text text-transparent dark:from-orange-400 dark:via-amber-400 dark:to-rose-400 bg-[length:200%_auto]" style={{ animation: 'gradient-flow 4s ease infinite' }}>
                software together.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base md:text-lg">
              Move from scattered tasks to a premium unified workspace designed for the high-velocity rhythm of modern software delivery teams.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <HeroAuthActions />
            </div>
          </div>

          {/* Stats wrapped in a single card */}
          <div className="mt-14 rounded-3xl border border-slate-200/40 dark:border-white/10 bg-white/70 dark:bg-[#202020]/70 p-6 shadow-lg shadow-orange-100/30 dark:shadow-none backdrop-blur-sm hover:border-orange-300/60 dark:hover:border-orange-800/40 transition-colors duration-500">
            <div className="grid gap-6 divide-y divide-slate-100 dark:divide-white/5 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
              {stats.map((item, index) => {
                const StatIcon = [CheckCircle2, UsersRound, Activity][index];
                return (
                  <div key={item.label} className="text-center px-4 py-2 sm:py-0">
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-500 dark:text-orange-400">
                      <StatIcon className="h-4 w-4" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{item.value}</p>
                    <p className="mt-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-12">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* trusted by / solutions by team */}
      <div className="relative overflow-hidden border-y border-[#CBD5E1] dark:border-white/10 bg-slate-50/30 dark:bg-white/[0.01]">
        {/* Section Ambient Glow Orb */}
        <div className="absolute left-1/4 top-1/2 -z-10 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-orange-400/10 dark:bg-orange-500/8 blur-[100px] pointer-events-none" />
        <section
          ref={solutionsReveal.ref}
          id="solutions"
          className={`px-4 py-20 sm:px-6 lg:px-8 transition-all duration-700 ${
            solutionsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#64748b] dark:text-slate-400">
            Trusted operating layer for
          </p>

          {/* Tab Selector */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {teamSolutions.map((team, index) => {
              const isActive = activeTeamIndex === index;
              return (
                <button
                  key={team.id}
                  onClick={() => setActiveTeamIndex(index)}
                  className={`rounded-full px-5 py-2.5 text-xs font-extrabold transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.55),0_0_8px_rgba(239,68,68,0.3)] scale-[1.02]"
                      : "bg-white/80 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 hover:border-orange-400/60 dark:hover:border-orange-400/60 hover:text-orange-600 dark:hover:text-orange-400"
                  }`}
                >
                  {team.tabLabel}
                </button>
              );
            })}
          </div>

          {/* Active Content Grid */}
          <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            {/* Left Column: Descriptions */}
            <div className="flex flex-col justify-center">
              <span className="mb-4 inline-flex self-start items-center gap-1.5 rounded-full border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 shadow-sm">
                {activeTeam.tabLabel} Solution
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight sm:text-4xl">
                {activeTeam.headline}
              </h2>
              <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-500 dark:text-slate-400">
                {activeTeam.description}
              </p>

              <div className="mt-8 space-y-5">
                {activeTeam.bullets.map((bullet) => (
                  <div key={bullet.title} className="flex gap-4 items-start">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-sm">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{bullet.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{bullet.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Visual Dashboard Mockup */}
            <div className="relative rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#202020] p-6 shadow-xl shadow-slate-100/50 dark:shadow-none min-h-[380px] flex flex-col">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
                  <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                  <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
                </div>
                <div className="rounded-md bg-slate-50 dark:bg-white/[0.02] px-3 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest border border-slate-200/40 dark:border-white/5">
                  sdlc / {activeTeam.id}-workspace
                </div>
              </div>

              {/* Mockup content based on type */}
              <div className="flex-1 flex flex-col justify-between">
                {activeTeam.mockupType === "startup" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">MVP Sprint Board</h4>
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[9px] font-extrabold uppercase text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-950/20">Speed Run Active</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {/* To Do */}
                      <div className="rounded-xl bg-slate-50/50 dark:bg-[#252525] p-3 border border-slate-100 dark:border-white/[0.04]">
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">To Do</p>
                        <div className="rounded-lg bg-white dark:bg-[#1E1E1E] p-2.5 shadow-sm border border-slate-200/30 dark:border-white/[0.03] text-[10px] font-bold text-slate-800 dark:text-white">
                          Stripe setup
                        </div>
                      </div>

                      {/* In Progress */}
                      <div className="rounded-xl bg-slate-50/50 dark:bg-[#252525] p-3 border border-slate-100 dark:border-white/[0.04] border-l-2 border-l-indigo-500">
                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider mb-3">Active</p>
                        <div className="rounded-lg bg-white dark:bg-[#1E1E1E] p-2.5 shadow-sm border border-slate-200/30 dark:border-white/[0.03] text-[10px] font-bold text-slate-800 dark:text-white space-y-1.5">
                          <p>Design V1 UI</p>
                          <div className="h-1 rounded-full bg-slate-100 dark:bg-white/5">
                            <div className="h-1 rounded-full bg-indigo-500" style={{ width: "70%" }} />
                          </div>
                        </div>
                      </div>

                      {/* Done */}
                      <div className="rounded-xl bg-slate-50/50 dark:bg-[#252525] p-3 border border-slate-100 dark:border-white/[0.04]">
                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-3">Launched</p>
                        <div className="rounded-lg bg-white dark:bg-[#1E1E1E] p-2.5 shadow-sm border border-slate-200/30 dark:border-white/[0.03] text-[10px] font-bold text-slate-400 dark:text-slate-500 line-through space-y-1">
                          <p>Buy Domain</p>
                          <p className="text-[8px] font-medium text-emerald-600 dark:text-emerald-450 uppercase">Success</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTeam.mockupType === "agencies" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Client Portfolio View</h4>
                      <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[9px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400">3 Active Clients</span>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { client: "Acme Corp Website", progress: "88%", state: "Final Review", color: "bg-indigo-500" },
                        { client: "Beta Dashboard", progress: "45%", state: "Sprint 3", color: "bg-blue-500" },
                        { client: "Delta Launch Page", progress: "100%", state: "Completed", color: "bg-emerald-500", done: true }
                      ].map((project) => (
                        <div key={project.client} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/40 dark:bg-[#252525] p-3 text-[10px] font-bold">
                          <div className="space-y-1">
                            <p className={`text-slate-800 dark:text-white ${project.done ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>{project.client}</p>
                            <div className="flex gap-2 items-center text-[8px] text-slate-400 font-medium">
                              <span className="uppercase">{project.state}</span>
                              <span>•</span>
                              <span className="text-slate-500 dark:text-slate-350">Observer Guest Enabled</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] text-slate-500 dark:text-slate-400">{project.progress}</span>
                            <div className="h-1.5 w-12 rounded-full bg-slate-100 dark:bg-white/5">
                              <div className={`h-1.5 rounded-full ${project.color}`} style={{ width: project.progress }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTeam.mockupType === "developers" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Git Integration & Command</h4>
                      <span className="rounded-full bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-[9px] font-extrabold uppercase text-slate-600 dark:text-slate-400">Main Branch</span>
                    </div>

                    <div className="space-y-3 font-mono text-[9px] leading-relaxed">
                      {/* Commit log */}
                      <div className="rounded-xl bg-slate-950 p-3.5 text-slate-300 border border-slate-900 space-y-2">
                        <div className="flex items-center gap-1.5 text-indigo-400">
                          <span>$</span>
                          <span className="text-slate-450">{`git commit -m "feat: setup oauth2 [close-task-42]"`}</span>
                        </div>
                        <div className="text-slate-500">
                          [main 4f1a9b2] feat: setup oauth2 authentication
                          <br />
                          3 files changed, 42 insertions(+), 8 deletions(-)
                        </div>
                      </div>

                      {/* Linked Task status */}
                      <div className="rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-[#252525] p-3 flex justify-between items-center">
                        <div className="flex gap-2.5 items-center">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-slate-700 dark:text-white">Task-42: OAuth Setup</span>
                        </div>
                        <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-950/20 px-2 py-0.5 text-[8px] font-extrabold uppercase text-emerald-600 dark:text-emerald-450">Closed via PR #11</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTeam.mockupType === "product" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Product Roadmap Epics</h4>
                      <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[9px] font-extrabold uppercase text-blue-600 dark:text-blue-400">Q3 Roadmap</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { title: "Epic: Dashboard V2", progress: "92%", color: "bg-indigo-500" },
                        { title: "Epic: Mobile Workspace", progress: "68%", color: "bg-blue-500" },
                        { title: "Epic: API Keys Release", progress: "15%", color: "bg-slate-400" }
                      ].map((epic) => (
                        <div key={epic.title} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-800 dark:text-white">{epic.title}</span>
                            <span className="text-slate-500 dark:text-slate-400">{epic.progress}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 dark:bg-white/5">
                            <div className={`h-2 rounded-full ${epic.color}`} style={{ width: epic.progress }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTeam.mockupType === "enterprise" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">SSO & Governance settings</h4>
                      <span className="rounded-full bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 text-[9px] font-extrabold uppercase text-orange-600 dark:text-orange-400">Audit Active</span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Security switches */}
                      <div className="rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-[#252525] p-3 flex justify-between items-center text-[10px] font-bold">
                        <span>SAML / Okta SSO Integration</span>
                        <div className="h-5 w-9 rounded-full bg-orange-500 p-0.5 flex justify-end cursor-pointer">
                          <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
                        </div>
                      </div>

                      {/* Audit log trail */}
                      <div className="rounded-xl bg-slate-50/20 dark:bg-[#252525]/30 border border-slate-100 dark:border-white/[0.03] p-3">
                        <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Workspace Audit Log</p>
                        <div className="space-y-1.5 text-[8px] font-medium text-slate-550 dark:text-slate-350">
                          <div className="flex justify-between">
                            <span>Admin enabled Two-Factor Auth</span>
                            <span>2 mins ago</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{`User "Hoang" updated Role Permissions`}</span>
                            <span>1 hr ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Placeholder footer */}
                <div className="mt-6 border-t border-slate-100 dark:border-white/5 pt-4 text-center">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                    [ Placeholder: User Uploaded Design Mockup here ]
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* features */}
      <div className="relative overflow-hidden">
        {/* Section Ambient Glow Orb */}
        <div className="absolute right-0 top-1/3 -z-10 h-[32rem] w-[32rem] rounded-full bg-amber-400/10 dark:bg-amber-500/8 blur-[120px] pointer-events-none" />
        <section
          ref={featuresReveal.ref}
          id="features"
          className={`px-4 py-24 sm:px-6 lg:px-8 transition-all duration-700 ${
            featuresReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Feature showcase"
            title="Everything your team needs to move work from idea to release."
            text="A complete project management layer designed for software delivery: planning, execution, collaboration, visibility, and control."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, featureIndex) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group relative rounded-3xl border border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.03] p-8 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 dark:hover:border-orange-500/40 hover:-translate-y-1 transition-all duration-500 backdrop-blur-sm overflow-hidden" style={{ transitionDelay: `${featureIndex * 50}ms` }}>
                  {/* Gradient accent line on top */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 text-orange-600 dark:text-orange-400 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{feature.title}</h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </div>

      {/* product preview */}
      <div className="relative overflow-hidden border-t border-slate-100 dark:border-white/10 bg-slate-100/50 dark:bg-[#1a1a1a]/40">
        {/* Section Ambient Glow Orb */}
        <div className="absolute left-10 top-1/2 -z-10 h-[28rem] w-[36rem] -translate-y-1/2 rounded-full bg-orange-500/12 dark:bg-orange-500/10 blur-[110px] pointer-events-none" />
        <section
          ref={productReveal.ref}
          className={`px-4 py-24 sm:px-6 lg:px-8 transition-all duration-700 ${
            productReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 shadow-sm">
              Product preview
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              See workspaces, boards, and task details together.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
              The interface is designed around the real rhythm of delivery teams: quick status scanning, task ownership, contextual discussion, and visible project health.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Workspace hub",
                "Board execution",
                "Task detail panel",
                "Member presence"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#202020] p-4 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-orange-500 text-white shrink-0">
                    <Check className="h-3 w-3 stroke-[3.5]" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-2xl py-12 px-4 sm:px-6">
            {/* Main Workspace Card */}
            <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#202020] p-6 md:p-8 shadow-[0_20px_40px_-5px_rgba(15,23,42,0.12),0_8px_16px_-6px_rgba(15,23,42,0.12)] dark:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.5)] w-full max-w-lg md:max-w-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspace</p>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mobile App Release</h3>
                </div>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">On Track</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 pr-8 sm:pr-16">
                {["Authentication", "Sprint Planning", "QA Review", "Release Notes"].map((item, index) => (
                  <div key={item} className="rounded-2xl border border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#252525] p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item}</p>
                    <div className="mt-4 h-1 rounded-full bg-slate-200/60 dark:bg-white/10">
                      <div className="h-1 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" style={{ width: `${92 - index * 15}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overlapping Task Detail Card */}
            <div className="absolute right-0 bottom-0 md:-right-6 md:-bottom-6 w-72 sm:w-80 rounded-3xl border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-[#202020] p-6 shadow-2xl z-10 transition hover:translate-y-[-2px] duration-200">
              <div>
                <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Task Detail</p>
                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Implement role matrix</h3>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Define permissions for workspace owner, member, and guest access.
                </p>
              </div>
              <div className="mt-5 space-y-2.5">
                {[
                  "Anh mentioned Linh",
                  "Minh attached spec",
                  "QA moved to review"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-[#252525] p-3 text-[10px] text-slate-650 dark:text-slate-300 shadow-sm">
                    <MessageSquareText className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* kanban */}
      <div className="relative overflow-hidden border-t border-slate-100 dark:border-white/10">
        {/* Section Ambient Glow Spotlight */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-[28rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12)_0%,transparent_70%)] blur-[110px] pointer-events-none" />
        <section
          ref={kanbanReveal.ref}
          id="kanban"
          className={`px-4 py-24 sm:px-6 lg:px-8 transition-all duration-700 ${
            kanbanReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Kanban workflow"
            title="A board view for performance."
            text="Give teams a shared visual system for execution, review quality, and delivery accountability."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kanbanColumns.map((column) => (
              <div key={column.title} className="flex flex-col">
                {/* Header row */}
                <div className="mb-5 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.title === 'Todo' ? 'bg-slate-400' : column.title === 'In Progress' ? 'bg-blue-500' : column.title === 'Review' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      {column.title}
                    </span>
                  </div>
                  <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-2 text-[10px] font-bold ${column.countBg || 'bg-slate-100 text-slate-650'}`}>
                    {column.count}
                  </span>
                </div>
                {/* Cards stack */}
                <div className="space-y-3.5">
                  {column.cards.map((card) => (
                    <div
                      key={card.title}
                      className={`rounded-2xl border border-slate-200/50 dark:border-white/[0.04] bg-white dark:bg-[#202020] p-5 shadow-sm hover:border-orange-500/50 dark:hover:border-orange-400/50 dark:hover:bg-[#242424] transition-all duration-200 ${column.borderLeft || ""}`}
                    >
                      <p className={`text-xs font-semibold text-slate-800 dark:text-white leading-relaxed ${column.isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
                        {card.title}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 font-bold tracking-wide">
                        <span className={`rounded-md px-2 py-1 text-[9px] font-extrabold uppercase ${card.badgeBg || "bg-slate-50 text-slate-500"}`}>
                          {card.priority}
                        </span>
                        <span className="uppercase text-[9px]">{card.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>

      {/* solutions */}
      <div className="relative overflow-hidden border-t border-slate-100 dark:border-white/10 bg-slate-50/20 dark:bg-transparent">
        {/* Section Ambient Glow Orb */}
        <div className="absolute right-10 top-1/3 -z-10 h-[30rem] w-[30rem] rounded-full bg-orange-400/12 dark:bg-orange-500/10 blur-[110px] pointer-events-none" />
        <section
          ref={collaborationReveal.ref}
          id="collaboration"
          className={`px-4 py-24 sm:px-6 lg:px-8 transition-all duration-700 ${
            collaborationReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 items-center">
          {/* Left Column - Collaboration */}
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex self-start items-center gap-1.5 rounded-full border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 shadow-sm">
              Collaboration
            </span>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Engage your team everywhere.
            </h2>
            <div className="mt-8 space-y-6">
              {[
                { title: "Assign Tasks", text: "Clear ownership with assignees, reviewer, due date, and status tags.", icon: UserPlus },
                { title: "Comments", text: "Discuss implementation details directly where work happens, contextualized by history.", icon: MessageSquare },
                { title: "Mentions", text: "Pull teammates into critical decisions without losing the project context.", icon: AtSign },
                { title: "Team Activities", text: "Audit movement, updates, and delivery signals across the entire workspace.", icon: History }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-4 items-start p-3 -mx-3 rounded-2xl hover:bg-orange-50/40 dark:hover:bg-orange-950/10 transition-colors duration-300 cursor-default">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 text-orange-600 dark:text-orange-400 shadow-sm">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Progress Tracking */}
          <div id="analytics" className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#202020] p-8 shadow-lg shadow-slate-100 dark:shadow-none">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 shadow-sm">
              Progress tracking
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Insights that show health.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["Completion", "84%", "text-orange-500"],
                ["Efficiency", "+18%", "text-emerald-600"],
                ["Cycle time", "3.4d", "text-slate-800 dark:text-white"],
                ["Blocked", "06", "text-rose-600"]
              ].map(([label, value, colorClass]) => (
                <div key={label} className="rounded-2xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-[#252525]/30 p-5 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className={`mt-2 text-2xl font-black ${colorClass}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-[#252525]/30 p-5">
              <div className="mb-4 flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sprint burndown</span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Healthy Status</span>
              </div>
              <div className="flex h-28 items-end gap-3">
                {[80, 65, 58, 70, 50, 40, 25, 10].map((height, i) => (
                  <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-orange-500 to-amber-300 dark:from-orange-600 dark:to-amber-400/40 transition-all duration-500 hover:opacity-80" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* permissions */}
      <div className="relative overflow-hidden border-t border-slate-100 dark:border-white/10 bg-slate-50/10 dark:bg-transparent">
        {/* Section Ambient Glow Orb */}
        <div className="absolute right-1/4 top-1/2 -z-10 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-amber-500/10 dark:bg-amber-500/8 blur-[110px] pointer-events-none" />
        <section
          ref={securityReveal.ref}
          id="security"
          className={`px-4 py-24 sm:px-6 lg:px-8 transition-all duration-700 ${
            securityReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 shadow-sm">
              Security & permissions
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl leading-tight">
              Enterprise-grade access control for teams.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
              Give every person the right level of access, from full administration to scoped guest visibility, ensuring trust and clarity.
            </p>
          </div>
          <div className="space-y-4">
            {roles.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.role} className="group rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] p-6 shadow-md shadow-slate-100/50 dark:shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:hover:border-orange-400/40 backdrop-blur-sm overflow-hidden relative">
                  {/* Subtle top accent */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${item.role === 'Admin' ? 'from-emerald-400 to-emerald-600' : item.role === 'Workspace Owner' ? 'from-blue-400 to-blue-600' : item.role === 'Member' ? 'from-orange-400 to-amber-500' : 'from-slate-300 to-slate-400'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 text-orange-600 dark:text-orange-400 shadow-sm group-hover:shadow-md transition-shadow">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors leading-none">{item.role}</p>
                        <p className="mt-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">{item.access}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-350">{item.level}</span>
                  </div>
                  <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/5">
                    <div className="h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500" style={{ width: item.level }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </div>

      {/* how it works */}
      <div className="relative overflow-hidden">
        {/* Section Ambient Glow Spotlight */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-[24rem] w-[56rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.12)_0%,transparent_75%)] blur-[85px] pointer-events-none" />
        <section
          ref={howItWorksReveal.ref}
          className={`px-4 py-20 sm:px-6 lg:px-8 transition-all duration-700 ${
            howItWorksReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="How it works"
            title="From empty workspace to visible delivery in four steps."
            text="The onboarding model is simple enough for startups and structured enough for enterprise teams."
          />
          <div className="relative">
            {/* Connecting Horizontal Line for Desktop — animated warm gradient */}
            <div className="absolute top-7 left-[12%] right-[12%] h-[2px] z-0 hidden md:block overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-orange-300 via-amber-400 to-orange-300 dark:from-orange-900 dark:via-amber-500 dark:to-orange-900 bg-[length:200%_100%]" style={{ animation: 'shimmer 3s linear infinite' }} />
            </div>

            <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
              {steps.map((step, index) => {
                const Icon = [LayoutGrid, UserPlus, PencilLine, BarChart3][index];
                return (
                  <div key={step} className="relative flex flex-col items-center text-center group">
                    {/* Circle Wrapper */}
                    <div className="relative z-10 grid h-14 w-14 place-items-center rounded-full border-2 border-orange-500 dark:border-orange-400 bg-white dark:bg-[#1A1A1A] text-orange-500 dark:text-orange-400 shadow-md shadow-orange-100 dark:shadow-none transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    {/* Number label */}
                    <span className="mt-6 text-[10px] font-extrabold uppercase tracking-widest text-orange-500 dark:text-orange-400">
                      0{index + 1}
                    </span>
                    {/* Title */}
                    <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                      {step}
                    </h3>
                    {/* Description */}
                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 max-w-[220px] mx-auto">
                      {index === 0 && "Set up projects, teams, statuses, and delivery structure."}
                      {index === 1 && "Bring developers, product managers, agencies, or stakeholders into one flow."}
                      {index === 2 && "Break goals into assignable tasks with priority, comments, and ownership."}
                      {index === 3 && "Use boards, activity, and analytics to keep progress visible."}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* about */}
      <div className="relative overflow-hidden border-t border-slate-100 dark:border-white/10">
        {/* Section Ambient Glow Orb */}
        <div className="absolute left-10 top-1/4 -z-10 h-[34rem] w-[34rem] rounded-full bg-orange-400/10 dark:bg-orange-500/8 blur-[120px] pointer-events-none" />
        <section
          ref={aboutReveal.ref}
          id="about"
          className={`px-4 py-24 sm:px-6 lg:px-8 transition-all duration-700 ${
            aboutReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
        <div className="mx-auto max-w-7xl">
          {/* Top Half: About Automation Land */}
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 shadow-sm">
                About us
              </span>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl leading-tight">
                About Automation Land
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
                Automation Land is a pioneering company in applying modern technology to the real estate brokerage and property management industry. We are committed to comprehensive digital transformation, delivering modern technology solutions.
              </p>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Our Vision</h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Sustainable development combining digital technology with deep market expertise.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Our Reach</h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Pioneering PropTech ecosystem streamlining operations across the industry.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[24px] border border-slate-200/50 dark:border-white/[0.04] shadow-2xl shadow-indigo-500/10">
              <Image src={aboutUsImage} alt="Automation Land Team" className="w-full object-cover" />
            </div>
          </div>

          {/* Bottom Half: Why Choose Us */}
          <div className="mt-24">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 shadow-sm">
                Excellence
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#111111] dark:text-white sm:text-4xl">
                Why Choose Us
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "PropTech Pioneer",
                  text: "Committed to comprehensive digital transformation in the real estate industry.",
                  icon: Building,
                },
                {
                  title: "Talented Team",
                  text: "Highly skilled engineers combining technological expertise with deep industry knowledge.",
                  icon: UsersRound,
                },
                {
                  title: "Industry 4.0",
                  text: "Leveraging AI, Big Data, and automation to build a modern PropTech ecosystem.",
                  icon: Cpu,
                },
                {
                  title: "Innovative Solutions",
                  text: "Developing innovative tools that optimize operations and strengthen competitiveness.",
                  icon: Lightbulb,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="group rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#202020] p-6 shadow-sm hover:border-orange-500/50 dark:hover:border-orange-400/50 dark:hover:bg-[#242424] transition-all duration-300 flex flex-col items-start text-left">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 mb-5 group-hover:scale-110 transition-transform">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">{item.title}</h3>
                    <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* FAQ */}
      <div className="relative overflow-hidden">
        {/* Section Ambient Glow Spotlight */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-[26rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12)_0%,transparent_75%)] blur-[95px] pointer-events-none" />
        <section
          ref={faqReveal.ref}
          className={`px-4 py-20 sm:px-6 lg:px-8 transition-all duration-700 ${
            faqReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
        <div className="mx-auto max-w-4xl">
          <SectionHeader
            eyebrow="FAQ"
            title="Questions teams ask before adopting SDLC Platform."
            text="Clear answers for product, engineering, agency, freelance, and enterprise teams evaluating a modern project management platform."
          />
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.03] p-5 transition-all duration-300 hover:shadow-md dark:hover:border-orange-500/30 open:border-l-2 open:border-l-orange-500 open:shadow-lg open:shadow-orange-100/20 dark:open:shadow-none backdrop-blur-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left font-semibold text-[#111111] dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                  {faq.question}
                  <ChevronRight className="h-5 w-5 flex-none text-[#64748b] dark:text-slate-400 transition-transform duration-300 group-open:rotate-90" />
                </summary>
                <p className="mt-4 text-sm leading-6 text-[#64748b] dark:text-slate-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      </div>

      {/* CTA */}
      <section
        ref={ctaReveal.ref}
        className={`px-4 py-20 sm:px-6 lg:px-8 transition-all duration-1000 ${
          ctaReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="group mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-600 via-amber-600 to-rose-600 p-8 text-center shadow-2xl shadow-orange-500/25 sm:p-14 relative border border-white/20">
          {/* Animated background aurora wave & pulsing aura */}
          <div className="absolute left-1/2 top-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/12 blur-[90px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.06)_50%,transparent_75%)] bg-[length:250%_250%]" style={{ animation: 'shimmer 4s linear infinite' }} />

          {/* Floating starlight micro particles inside CTA container */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-6 left-[15%] h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_8px_white]" style={{ animation: 'particle-pulse 2.5s infinite ease-in-out 0.2s' }} />
            <div className="absolute top-12 right-[18%] h-2 w-2 rounded-full bg-amber-200/90 shadow-[0_0_10px_white]" style={{ animation: 'particle-pulse 3.2s infinite ease-in-out 1s' }} />
            <div className="absolute bottom-8 left-[22%] h-1 w-1 rounded-full bg-white/80 shadow-[0_0_6px_white]" style={{ animation: 'particle-pulse 2.8s infinite ease-in-out 0.5s' }} />
            <div className="absolute bottom-12 right-[25%] h-1.5 w-1.5 rounded-full bg-orange-100/90 shadow-[0_0_8px_white]" style={{ animation: 'particle-pulse 3.5s infinite ease-in-out 1.5s' }} />
          </div>

          <div className="relative z-10">
            {/* Animated Rocket Icon container with floating motion & glowing ring */}
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-white backdrop-blur-md shadow-xl shadow-black/10 ring-2 ring-white/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" style={{ animation: 'float 6s ease-in-out infinite' }}>
              <Rocket className="h-8 w-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            </div>

            <h2 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight drop-shadow-sm">
              Ready to organize your team&apos;s work?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-amber-100/95 sm:text-lg">
              Move from scattered tasks and unclear ownership to a project operating system built for software delivery.
            </p>
            <CtaAuthAction />
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t-0 bg-[#F2FAFF] dark:bg-[#111111] px-4 py-12 sm:px-6 lg:px-8 relative">
        {/* Gradient top divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent dark:via-indigo-700" />
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 rounded-xl px-2.5 py-1.5">
              <span className="grid h-11 w-11 place-items-center p-1">
                <Image src={appleIcon} alt="SDLC Platform" width={38} height={38} className="h-9 w-9 rounded-lg object-contain" />
              </span>
              <span className="flex flex-col text-base font-bold leading-[0.95] tracking-tight text-[#2563EB]">
                <span className="text-2xl">SDLC</span>
                <span>PLATFORM</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#64748b] dark:text-slate-400">
              A modern SDLC platform for workspaces, tasks, boards, sprints, collaboration, permissions, and project progress.
            </p>
          </div>
          {[
            ["Product", "Features", "Kanban", "Analytics", "Security"],
            ["Solutions", "Developers", "Agencies", "Startups", "Enterprise", "Product Teams"],
            ["Company", "About", "Pricing", "Docs", "Contact"],
          ].map(([title, ...links]) => {
            const getFooterLinkProps = (item: string) => {
              const lowercase = item.toLowerCase();
              if (lowercase === "features") return { href: "#features" };
              if (lowercase === "kanban") return { href: "#kanban" };
              if (lowercase === "analytics") return { href: "#analytics" };
              if (lowercase === "security") return { href: "#security" };
              if (lowercase === "startups") return { href: "#solutions", onClick: () => setActiveTeamIndex(0) };
              if (lowercase === "agencies") return { href: "#solutions", onClick: () => setActiveTeamIndex(1) };
              if (lowercase === "developers") return { href: "#solutions", onClick: () => setActiveTeamIndex(2) };
              if (lowercase === "product teams") return { href: "#solutions", onClick: () => setActiveTeamIndex(3) };
              if (lowercase === "enterprise") return { href: "#solutions", onClick: () => setActiveTeamIndex(4) };
              if (lowercase === "about") return { href: "#about" };
              return { href: "#" };
            };

            return (
              <div key={title}>
                <p className="font-semibold text-[#111111] dark:text-white">{title}</p>
                <div className="mt-4 space-y-3">
                  {links.map((item) => {
                    const props = getFooterLinkProps(item);
                    return (
                      <a
                        key={item}
                        {...props}
                        className="block text-sm text-[#64748b] dark:text-slate-400 transition-all duration-200 hover:text-orange-500 dark:hover:text-orange-400 hover:translate-x-1"
                      >
                        {item}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-4 border-t border-[#CBD5E1] dark:border-white/10 pt-6 text-sm text-[#94a3b8] dark:text-slate-500 sm:flex-row">
          <p>© 2026 SDLC Platform. All rights reserved.</p>
          <p>Design By Automation Land.</p>
        </div>
      </footer>
      <BackToTop />
    </main>
  );
}
