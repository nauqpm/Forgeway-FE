"use client";

import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { resolveWorkspaceFromRouteKey } from "@/modules/workspace/shared/services/resolveWorkspace";
import {
  WorkspaceInfo,
  WorkspaceSettingsForm,
  normalizeWorkspaceInfo,
} from "../types/workspaceSettings.type";

export interface UseWorkspaceSettingsReturn {
  workspace: WorkspaceInfo | null;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  leaving: boolean;
  form: WorkspaceSettingsForm;
  showDeleteDialog: boolean;
  deleteConfirm: string;
  showLeaveDialog: boolean;
  leaveConfirm: string;
  setForm: (form: WorkspaceSettingsForm) => void;
  setShowDeleteDialog: (value: boolean) => void;
  setDeleteConfirm: (value: string) => void;
  setShowLeaveDialog: (value: boolean) => void;
  setLeaveConfirm: (value: string) => void;
  handleSave: (event: FormEvent) => void;
  handleDelete: () => void;
  handleLeave: () => void;
  handleDeleteConfirmKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  handleLeaveConfirmKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export function useWorkspaceSettings(workspaceKey: string): UseWorkspaceSettingsReturn {
  const router = useRouter();

  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [form, setForm] = useState<WorkspaceSettingsForm>({
    name: "",
    description: "",
    status: "active",
    access: "public",
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState("");

  useEffect(() => {
    if (!workspaceKey) return;

    setLoading(true);
    resolveWorkspaceFromRouteKey(workspaceKey)
      .then((resolved) => {
        const next = normalizeWorkspaceInfo(resolved);
        setWorkspace(next);
        setForm({
          name: next.name || "",
          description: next.description || "",
          status: next.status || "active",
          access: next.access || "public",
        });
      })
      .catch(() => {
        setWorkspace(null);
        toast.error("Could not load workspace settings.");
      })
      .finally(() => setLoading(false));
  }, [workspaceKey]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Workspace name is required.");
      return;
    }

    setSaving(true);
    try {
      const workspaceId = workspace?._id;
      if (!workspaceId) throw new Error("Missing workspace id");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        access: form.access,
      };

      const res = await api.put(apiRoutes.WORKSPACES.UPDATE(workspaceId), payload);
      const updated = normalizeWorkspaceInfo(res.data);
      setWorkspace(updated);
      setForm({
        name: updated.name || "",
        description: updated.description || "",
        status: updated.status || "active",
        access: updated.access || "public",
      });
      toast.success("Workspace settings saved.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save workspace settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "delete") {
      toast.error('Enter "delete" to confirm.');
      return;
    }

    setDeleting(true);
    try {
      const workspaceId = workspace?._id;
      if (!workspaceId) throw new Error("Missing workspace id");

      await api.delete(apiRoutes.WORKSPACES.BY_ID(workspaceId));
      toast.success("Workspace deleted.");
      setShowDeleteDialog(false);
      router.push("/workspaces");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete workspace.");
    } finally {
      setDeleting(false);
    }
  };

  const handleLeave = async () => {
    if (leaveConfirm !== "leave") {
      toast.error('Enter "leave" to confirm.');
      return;
    }

    setLeaving(true);
    try {
      const workspaceId = workspace?._id;
      if (!workspaceId) throw new Error("Missing workspace id");

      await api.delete(apiRoutes.WORKSPACES.LEAVE(workspaceId));
      toast.success("Left workspace.");
      router.push("/workspaces");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not leave workspace.");
    } finally {
      setLeaving(false);
      setShowLeaveDialog(false);
    }
  };

  const handleDeleteConfirmKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || deleting) return;
    event.preventDefault();
    void handleDelete();
  };

  const handleLeaveConfirmKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || leaving) return;
    event.preventDefault();
    void handleLeave();
  };

  return {
    workspace,
    loading,
    saving,
    deleting,
    leaving,
    form,
    showDeleteDialog,
    deleteConfirm,
    showLeaveDialog,
    leaveConfirm,
    setForm,
    setShowDeleteDialog,
    setDeleteConfirm,
    setShowLeaveDialog,
    setLeaveConfirm,
    handleSave,
    handleDelete,
    handleLeave,
    handleDeleteConfirmKeyDown,
    handleLeaveConfirmKeyDown,
  };
}
