"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
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
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="app-page-medium">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            For you
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Your workspaces
          </h1>
        </div>

        <Link
          href="/workspaces/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Create workspace
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Owned</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{stats.owned}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{stats.joined}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{stats.active}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {workspaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            No workspace yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Create a workspace to start organizing work, documents, and team collaboration.
          </p>
          <Link
            href="/workspaces/create"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
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
                className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                      {isOwner ? <ShieldCheck className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                        {workspace.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {workspace.key && (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {workspace.key}
                          </span>
                        )}
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium capitalize text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {roleLabel(workspace)}
                        </span>
                        {workspace.status && (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {workspace.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                </div>

                <div className="mt-5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
