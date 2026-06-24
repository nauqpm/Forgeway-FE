"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { CheckSquare, ChevronDown, FileText, Kanban, Search, Sparkles, UserRound } from "lucide-react";
import { useInfiniteGlobalSearch } from "@/modules/workspace/shared/hooks/useInfiniteGlobalSearch";
import type { GlobalSearchItem, GlobalSearchType } from "@/modules/workspace/shared/services/globalSearch.service";

const ALL_TYPES: GlobalSearchType[] = ["task", "page", "comment", "workspace", "board", "sprint", "user"];

const cleanDescription = (value?: string) =>
  (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const iconFor = (item: GlobalSearchItem) => {
  if (item.type === "task") return CheckSquare;
  if (item.type === "page") return FileText;
  if (item.type === "user") return UserRound;
  if (item.type === "workspace" || item.type === "board") return Kanban;
  return Sparkles;
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const typeParam = searchParams.get("types");
  const selectedTypes = useMemo(() => {
    const values = typeParam
      ?.split(",")
      .filter((type): type is GlobalSearchType => ALL_TYPES.includes(type as GlobalSearchType));
    return values?.length ? values : ALL_TYPES;
  }, [typeParam]);
  const [input, setInput] = useState(query);
  const search = useInfiniteGlobalSearch({ q: query, types: selectedTypes, limit: 20 });
  const items = search.data?.pages.flatMap((page) => page.items) ?? [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = input.trim();
    if (next.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(next)}${typeParam ? `&types=${encodeURIComponent(typeParam)}` : ""}`);
  };

  const toggleType = (type: GlobalSearchType) => {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter((value) => value !== type)
      : [...selectedTypes, type];
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (next.length && next.length !== ALL_TYPES.length) params.set("types", next.join(","));
    router.push(`/search?${params.toString()}`);
  };

  return (
    <main className="app-main mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">Search</h1>
      <form onSubmit={submit} className="mt-5 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#787774]" />
          <input
            value={input}
            maxLength={256}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search tasks, docs, people and more"
            className="h-11 w-full rounded-lg border border-[#EAEAEA] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#2563EB] dark:border-white/[0.08] dark:bg-[#252525]"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white disabled:opacity-50"
          disabled={input.trim().length < 2}
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {ALL_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleType(type)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${selectedTypes.includes(type) ? "bg-[#DBEAFE] text-[#1D4ED8] dark:bg-[#1E3A5F] dark:text-[#BFDBFE]" : "bg-[#F5F5F4] text-[#787774] dark:bg-[#2A2A2A]"}`}
          >
            {type}
          </button>
        ))}
      </div>

      {query.length > 0 && query.length < 2 && (
        <p className="mt-8 text-sm text-[#787774]">Enter at least two characters to search.</p>
      )}
      {search.isLoading && <p className="mt-8 text-sm text-[#787774]">Searching…</p>}
      {search.isError && <p className="mt-8 text-sm text-red-600">Search could not be completed.</p>}
      {!search.isLoading && query.length >= 2 && items.length === 0 && (
        <p className="mt-8 text-sm text-[#787774]">No accessible results found.</p>
      )}

      <div className="mt-6 divide-y divide-[#EAEAEA] overflow-hidden rounded-xl border border-[#EAEAEA] bg-white dark:divide-white/[0.08] dark:border-white/[0.08] dark:bg-[#252525]">
        {items.map((item) => {
          const Icon = iconFor(item);
          return (
            <Link
              key={`${item.type}-${item.id}`}
              href={item.url}
              className="flex gap-3 p-4 transition-colors hover:bg-[#F9F9F8] dark:hover:bg-[#2A2A2A]"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  {item.key ? `${item.key} ${item.title}` : item.title}
                </div>
                <div className="mt-1 line-clamp-2 text-sm text-[#787774] dark:text-[#9B9A97]">
                  {[item.type, item.workspaceName, cleanDescription(item.description)].filter(Boolean).join(" · ")}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {search.hasNextPage && (
        <button
          type="button"
          onClick={() => search.fetchNextPage()}
          disabled={search.isFetchingNextPage}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#EAEAEA] px-4 py-2 text-sm font-semibold text-[#2563EB] disabled:opacity-50 dark:border-white/[0.1]"
        >
          {search.isFetchingNextPage ? "Loading…" : "Load more"}
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </main>
  );
}
