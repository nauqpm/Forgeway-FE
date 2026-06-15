import Image from "next/image";
import Link from "next/link";
import appleIcon from "./apple-icon.png";
import { HeroAuthActions, NavAuthActions } from "./LandingAuthActions";
import AdminNavLink from "./AdminNavLink";
import BackToTop from "@/modules/client/common/back-to-top/BackToTop";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  GitBranch,
  KanbanSquare,
  LayoutGrid,
  LockKeyhole,
  MessageSquareText,
  MoreHorizontal,
  PanelRight,
  PencilLine,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  Workflow,
  Zap,
} from "lucide-react";

export const metadata = {
  title: { absolute: "SDLC Platform" },
  description:
    "SDLC Platform is a modern project management platform for workspaces, Kanban boards, sprint planning, collaboration, permissions, and real-time project tracking.",
};

const trustedTeams = ["Startup Teams", "Agencies", "Developers", "Product Teams", "Enterprise Teams"];

const stats = [
  { value: "10,000+", label: "Tasks completed" },
  { value: "500+", label: "Teams onboarded" },
  { value: "99.9%", label: "Platform uptime" },
];

const features = [
  { icon: Check, title: "Task Management", text: "Create, assign, prioritize, and track execution across every project stream." },
  { icon: KanbanSquare, title: "Kanban Board", text: "Visualize flow from backlog to done with status columns built for delivery teams." },
  { icon: GitBranch, title: "Sprint Planning", text: "Plan iterations, balance capacity, and keep product priorities connected to execution." },
  { icon: Bell, title: "Notifications", text: "Keep every assignee, reviewer, and stakeholder aligned when work changes." },
  { icon: UsersRound, title: "Team Collaboration", text: "Use comments, mentions, activity history, and ownership signals in one workspace." },
  { icon: Radio, title: "Real-time Updates", text: "See progress, task movement, and project activity as teams collaborate live." },
  { icon: BarChart3, title: "Analytics", text: "Monitor velocity, blockers, workload, and delivery health with focused dashboards." },
  { icon: ShieldCheck, title: "Role Permissions", text: "Protect workspaces with clear access control for admins, members, and guests." },
];

const kanbanColumns = [
  { title: "Todo", count: 6, tone: "border-slate-400/40 dark:border-slate-500/30", cards: ["Define workspace roles", "Create onboarding checklist"] },
  { title: "In Progress", count: 4, tone: "border-blue-500/40 dark:border-blue-400/40", cards: ["Sprint board API", "Notification preferences"] },
  { title: "Review", count: 3, tone: "border-amber-400/40 dark:border-amber-300/40", cards: ["Kanban drag states", "Activity feed filters"] },
  { title: "Done", count: 12, tone: "border-emerald-400/40 dark:border-emerald-300/40", cards: ["Workspace dashboard", "Member invite flow"] },
];

const roles = [
  { role: "Admin", access: "Full system control", level: "100%" },
  { role: "Workspace Owner", access: "Billing, members, settings", level: "82%" },
  { role: "Member", access: "Create, assign, update work", level: "58%" },
  { role: "Guest", access: "Scoped project visibility", level: "30%" },
];

const steps = ["Create Workspace", "Invite Team", "Create Tasks", "Track Progress"];

const faqs = [
  { question: "What is SDLC Platform?", answer: "SDLC Platform is a project management platform for teams that need workspaces, tasks, Kanban boards, sprint planning, collaboration, and project progress tracking in one place." },
  { question: "Who should use SDLC-Platform?", answer: "It is built for developer teams, startups, agencies, freelancers, product managers, project managers, and enterprise teams that need a reliable delivery workspace." },
  { question: "Does SDLC Platform support permissions?", answer: "Yes. The product model includes role-based access for Admins, Workspace Owners, Members, and Guests so teams can manage visibility and control safely." },
  { question: "Can teams track progress in real time?", answer: "Yes. The landing page highlights real-time updates, activity tracking, analytics cards, progress bars, and productivity reporting as core product value." },
];

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#2563EB] dark:text-indigo-300">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-[#111111] dark:text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-7 text-[#64748b] dark:text-slate-300 sm:text-lg">
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
      <div className="absolute -left-5 top-16 hidden rounded-xl border border-white/[0.08] bg-[#202020]/90 p-4 shadow-2xl shadow-indigo-950/40 backdrop-blur md:block">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9B9A97]">Active sprint</p>
        <p className="mt-1 text-xl font-bold text-white">72%</p>
        <div className="mt-3 h-1.5 w-32 rounded-full bg-[#252525]">
          <div className="h-1.5 w-[72%] rounded-full bg-indigo-500" />
        </div>
      </div>
      <div className="absolute -right-4 bottom-16 hidden rounded-xl border border-white/[0.08] bg-[#202020]/90 p-4 shadow-2xl shadow-indigo-950/40 backdrop-blur lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9B9A97]">Workspace members</p>
        <div className="mt-3 flex -space-x-2">
          {["PM", "FE", "BE", "QA"].map((item) => (
            <span key={item} className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#1A1A1A] bg-indigo-600 text-[0.625rem] font-bold text-white">{item}</span>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1A1A1A] shadow-2xl shadow-indigo-950/40">
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
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F2FAFF] dark:bg-[#1A1A1A] text-[#111111] dark:text-[#E8E8E7]">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[33.75rem] w-[56.25rem] -translate-x-1/2 rounded-full bg-blue-300/25 dark:bg-blue-600/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[26.25rem] w-[26.25rem] rounded-full bg-indigo-200/20 dark:bg-indigo-500/10 blur-3xl" />
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
            {["Features", "Solutions", "Pricing", "About"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-[#2563EB] dark:hover:text-white">{item}</a>
            ))}
            <AdminNavLink />
          </div>
          <NavAuthActions />
        </div>
      </nav>

      {/* hero */}
      <section className="relative px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2563EB]/20 dark:border-indigo-500/20 bg-[#2563EB]/[0.07] dark:bg-indigo-600/10 px-4 py-2 text-sm text-[#2563EB] dark:text-indigo-200 shadow-lg shadow-blue-200/40 dark:shadow-indigo-950/30">
              <Sparkles className="h-4 w-4" />
              SDLC project management for modern product teams
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-[#111111] dark:text-white sm:text-6xl lg:text-7xl">
              Plan, build, and ship software from one premium workspace.
            </h1>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <HeroAuthActions />
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#DBEAFE] dark:border-white/10 bg-white dark:bg-white/[0.04] p-5 text-center backdrop-blur">
                <p className="text-3xl font-semibold text-[#111111] dark:text-white">{item.value}</p>
                <p className="mt-1 text-sm text-[#64748b] dark:text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* trusted by */}
      <section id="about" className="border-y border-[#CBD5E1] dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-sm font-medium uppercase tracking-[0.18em] text-[#64748b] dark:text-slate-400">
            Trusted operating layer for
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {trustedTeams.map((team) => (
              <div key={team} className="rounded-2xl border border-[#DBEAFE] dark:border-white/10 bg-[#F2FAFF] dark:bg-[#252525] px-4 py-4 text-center text-sm font-semibold text-[#444444] dark:text-slate-200">
                {team}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Feature showcase"
            title="Everything your team needs to move work from idea to release."
            text="A complete project management layer designed for software delivery: planning, execution, collaboration, visibility, and control."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group rounded-3xl border border-[#DBEAFE] dark:border-white/10 bg-white dark:bg-white/[0.04] p-6 backdrop-blur transition hover:-translate-y-1 hover:border-[#2563EB]/40 dark:hover:border-indigo-500/40 hover:shadow-md dark:hover:bg-white/[0.07]">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#EFF6FF] dark:bg-indigo-600/10 text-[#2563EB] dark:text-indigo-300 ring-1 ring-[#2563EB]/20 dark:ring-indigo-500/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#111111] dark:text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#64748b] dark:text-slate-400">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* product preview */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#2563EB] dark:text-indigo-300">Product preview</p>
            <h2 className="text-3xl font-semibold tracking-tight text-[#111111] dark:text-white sm:text-5xl">
              See workspaces, boards, task detail, comments, and members together.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#64748b] dark:text-slate-300">
              The interface is designed around the real rhythm of delivery teams: quick status scanning, task ownership, contextual discussion, and visible project health.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Workspace hub", "Board execution", "Task detail panel", "Member presence"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#DBEAFE] dark:border-white/10 bg-white dark:bg-white/[0.04] p-4 text-sm text-[#444444] dark:text-slate-200">
                  <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-[#DBEAFE] dark:border-white/10 bg-white dark:bg-[#202020] p-4 shadow-xl shadow-blue-100/60 dark:shadow-black/40">
            <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
              <div className="rounded-2xl bg-[#F2FAFF] dark:bg-white/[0.04] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#64748b] dark:text-slate-400">Workspace</p>
                    <h3 className="text-xl font-semibold text-[#111111] dark:text-white">Mobile App Release</h3>
                  </div>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-300/15 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-200">On Track</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {["Authentication", "Sprint Planning", "QA Review", "Release Notes"].map((item, index) => (
                    <div key={item} className="rounded-xl border border-[#DBEAFE] dark:border-white/10 bg-white dark:bg-[#252525] p-4">
                      <p className="text-sm font-medium text-[#111111] dark:text-white">{item}</p>
                      <div className="mt-4 h-2 rounded-full bg-[#DBEAFE] dark:bg-white/10">
                        <div className="h-2 rounded-full bg-gradient-to-r from-[#2563EB] to-blue-500" style={{ width: `${92 - index * 15}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[#DBEAFE] dark:border-white/10 bg-[#F2FAFF] dark:bg-white/[0.04] p-4">
                <p className="text-sm text-[#64748b] dark:text-slate-400">Task Detail</p>
                <h3 className="mt-2 text-lg font-semibold text-[#111111] dark:text-white">Implement role matrix</h3>
                <p className="mt-3 text-sm leading-6 text-[#64748b] dark:text-slate-400">
                  Define permissions for workspace owner, member, and guest access.
                </p>
                <div className="mt-5 space-y-3">
                  {["Anh mentioned Linh", "Minh attached spec", "QA moved to review"].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl bg-white dark:bg-[#252525] p-3 text-xs text-[#444444] dark:text-slate-300">
                      <MessageSquareText className="h-4 w-4 text-[#2563EB] dark:text-indigo-300" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* kanban */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Kanban workflow"
            title="A real board view for todo, progress, review, and done."
            text="Give teams a shared visual system for execution, review quality, and delivery accountability."
          />
          <div className="grid gap-4 lg:grid-cols-4">
            {kanbanColumns.map((column) => (
              <div key={column.title} className={`rounded-3xl border ${column.tone} bg-white dark:bg-white/[0.04] p-4`}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-[#111111] dark:text-white">{column.title}</h3>
                  <span className="rounded-full bg-[#EFF6FF] dark:bg-white/10 px-2 py-1 text-xs text-[#2563EB] dark:text-slate-300">{column.count}</span>
                </div>
                <div className="space-y-3">
                  {column.cards.map((card, index) => (
                    <div key={card} className="rounded-2xl border border-[#DBEAFE] dark:border-white/10 bg-[#F2FAFF] dark:bg-[#252525] p-4 transition hover:-translate-y-1 hover:bg-white dark:hover:bg-[#202020]">
                      <p className="text-sm font-medium text-[#111111] dark:text-white">{card}</p>
                      <div className="mt-5 flex items-center justify-between text-xs text-[#64748b] dark:text-slate-400">
                        <span>Priority P{index + 1}</span>
                        <span>{index + 2}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* solutions */}
      <section id="solutions" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[#DBEAFE] dark:border-white/10 bg-[#F2FAFF] dark:bg-[#202020] p-8 shadow-sm dark:shadow-none">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#2563EB] dark:text-indigo-300">Collaboration</p>
            <h2 className="text-3xl font-semibold text-[#111111] dark:text-white">
              Assign, comment, mention, and track every team activity.
            </h2>
            <div className="mt-8 space-y-4">
              {[
                ["Assign Tasks", "Clear ownership with assignee, reviewer, due date, and status."],
                ["Comments", "Discuss implementation details directly where work happens."],
                ["Mentions", "Pull teammates into decisions without losing context."],
                ["Team Activities", "Audit movement, updates, and delivery signals across the workspace."],
              ].map(([title, text]) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-[#DBEAFE] dark:border-white/10 bg-white dark:bg-[#252525] p-4">
                  <Activity className="mt-1 h-5 w-5 flex-none text-[#2563EB] dark:text-indigo-300" />
                  <div>
                    <p className="font-semibold text-[#111111] dark:text-white">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#64748b] dark:text-slate-400">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-[#DBEAFE] dark:border-white/10 bg-[#F2FAFF] dark:bg-[#202020] p-8">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#2563EB] dark:text-indigo-300">Progress tracking</p>
            <h2 className="text-3xl font-semibold text-[#111111] dark:text-white">
              Analytics that show project health, not just activity.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[["Completion", "84%"], ["Team productivity", "+18%"], ["Cycle time", "3.4d"], ["Blocked tasks", "06"]].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#DBEAFE] dark:border-white/10 bg-white dark:bg-white/[0.04] p-5">
                  <p className="text-sm text-[#64748b] dark:text-slate-400">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-[#111111] dark:text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-[#DBEAFE] dark:border-white/10 bg-white dark:bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-[#444444] dark:text-slate-300">Sprint burndown</span>
                <span className="text-emerald-600 dark:text-emerald-300">Healthy</span>
              </div>
              <div className="flex h-36 items-end gap-3">
                {[70, 62, 54, 46, 36, 28, 18].map((height) => (
                  <div key={height} className="flex-1 rounded-t-xl bg-gradient-to-t from-[#2563EB] to-blue-400 dark:from-blue-600 dark:to-indigo-400" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* permissions */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#2563EB] dark:text-indigo-300">Security & permissions</p>
            <h2 className="text-3xl font-semibold tracking-tight text-[#111111] dark:text-white sm:text-5xl">
              Role-based access control for teams that need clarity and trust.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#64748b] dark:text-slate-300">
              Give every person the right level of access, from full administration to scoped guest visibility.
            </p>
          </div>
          <div className="rounded-[28px] border border-[#DBEAFE] dark:border-white/10 bg-white dark:bg-white/[0.04] p-6 shadow-sm dark:shadow-none">
            {roles.map((item) => (
              <div key={item.role} className="mb-5 last:mb-0">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="h-5 w-5 text-[#2563EB] dark:text-indigo-300" />
                    <div>
                      <p className="font-semibold text-[#111111] dark:text-white">{item.role}</p>
                      <p className="text-sm text-[#64748b] dark:text-slate-400">{item.access}</p>
                    </div>
                  </div>
                  <span className="text-sm text-[#444444] dark:text-slate-300">{item.level}</span>
                </div>
                <div className="h-2 rounded-full bg-[#DBEAFE] dark:bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-[#2563EB] to-blue-500 dark:from-indigo-500 dark:to-blue-600" style={{ width: item.level }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="How it works"
            title="From empty workspace to visible delivery in four steps."
            text="The onboarding model is simple enough for startups and structured enough for enterprise teams."
          />
          <div className="grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-[#DBEAFE] dark:border-white/10 bg-white dark:bg-white/[0.04] p-6">
                <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-[#2563EB] dark:bg-white text-lg font-black text-white dark:text-slate-950">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-[#111111] dark:text-white">{step}</h3>
                <p className="mt-3 text-sm leading-6 text-[#64748b] dark:text-slate-400">
                  {index === 0 && "Set up projects, teams, statuses, and delivery structure."}
                  {index === 1 && "Bring developers, product managers, agencies, or stakeholders into one flow."}
                  {index === 2 && "Break goals into assignable tasks with priority, comments, and ownership."}
                  {index === 3 && "Use boards, activity, and analytics to keep progress visible."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader
            eyebrow="FAQ"
            title="Questions teams ask before adopting SDLC Platform."
            text="Clear answers for product, engineering, agency, freelance, and enterprise teams evaluating a modern project management platform."
          />
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-[#DBEAFE] dark:border-white/10 bg-white dark:bg-white/[0.04] p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left font-semibold text-[#111111] dark:text-white">
                  {faq.question}
                  <ChevronRight className="h-5 w-5 flex-none text-[#64748b] dark:text-slate-400 transition group-open:rotate-90" />
                </summary>
                <p className="mt-4 text-sm leading-6 text-[#64748b] dark:text-slate-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-[#DBEAFE] dark:border-white/10 bg-gradient-to-br from-[#2563EB]/[0.07] via-blue-400/[0.05] to-[#F2FAFF] dark:from-indigo-500/20 dark:via-blue-600/15 dark:to-white/[0.04] p-8 text-center shadow-xl shadow-blue-100/50 dark:shadow-blue-950/40 sm:p-12">
          <Workflow className="mx-auto h-12 w-12 text-[#2563EB] dark:text-indigo-300" />
          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold tracking-tight text-[#111111] dark:text-white sm:text-5xl">
            Ready to organize your team's work?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#64748b] dark:text-slate-300">
            Move from scattered tasks and unclear ownership to a project operating system built for software delivery.
          </p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#2563EB] dark:bg-white px-6 py-3 text-sm font-bold text-white dark:text-slate-950 transition hover:bg-[#1D4ED8] dark:hover:bg-indigo-50">
            Get Started Free <Zap className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-[#CBD5E1] dark:border-white/10 bg-[#F2FAFF] dark:bg-[#111111] px-4 py-12 sm:px-6 lg:px-8">
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
            ["Solutions", "Developers", "Agencies", "Startups", "Enterprise"],
            ["Company", "About", "Pricing", "Docs", "Contact"],
          ].map(([title, ...links]) => (
            <div key={title}>
              <p className="font-semibold text-[#111111] dark:text-white">{title}</p>
              <div className="mt-4 space-y-3">
                {links.map((item) => (
                  <a key={item} href="#" className="block text-sm text-[#64748b] dark:text-slate-400 transition hover:text-[#2563EB] dark:hover:text-white">{item}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-4 border-t border-[#CBD5E1] dark:border-white/10 pt-6 text-sm text-[#94a3b8] dark:text-slate-500 sm:flex-row">
          <p>© 2026 SDLC Platform. All rights reserved.</p>
          <p>Designed for modern software delivery teams.</p>
        </div>
      </footer>
      <BackToTop />
    </main>
  );
}
