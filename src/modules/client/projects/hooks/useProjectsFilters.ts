"use client";

import { useState, useMemo } from "react";
import type { Project } from "../types/projects.type";

type ViewMode = "grid" | "list";

interface UseProjectsFiltersReturn {
  search: string;
  setSearch: (value: string) => void;
  view: ViewMode;
  setView: (value: ViewMode) => void;
  filtered: Project[];
}

export function useProjectsFilters(projects: Project[]): UseProjectsFiltersReturn {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.key.toLowerCase().includes(search.toLowerCase()),
      ),
    [projects, search],
  );

  return { search, setSearch, view, setView, filtered };
}
