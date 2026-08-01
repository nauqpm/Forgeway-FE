import { expect, request, test } from "@playwright/test";

const workspaceKey = process.env.STORY_E2E_WORKSPACE_KEY;
const storageState = process.env.STORY_E2E_STORAGE_STATE;
const apiUrl = process.env.STORY_E2E_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5512";

test.describe("Story Governance live backend", () => {
  test.skip(!workspaceKey || !storageState, "Set STORY_E2E_WORKSPACE_KEY and STORY_E2E_STORAGE_STATE to run live smoke.");

  test("lists records, creates isolated fixtures, saves the Draft, and preserves scope isolation", async () => {
    const api = await request.newContext({ baseURL: apiUrl, storageState });
    let createdWorkspaceId: string | undefined;
    let createdRequirementId: string | undefined;
    let createdContractId: string | undefined;
    const unwrap = async <T>(response: Awaited<ReturnType<typeof api.get>>) => {
      const payload = await response.json();
      return (payload?.data?.data ?? payload?.data ?? payload) as T;
    };

    try {
      const workspacesResponse = await api.get("/workspaces");
      expect(workspacesResponse.ok()).toBeTruthy();
      const workspaces = await unwrap<Array<{ _id: string; key?: string; slug?: string }>>(workspacesResponse);
      const workspace = workspaces.find((item) => item.key === workspaceKey || item.slug === workspaceKey || item._id === workspaceKey);
      expect(workspace, `Workspace ${workspaceKey} must be visible to the authenticated state.`).toBeTruthy();
      const alternateWorkspace = workspaces.find((item) => item._id !== workspace!._id);
      test.skip(!alternateWorkspace, "Cross-scope smoke requires two real visible workspaces.");
      createdWorkspaceId = workspace!._id;

      const requirementsResponse = await api.get(`/workspaces/${workspace!._id}/requirements`);
      const contractsResponse = await api.get(`/workspaces/${workspace!._id}/story-contracts`);
      expect(requirementsResponse.ok()).toBeTruthy();
      expect(contractsResponse.ok()).toBeTruthy();
      const existingContracts = await unwrap<Array<{ _id: string }>>(contractsResponse);
      if (existingContracts[0]) {
        expect((await api.get(`/workspaces/${workspace!._id}/story-contracts/${existingContracts[0]._id}`)).ok()).toBeTruthy();
      }

      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const requirementResponse = await api.post(`/workspaces/${workspace!._id}/requirements`, {
        data: {
          key: `E2E-${unique}`,
          title: `E2E Story ${unique}`,
          body: "Created by the opt-in Story Governance live smoke.",
          sourceType: "manual",
        },
      });
      expect(requirementResponse.ok()).toBeTruthy();
      const requirement = await unwrap<{ _id: string }>(requirementResponse);
      createdRequirementId = requirement._id;

      const contractResponse = await api.post(`/workspaces/${workspace!._id}/story-contracts`, {
        data: { title: `E2E Contract ${unique}`, primaryRequirementId: requirement._id },
      });
      expect(contractResponse.ok()).toBeTruthy();
      const created = await unwrap<{ contract: { _id: string }; draft: { _id: string; draftRevision: number } }>(contractResponse);
      createdContractId = created.contract._id;

      const draftResponse = await api.patch(
        `/workspaces/${workspace!._id}/story-contracts/${created.contract._id}/drafts/${created.draft._id}`,
        {
          data: {
            expectedDraftRevision: created.draft.draftRevision,
            content: {
              problem: "Verify authenticated live Draft persistence.",
              expectedOutcome: "The exact Draft revision is saved.",
              actors: [],
              scope: [],
              outOfScope: [],
              businessRules: [],
              permissionRequirements: [],
              constraints: [],
              dependencies: [],
              risks: [],
            },
          },
        },
      );
      expect(draftResponse.ok()).toBeTruthy();

      const crossScope = await api.get(`/workspaces/${alternateWorkspace!._id}/requirements/${requirement._id}`);
      expect(crossScope.status()).toBe(404);
    } finally {
      if (createdWorkspaceId && createdContractId) {
        const cleanup = await api.post(`/workspaces/${createdWorkspaceId}/story-contracts/${createdContractId}/archive`);
        if (!cleanup.ok()) test.info().annotations.push({ type: "cleanup", description: `Contract cleanup returned ${cleanup.status()}.` });
      }
      if (createdWorkspaceId && createdRequirementId) {
        const cleanup = await api.post(`/workspaces/${createdWorkspaceId}/requirements/${createdRequirementId}/archive`);
        if (!cleanup.ok()) test.info().annotations.push({ type: "cleanup", description: `Requirement cleanup returned ${cleanup.status()}.` });
      }
      await api.dispose();
    }
  });
});
