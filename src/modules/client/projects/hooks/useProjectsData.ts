"use client";

import { useEffect, useState, useCallback } from "react";
import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import type { Project } from "../types/projects.type";

interface UseProjectsDataReturn {
  projects: Project[];
  loading: boolean;
  refetch: () => void;
}

export function useProjectsData(): UseProjectsDataReturn {
  const { currentWorkspace } = useCurrentWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!currentWorkspace?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`${apiRoutes.PROJECTS.BASE}?workspaceId=${currentWorkspace._id}`);
      setProjects(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?._id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
}
