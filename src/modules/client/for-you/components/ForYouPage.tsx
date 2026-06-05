"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  LayoutDashboard,
  Loader2,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export type ForYouWorkspace = {
  id?: string;
  _id?: string;
  name: string;
  key?: string;
  slug?: string;
  type?: string;
  status?: string;
  role?: string;
  relationship?: string;
  ownershipLabel?: string;
};

type ForYouResponse = {
  success?: boolean;
  workspaces?: ForYouWorkspace[];
};

const workspaceIdOf = (workspace: ForYouWorkspace) => workspace.id || workspace._id || "";
const workspaceRouteKeyOf = (workspace: ForYouWorkspace) =>
  workspace.key || workspace.slug || workspaceIdOf(workspace);

const normalizePayload = (payload: any): ForYouResponse => payload?.data?.data ?? payload?.data ?? payload;

const roleLabel = (workspace: ForYouWorkspace) =>
  workspace.ownershipLabel ||
  workspace.relationship ||
  workspace.role?.replace(/_/g, " ") ||
  "Workspace";

export default function ForYouPage() {
  const { setWorkspaces } = useWorkspaceStore();
  const [workspaces, setForYouWorkspaces] = useState<ForYouWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadForYou = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(apiRoutes.FOR_YOU);
        if (cancelled) return;

        const payload = normalizePayload(response);
        const nextWorkspaces = Array.isArray(payload)
          ? payload
          : payload.workspaces ?? [];

        setForYouWorkspaces(nextWorkspaces);
        setWorkspaces(nextWorkspaces as any);
      } catch {
        if (!cancelled) {
          setForYouWorkspaces([]);
          setError("Could not load your workspace recommendations.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadForYou();

    return () => {
      cancelled = true;
    };
  }, [setWorkspaces]);

  const stats = useMemo(() => {
    const owned = workspaces.filter((workspace) =>
      ["owner", "owned"].includes((workspace.relationship || "").toLowerCase()) ||
      workspace.role === "owner",
    ).length;
    const joined = Math.max(workspaces.length - owned, 0);
    const active = workspaces.filter((workspace) => workspace.status !== "archived").length;

    return { owned, joined, active };
  }, [workspaces]);

  if (loading) {
    return (
      <div className="app-page-medium flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#2563EB] dark:text-[#3B82F6]" />
      </div>
    );
  }

  return (
    <div className="app-page-medium">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#111111] dark:text-[#E8E8E7]">
            Your workspaces
          </h1>
        </div>

        <Link
          href="/workspaces/create"
          className="inline-flex items-center justify-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]"
        >
          <Plus className="h-4 w-4" />
          Create workspace
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[8px] border border-[#EAEAEA] dark:border-white/8 bg-white dark:bg-[#202020] px-4 py-3">
          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">Owned</p>
          <p className="mt-1 text-[20px] font-semibold text-[#111111] dark:text-[#E8E8E7]">{stats.owned}</p>
        </div>
        <div className="rounded-[8px] border border-[#EAEAEA] dark:border-white/8 bg-white dark:bg-[#202020] px-4 py-3">
          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">Joined</p>
          <p className="mt-1 text-[20px] font-semibold text-[#111111] dark:text-[#E8E8E7]">{stats.joined}</p>
        </div>
        <div className="rounded-[8px] border border-[#EAEAEA] dark:border-white/8 bg-white dark:bg-[#202020] px-4 py-3">
          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">Active</p>
          <p className="mt-1 text-[20px] font-semibold text-[#111111] dark:text-[#E8E8E7]">{stats.active}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[6px] border border-[#F5C6C7] dark:border-[rgba(159,47,45,0.2)] bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] px-4 py-3 text-[13px] text-[#9F2F2D] dark:text-[#F87171]">
          {error}
        </div>
      )}

      {workspaces.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-[#EAEAEA] dark:border-white/8 bg-white dark:bg-[#202020] px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[6px] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-[15px] font-semibold text-[#111111] dark:text-[#E8E8E7]">
            No workspace yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] text-[#787774] dark:text-[#9B9A97]">
            Create a workspace to start organizing work, documents, and team collaboration.
          </p>
          <Link
            href="/workspaces/create"
            className="mt-6 inline-flex items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]"
          >
            <Plus className="h-4 w-4" />
            Create your first workspace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {workspaces.map((workspace) => {
            const routeKey = workspaceRouteKeyOf(workspace);
            const isOwner =
              ["owner", "owned"].includes((workspace.relationship || "").toLowerCase()) ||
              workspace.role === "owner";

            return (
              <Link
                key={workspaceIdOf(workspace) || routeKey}
                href={`/workspaces/${routeKey}`}
                className="group rounded-[8px] border border-[#EAEAEA] dark:border-white/8 bg-white dark:bg-[#202020] p-5 transition hover:border-[#2563EB]/30 dark:hover:border-[#3B82F6]/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#2563EB] dark:bg-[#3B82F6] text-white">
                      {isOwner ? <ShieldCheck className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors">
                        {workspace.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {workspace.key && (
                          <span className="rounded-[4px] bg-[#F7F6F3] dark:bg-[#252525] px-2 py-0.5 text-[10px] font-mono font-semibold text-[#787774] dark:text-[#9B9A97]">
                            {workspace.key}
                          </span>
                        )}
                        <span className="rounded-[4px] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] px-2 py-0.5 text-[10px] font-medium capitalize text-[#1F6C9F] dark:text-[#93C5FD]">
                          {roleLabel(workspace)}
                        </span>
                        {workspace.status && (
                          <span className="rounded-[4px] bg-[#F7F6F3] dark:bg-[#252525] px-2 py-0.5 text-[10px] font-medium capitalize text-[#787774] dark:text-[#9B9A97]">
                            {workspace.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#ABABAB] dark:text-[#6B6B6B] transition group-hover:translate-x-0.5 group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6]" />
                </div>

                <div className="mt-5 flex items-center gap-2 text-[11px] text-[#ABABAB] dark:text-[#6B6B6B]">
                  <LayoutDashboard className="h-4 w-4" />
                  Open workspace
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
