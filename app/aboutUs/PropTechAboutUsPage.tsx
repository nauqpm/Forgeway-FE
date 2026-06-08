"use client";

import React, { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useTransform,
  animate,
} from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Fingerprint,
  GitPullRequest,
  Layers3,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

/*
  ABOUT US PAGE - PROPTECH B2B
  Stack: React + TypeScript + TailwindCSS + Framer Motion

  VIDEO BACKGROUND STRATEGY:
  - Each BlueprintPanel accepts the `videoSrc?: string` prop
  - Video is positioned absolute with object-cover, muted, loop, and playsInline for mobile autoplay
  - IntersectionObserver watches threshold 0.10, plays when at least 10% visible, and pauses outside the viewport
  - A navy gradient overlay preserves text readability
  - prefers-reduced-motion pauses video completely while keeping the gradient visible
  - Fallback: render normally when videoSrc is not provided
*/

// ─── Design tokens ────────────────────────────────────────────────────────────
const NAVY      = "#0B132B";
const SLATE_NAV = "#0F172A";
const MILK      = "#F8FAFC";
const CYAN      = "#38BDF8";
const GOLD      = "#F59E0B";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EyebrowProps {
  children: React.ReactNode;
  light?: boolean;
}

interface CounterProps {
  value: number;
  suffix?: string;
}

interface BlueprintPanelProps {
  id?: string;
  children: React.ReactNode;
  variant?: "dark" | "light";
  className?: string;
  /** Video file URL; mp4 is recommended. If empty, the panel renders normally */
  videoSrc?: string;
  /**
   * Overlay color placed over video to preserve readability.
   * Default: rgba(11,19,43,0.72) for dark and rgba(248,250,252,0.82) for light
   */
  videoOverlayColor?: string;
  disableScrollAnimation?: boolean;
}

interface CapabilityCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  chips: string[];
}

interface WorkflowItem {
  icon: LucideIcon;
  title: string;
  text: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────
const CAPABILITIES: CapabilityCardProps[] = [
  {
    icon: Fingerprint,
    title: "RBAC Permission System",
    description:
      "Set up detailed permission structures by department, role, agency level, and developer team to ensure the right people access the right data.",
    chips: ["Role-based", "Audit-ready", "Least privilege"],
  },
  {
    icon: LockKeyhole,
    title: "Multi-layer MFA/SSO Authentication",
    description:
      "Integrate single sign-on and two-factor security to protect transaction data, customer information, and critical approval flows.",
    chips: ["SSO", "MFA", "Identity security"],
  },
  {
    icon: Layers3,
    title: "Flexible Infrastructure",
    description:
      "Scalable architecture for large data volumes, optimized latency, and stable performance during peak sales periods.",
    chips: ["Scalable", "Low latency", "Cloud-ready"],
  },
];

const WORKFLOW_ITEMS: WorkflowItem[] = [
  {
    icon: GitPullRequest,
    title: "Pull requests before deploy",
    text: "Every change is reviewed through pull requests, checked against code standards, and released with reduced risk.",
  },
  {
    icon: Workflow,
    title: "Flexible Agile/Scrum",
    text: "Organize clear sprints, respond quickly, and prioritize features that create direct value for business operations.",
  },
  {
    icon: Zap,
    title: "Controlled vibe coding",
    text: "Quickly turn complex UI/UX into real products while keeping code extensible and maintainable.",
  },
];

const PARTNERS_ROW1 = [
  { name: "NovaLand", icon: Building2 },
  { name: "Vinhomes", icon: Building2 },
  { name: "Masterise", icon: Building2 },
  { name: "Dat Xanh", icon: Building2 },
  { name: "CBRE", icon: Building2 },
  { name: "Savills", icon: Building2 },
];

const PARTNERS_ROW2 = [
  { name: "ISO 27001", icon: ShieldCheck },
  { name: "SOC 2 Ready", icon: ShieldCheck },
  { name: "GDPR Compliant", icon: ShieldCheck },
  { name: "HIPAA Security", icon: ShieldCheck },
  { name: "PCI-DSS", icon: ShieldCheck },
];

// ─── IsMobile context with a single listener for the whole app ─────────────────────────
const IsMobileContext = React.createContext(false);

function IsMobileProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <IsMobileContext.Provider value={isMobile}>
      {children}
    </IsMobileContext.Provider>
  );
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

// ─── VideoBackground ──────────────────────────────────────────────────────────
/**
 * Video is placed as absolute fill with object-cover.
 * IntersectionObserver play/pause theo visibility.
 * Respect prefers-reduced-motion: never play when the user has enabled that setting.
 */
interface VideoBackgroundProps {
  src: string;
  overlayColor: string;
  isDark: boolean;
}

function VideoBackground({ src, overlayColor, isDark }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Fix browser autoplay issues by setting DOM attributes directly
    video.muted = true;
    video.defaultMuted = true;

    // IntersectionObserver: automatically play when at least 10% of the panel enters the viewport and pause outside it
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.muted = true;
            video.play().catch((err) => {
              console.warn("Video background autoplay blocked or failed:", err);
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.10 } // Reduced to 10% for more responsive scrolling
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  // Set up a radial gradient to fade video edges into the background and avoid harsh borders
  const gradientOverlay = isDark
    ? "radial-gradient(circle, rgba(11,19,43,0) 50%, rgba(11,19,43,0.85) 85%, rgba(11,19,43,1) 100%)"
    : "radial-gradient(circle, rgba(248,250,252,0) 50%, rgba(248,250,252,0.85) 85%, rgba(248,250,252,1) 100%)";

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        muted          // required for autoplay to work in every browser
        loop
        playsInline    // required on iOS Safari to avoid fullscreen playback
        preload="metadata" // only load metadata while outside the viewport
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ pointerEvents: "none" }}
      />
      {/* Fading radial-gradient overlay to blend video into the panel background */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: gradientOverlay, pointerEvents: "none" }}
      />
      {/* Gradient overlay that keeps contrast for text above */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: overlayColor, pointerEvents: "none" }}
      />
    </>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

function SectionEyebrow({ children, light = false }: EyebrowProps) {
  return (
    <div
      className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${
        light
          ? "border-sky-300/30 bg-sky-400/10 text-sky-200"
          : "border-slate-300 bg-white text-slate-700 shadow-sm"
      }`}
    >
      {children}
    </div>
  );
}

function NumberCounter({ value, suffix = "" }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.7 });
  const count = useMotionValue(0);

  const rounded = useTransform<number, string>(count, (latest) =>
    `${Math.round(latest).toLocaleString("en-US")}${suffix}`
  );

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(count, value, { duration: 1.8, ease: "easeOut" });
    return () => controls.stop();
  }, [count, isInView, value]);

  return (
    <motion.span ref={ref} aria-live="polite" aria-atomic="true">
      {rounded}
    </motion.span>
  );
}

// ─── BlueprintPanel upgraded with optional video background ─────────────────
function BlueprintPanel({
  id,
  children,
  variant = "dark",
  className = "",
  videoSrc,
  videoOverlayColor,
  disableScrollAnimation = false,
}: BlueprintPanelProps) {
  const ref = useRef<HTMLElement>(null);
  const isMobile = React.useContext(IsMobileContext);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const rawWidth        = useTransform(scrollYProgress, [0.1, 0.95], ["88%", "100%"]);
  const rawBorderRadius = useTransform(scrollYProgress, [0.1, 0.95], ["40px", "0px"]);

  const panelStyle = (isMobile || disableScrollAnimation)
    ? { width: "100%", borderRadius: "0px" }
    : { width: rawWidth, borderRadius: rawBorderRadius };

  const isDark = variant === "dark";

  // Default overlay follows the variant when no prop is passed
  const defaultOverlay = isDark
    ? "rgba(11,19,43,0.72)"
    : "rgba(248,250,252,0.85)";
  const overlay = videoOverlayColor ?? defaultOverlay;

  return (
    <section id={id} ref={ref} className={`relative py-8 md:py-12 ${className}`}>
      <motion.div
        style={panelStyle}
        className={`relative mx-auto overflow-hidden will-change-[width,border-radius] ${
          isDark ? "bg-[#0B132B] text-white" : "bg-[#F8FAFC] text-slate-900"
        }`}
      >
        {/* Video background renders only when videoSrc exists */}
        {videoSrc && (
          <VideoBackground src={videoSrc} overlayColor={overlay} isDark={isDark} />
        )}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.10 }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.215, 0.61, 0.355, 1.0] }}
          // relative + z-10 keeps content above the video layer
          className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24"
        >
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}

function CapabilityCard({ icon: Icon, title, description, chips }: CapabilityCardProps) {
  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="group relative h-full overflow-hidden rounded-[36px] border border-slate-200 bg-white p-7 shadow-sm will-change-transform hover:shadow-2xl"
    >
      <div className="pointer-events-none absolute inset-0 rounded-[36px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_top-left,rgba(56,189,248,0.06),transparent_60%)]" />
      <div className="relative z-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B132B] text-[#38BDF8] shadow-[0_18px_50px_rgba(11,19,43,0.18)] transition-all duration-300 group-hover:scale-110">
          <Icon size={26} />
        </div>
        <h3 className="font-serif text-2xl font-bold text-slate-950">{title}</h3>
        <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
        <div className="mt-7 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <header className="relative min-h-screen overflow-hidden bg-[#0B132B] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.04)_1px,transparent_1px)] bg-[size:50px_50px]" />
      <motion.div
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 15, 0], scale: [1, 1.1, 1.02, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[-10%] top-20 h-[25rem] w-[25rem] rounded-full bg-[#00F2FE]/[0.15] blur-[100px] will-change-transform"
      />
      <motion.div
        animate={{ x: [0, -40, 20, 0], y: [0, 20, -20, 0], scale: [1, 1.05, 1.12, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-5%] h-[31.25rem] w-[31.25rem] rounded-full bg-[#F59E0B]/[0.12] blur-[110px] will-change-transform"
      />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-14 px-5 py-28 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.215, 0.61, 0.355, 1.0] }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-white/5 px-4 py-2 text-sm font-medium text-sky-100 backdrop-blur">
            <ShieldCheck size={16} className="text-[#38BDF8]" />
            Enterprise PropTech Platform
          </div>

          <h1 className="max-w-4xl font-serif text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Building the future of real estate through a technology lens.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            We partner with developers and agencies on a complete digital transformation journey:
            from customer data management and sales team operations to process automation
            for enterprise-scale transactions.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#capabilities"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#38BDF8] px-7 py-4 text-base font-bold text-[#0B132B] shadow-[0_18px_50px_rgba(56,189,248,0.22)] transition-all duration-300 hover:bg-[#F59E0B] hover:shadow-[0_18px_60px_rgba(245,158,11,0.28)]"
            >
              Explore our solutions
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <span className="text-sm font-medium text-slate-400">
              High privacy · Flexible scaling · Designed for B2B
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.1, ease: [0.215, 0.61, 0.355, 1.0] }}
          className="relative hidden lg:block"
        >
          <div className="relative mx-auto aspect-[4/5] max-w-[28.75rem] rounded-[36px] border border-white/[0.12] bg-white/[0.03] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="absolute inset-5 rounded-[28px] border border-sky-300/[0.15]" />
            <div className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[32px] border border-dashed border-white/10" />
            <div className="relative z-10 grid h-full grid-rows-[auto_1fr_auto] gap-5 rounded-[28px] bg-[#0F172A]/90 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Blueprint</p>
                  <p className="mt-1 font-serif text-2xl font-bold">Digital Tower</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#38BDF8]/[0.12] text-[#38BDF8]">
                  <Building2 />
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0B132B] p-5">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.04)_1px,transparent_1px)] bg-[size:26px_26px]" />
                {[0, 1, 2, 3, 4].map((item) => (
                  <motion.div
                    key={item}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2.2, delay: item * 0.2, repeat: Infinity }}
                    className="relative mb-3 h-10 rounded-xl border border-sky-300/[0.15] bg-white/[0.03]"
                    style={{ width: `${92 - item * 8}%`, marginLeft: `${item * 4}%` }}
                  />
                ))}
                <motion.div
                  animate={{ y: [0, 140, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-12 top-8 h-20 w-px bg-gradient-to-b from-transparent via-[#38BDF8] to-transparent"
                />
                <motion.div
                  animate={{ x: [0, 180, 0] }}
                  transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-14 left-8 h-px w-24 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "RBAC",  icon: Fingerprint },
                  { label: "MFA",   icon: LockKeyhole },
                  { label: "Scale", icon: Network },
                ].map(({ label, icon: IconComponent }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                    <IconComponent className="mx-auto mb-2 text-[#38BDF8]" size={20} />
                    <p className="text-xs font-bold text-slate-200">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  );
}

function ProblemMissionSection() {
  return (
    /*
      videoSrc: replace with your actual URL, for example:
        videoSrc="/videos/city-timelapse.mp4"
        videoSrc="https://cdn.yourdomain.com/bg-mission.mp4"
      Recommendation: use a dark, slow, audio-free video such as aerial cityscape or data center footage.
    */
    <BlueprintPanel
      id="mission"
      variant="dark"
      videoSrc="/videos/mission_bg.mp4"
      videoOverlayColor="rgba(11,19,43,0.78)"
    >
      <SectionEyebrow light>Problem &amp; Mission</SectionEyebrow>
      <h2 className="font-serif text-4xl font-bold leading-tight lg:text-5xl">
        When data, processes, and teams are not yet unified in one system.
      </h2>
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <p className="text-lg leading-8 text-slate-300">
          Many Real Estate enterprises still struggle with siloed legacy operations, manual data
          entry, and fragmented internal approvals. This directly results in high security leakage
          risk, slower lead responses, and zero transparency across sales agencies.
        </p>
        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-7 shadow-[0_28px_80px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#38BDF8]/[0.12] text-[#38BDF8]">
            <Sparkles />
          </div>
          <h3 className="font-serif text-3xl font-bold">Our mission</h3>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Redefine how real estate businesses operate with intelligent automation,
            role-based security, and infrastructure flexible enough to scale with real growth.
            
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { value: 99, suffix: "%",  label: "data security priority" },
              { value: 24, suffix: "/7", label: "operations monitoring" },
              { value: 10, suffix: "x",  label: "ready to scale" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/5 bg-[#0F172A]/70 p-4">
                <p className="font-serif text-3xl font-bold text-[#F59E0B]">
                  <NumberCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm leading-5 text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BlueprintPanel>
  );
}

function CapabilitiesSection() {
  return (
    /*
      Tip: use a light white/gray video for the light panel.
        videoSrc="/videos/blueprint-light.mp4"
        videoOverlayColor="rgba(248,250,252,0.88)"
    */
    <BlueprintPanel
      id="capabilities"
      variant="light"
      videoSrc="/videos/capabilities-bg.mp4"
      videoOverlayColor="rgba(248,250,252,0.88)"
      disableScrollAnimation={true}
    >
      <SectionEyebrow>Core technology capabilities</SectionEyebrow>
      <h2 className="font-serif text-4xl font-bold leading-tight text-slate-900 lg:text-5xl">
        Designed for enterprise operating standards.
      </h2>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
        Core capabilities are built to balance delivery speed, control,
        and reliability when operating B2B systems in real estate.
      </p>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {CAPABILITIES.map((item) => (
          <CapabilityCard key={item.title} {...item} />
        ))}
      </div>
    </BlueprintPanel>
  );
}

function CultureWorkflowSection() {
  return (
    <BlueprintPanel
      id="culture"
      variant="dark"
      videoSrc="/videos/culture-bg.mp4"
      videoOverlayColor="rgba(11,19,43,0.80)"
    >
      <SectionEyebrow light>Culture &amp; Workflow</SectionEyebrow>
      <h2 className="font-serif text-4xl font-bold leading-tight lg:text-5xl">
        An engineering culture that puts product stability first.
      </h2>
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <p className="text-lg leading-8 text-slate-300">
          We combine the speed of modern product teams with enterprise engineering discipline:
          clear version control, careful review, and deployment through verifiable processes.
          
        </p>
        <div className="space-y-4">
          {WORKFLOW_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-colors duration-300 hover:bg-white/[0.07]"
              >
                <div className="flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#38BDF8]/[0.12] text-[#38BDF8] transition-colors duration-300 group-hover:bg-[#F59E0B]/[0.15] group-hover:text-[#F59E0B]">
                    <Icon size={23} />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold">{item.title}</h3>
                    <p className="mt-2 text-base leading-7 text-slate-300">{item.text}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </BlueprintPanel>
  );
}

interface TrustCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgGlow: string;
}

function TrustCard({ title, subtitle, description, icon: Icon, color, bgGlow }: TrustCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -12 }}
      transition={{ type: "spring", stiffness: 180, damping: 20 }}
      className="group relative h-full overflow-hidden rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm will-change-transform hover:shadow-2xl"
    >
      {/* Dynamic colored glow effect in background */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[36px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at top left, ${bgGlow}, transparent 70%)`
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          {/* Icon Container with elegant floating effect and hover color change */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B132B] text-[#38BDF8] shadow-[0_18px_50px_rgba(11,19,43,0.15)] transition-all duration-300 group-hover:scale-110">
            <Icon size={26} className="transition-transform duration-500 group-hover:rotate-[10deg]" />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#38BDF8]">{subtitle}</p>
          <h3 className="mt-2 font-serif text-2xl font-bold text-slate-900 leading-snug">
            {title}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {description}
          </p>
        </div>

        {/* Bottom accent progress bar that expands on hover */}
        <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: isHovered ? "100%" : "12%" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${color}`}
          />
        </div>
      </div>
    </motion.article>
  );
}

const TRUST_CARDS: TrustCardProps[] = [
  {
    title: "Comprehensive Data Privacy",
    subtitle: "ISO 27001 & SOC 2 Ready",
    description: "End-to-end data encryption, strict RBAC access control, and complete audit logs keep your data secure.",
    icon: ShieldCheck,
    color: "from-sky-400 to-blue-600",
    bgGlow: "rgba(56, 189, 248, 0.15)",
  },
  {
    title: "Standardized Operating Process",
    subtitle: "Agile & Control",
    description: "Clear development sprints combined with automated CI/CD and strict code review enable fast delivery while minimizing disruption risk.",
    icon: Workflow,
    color: "from-amber-400 to-orange-500",
    bgGlow: "rgba(245, 158, 11, 0.15)",
  },
  {
    title: "Seamless Integration Capability",
    subtitle: "API Gateway & SDK",
    description: "RESTful APIs and webhook gateways are ready for smooth two-way synchronization with existing ERP and CRM systems.",
    icon: Network,
    color: "from-emerald-400 to-teal-600",
    bgGlow: "rgba(16, 185, 129, 0.15)",
  },
];

function TrustPartnersSection() {
  return (
    <section id="trust" className="relative overflow-hidden bg-[#F8FAFC] px-5 py-24 sm:px-8 lg:px-10">
      {/* Decorative ambient glowing blur circles */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-sky-300/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 h-[28.125rem] w-[28.125rem] rounded-full bg-amber-200/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <SectionEyebrow>Trust &amp; Partners</SectionEyebrow>
        <h2 className="font-serif text-4xl font-bold leading-tight text-slate-900 lg:text-5xl">
          Trust comes from safe operation at scale.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          This area represents the trust of partners who accompany us on the
          digital transformation journey. The system meets strict international standards
          to protect your projects.
        </p>

        {/* Double-row Marquee */}
        <div className="relative mt-16 space-y-6">
          {/* Row 1: Partners (Left) */}
          <div
            aria-hidden="true"
            className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/60 py-5 shadow-sm backdrop-blur-sm"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#F8FAFC] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[#F8FAFC] to-transparent" />
            <div className="flex w-max animate-marquee will-change-transform">
              {/* Copy 1 */}
              <div className="flex shrink-0 gap-5 pr-5">
                {PARTNERS_ROW1.map((partner, index) => {
                  const Icon = partner.icon;
                  return (
                    <div
                      key={`r1-c1-${partner.name}-${index}`}
                      className="group flex h-20 min-w-[12.5rem] items-center justify-start gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-6 font-serif text-lg font-bold text-slate-700 transition-all duration-300 hover:scale-105 hover:border-sky-300 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-slate-200 text-[#38BDF8] transition-colors duration-300 group-hover:bg-[#0B132B] group-hover:text-white">
                        <Icon size={18} />
                      </div>
                      <span className="truncate">{partner.name}</span>
                    </div>
                  );
                })}
              </div>
              {/* Copy 2 */}
              <div className="flex shrink-0 gap-5 pr-5">
                {PARTNERS_ROW1.map((partner, index) => {
                  const Icon = partner.icon;
                  return (
                    <div
                      key={`r1-c2-${partner.name}-${index}`}
                      className="group flex h-20 min-w-[12.5rem] items-center justify-start gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-6 font-serif text-lg font-bold text-slate-700 transition-all duration-300 hover:scale-105 hover:border-sky-300 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-slate-200 text-[#38BDF8] transition-colors duration-300 group-hover:bg-[#0B132B] group-hover:text-white">
                        <Icon size={18} />
                      </div>
                      <span className="truncate">{partner.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Standards (Right) */}
          <div
            aria-hidden="true"
            className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/60 py-5 shadow-sm backdrop-blur-sm"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#F8FAFC] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[#F8FAFC] to-transparent" />
            <div className="flex w-max animate-marquee-reverse will-change-transform">
              {/* Copy 1 */}
              <div className="flex shrink-0 gap-5 pr-5">
                {PARTNERS_ROW2.map((partner, index) => {
                  const Icon = partner.icon;
                  return (
                    <div
                      key={`r2-c1-${partner.name}-${index}`}
                      className="group flex h-20 min-w-[12.5rem] items-center justify-start gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-6 font-serif text-lg font-bold text-slate-700 transition-all duration-300 hover:scale-105 hover:border-amber-300 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-slate-200 text-[#F59E0B] transition-colors duration-300 group-hover:bg-[#0B132B] group-hover:text-white">
                        <Icon size={18} />
                      </div>
                      <span className="truncate">{partner.name}</span>
                    </div>
                  );
                })}
              </div>
              {/* Copy 2 */}
              <div className="flex shrink-0 gap-5 pr-5">
                {PARTNERS_ROW2.map((partner, index) => {
                  const Icon = partner.icon;
                  return (
                    <div
                      key={`r2-c2-${partner.name}-${index}`}
                      className="group flex h-20 min-w-[12.5rem] items-center justify-start gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-6 font-serif text-lg font-bold text-slate-700 transition-all duration-300 hover:scale-105 hover:border-amber-300 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-slate-200 text-[#F59E0B] transition-colors duration-300 group-hover:bg-[#0B132B] group-hover:text-white">
                        <Icon size={18} />
                      </div>
                      <span className="truncate">{partner.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Trust Cards Grid */}
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {TRUST_CARDS.map((card) => (
            <TrustCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PropTechAboutUsPage() {
  return (
    <IsMobileProvider>
      <main className="overflow-x-hidden">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

          :root {
            --navy:       ${NAVY};
            --slate-navy: ${SLATE_NAV};
            --milk:       ${MILK};
            --cyan:       ${CYAN};
            --gold:       ${GOLD};
          }

          html { scroll-behavior: smooth; }

          body {
            font-family: 'Plus Jakarta Sans', Inter, system-ui, sans-serif;
            background: ${NAVY};
          }

          .font-serif {
            font-family: 'Playfair Display', Merriweather, Georgia, serif;
          }

          /* CSS marquee: translateX(-50%) is correct only when loopedPartners = 2x PARTNERS */
          @keyframes marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }

          @keyframes marquee-reverse {
            0%   { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .animate-marquee-reverse {
            animation: marquee-reverse 30s linear infinite;
          }

          @media (max-width: 767px) {
            * { scroll-behavior: auto; }
          }

          @media (prefers-reduced-motion: reduce) {
            .animate-marquee, .animate-marquee-reverse { animation-play-state: paused; }
          }
        `}</style>

        <HeroSection />
        <ProblemMissionSection />
        <CapabilitiesSection />
        <CultureWorkflowSection />
        <TrustPartnersSection />
      </main>
    </IsMobileProvider>
  );
}
