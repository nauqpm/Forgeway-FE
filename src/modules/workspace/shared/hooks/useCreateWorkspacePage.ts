"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateWorkspace } from "@/modules/workspace/shared/hooks/useCreateWorkspace";
import { workspaceService } from "@/modules/workspace/shared/services/workspaceService";
import {
  DEFAULT_WORKSPACE_AVATAR_URL,
  selectRandomWorkspaceAvatar,
  WorkspaceSampleAvatar,
} from "@/modules/workspace/shared/utils/workspaceAvatar";

export interface CreateWorkspaceForm {
  name: string;
  key: string;
  description: string;
  avatar: string;
  visibility: "public" | "private";
  template: "kanban" | "scrum";
}

export interface CreateWorkspacePageProps {
  form: CreateWorkspaceForm;
  handleFieldChange: (field: keyof CreateWorkspaceForm, value: string) => void;
  handleKeyChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  error: string;
  isLoading: boolean;
  avatarSamples: WorkspaceSampleAvatar[];
  loadingAvatars: boolean;
}

export function useCreateWorkspacePage(): CreateWorkspacePageProps {
  const router = useRouter();
  const { createWorkspace, isLoading } = useCreateWorkspace();

  const [form, setForm] = useState<CreateWorkspaceForm>({
    name: "",
    key: "",
    description: "",
    avatar: DEFAULT_WORKSPACE_AVATAR_URL,
    visibility: "public",
    template: "kanban",
  });
  const [error, setError] = useState("");
  const [avatarSamples, setAvatarSamples] = useState<WorkspaceSampleAvatar[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);

  useEffect(() => {
    let mounted = true;

    workspaceService
      .listAvatarSamples()
      .then((samples) => {
        if (!mounted) return;
        setAvatarSamples(samples);
        setForm((current) => ({
          ...current,
          avatar: current.avatar || selectRandomWorkspaceAvatar(samples),
        }));
      })
      .catch(() => {
        if (!mounted) return;
        setAvatarSamples([]);
        setForm((current) => ({
          ...current,
          avatar: current.avatar || DEFAULT_WORKSPACE_AVATAR_URL,
        }));
      })
      .finally(() => {
        if (mounted) setLoadingAvatars(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleFieldChange = (field: keyof CreateWorkspaceForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleKeyChange = (value: string) => {
    setForm((current) => ({
      ...current,
      key: value.toUpperCase().substring(0, 10),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createWorkspace({
        name: form.name,
        key: form.key,
        description: form.description,
        avatar: form.avatar,
        type: form.template,
        access: form.visibility === "public" ? "public" : "private",
      });
      router.push("/workspaces");
    } catch {
      setError("Workspace creation failed. Please try again.");
    }
  };

  return {
    form,
    handleFieldChange,
    handleKeyChange,
    handleSubmit,
    error,
    isLoading,
    avatarSamples,
    loadingAvatars,
  };
}
