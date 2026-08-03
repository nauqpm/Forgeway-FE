import { expect, test, type Page, type Route } from "@playwright/test";

const API = "http://localhost:5512";
const workspace = {
  _id: "ws-1",
  key: "AL",
  name: "AutomationLand",
  type: "kanban",
  ownerId: "admin-1",
  members: [{ userId: { _id: "admin-1", email: "admin@example.com" }, role: "workspace_admin" }],
};
const emptyContent = {
  problem: "",
  expectedOutcome: "",
  actors: [],
  scope: [],
  outOfScope: [],
  businessRules: [],
  permissionRequirements: [],
  constraints: [],
  dependencies: [],
  risks: [],
};

type FixtureOptions = { role?: "workspace_admin" | "viewer" };

async function installStoryApi(page: Page, { role = "workspace_admin" }: FixtureOptions = {}) {
  const state = {
    requirements: [] as Record<string, unknown>[],
    contracts: [] as Record<string, unknown>[],
    drafts: [] as Record<string, unknown>[],
    proposals: [] as Record<string, unknown>[],
    decisions: [] as Record<string, unknown>[],
    versions: [] as Record<string, unknown>[],
    approvalRequests: [] as Record<string, unknown>[],
    approvalRecords: [] as Record<string, unknown>[],
    verifications: [] as Record<string, unknown>[],
    task: {
      id: "task-1",
      _id: "task-1",
      key: "AL-1",
      title: "Ship Story governance",
      status: "To Do",
      priority: "High",
      storyContractId: null as string | null,
      storyVersionId: null as string | null,
      requirementsState: "CURRENT",
    },
    impact: null as Record<string, unknown> | null,
    holdContracts: false,
    releaseContracts: undefined as (() => void) | undefined,
    contractsError: false,
    workflow: {
      _id: "workflow-1",
      workspaceId: "ws-1",
      name: "Delivery workflow",
      defaultStatus: "todo",
      statuses: [
        { id: "todo", name: "To do", color: "#999", category: "todo" },
        { id: "review", name: "Quality check", color: "#f90", category: "inprogress" },
        { id: "done", name: "Done", color: "#090", category: "done" },
      ],
      transitions: [],
    },
    idempotency: [] as Array<{ path: string; value: string | null }>,
    unexpectedRequests: [] as string[],
  };
  const memberWorkspace = {
    ...workspace,
    ownerId: role === "workspace_admin" ? "admin-1" : "owner-1",
    members: [{ userId: { _id: "admin-1", email: "admin@example.com" }, role }],
  };

  const json = (route: Route, data: unknown, status = 200) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
  const story = (route: Route, data: unknown, status = 200) => json(route, { data }, status);

  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const body = request.postDataJSON?.() as Record<string, unknown> | undefined;

    if (path === "/auth/me") return json(route, { id: "admin-1", email: "admin@example.com", fullName: "Story Admin", role: role === "workspace_admin" ? "admin" : "user" });
    if (path === "/auth/my-permissions") return json(route, { permissions: [] });
    if (path === "/auth/refresh") return json(route, { accessToken: "story-e2e" });
    if (path === "/workspaces" && method === "GET") return story(route, [memberWorkspace]);
    if (path === "/workspaces/ws-1/members") return story(route, memberWorkspace.members);
    if (path === "/notifications/unread-count") return json(route, { count: 0 });
    if (path === "/chat/channels") return json(route, []);
    if (path === "/chat/users/search") return json(route, []);
    if (path === "/workspaces/ws-1/board") return story(route, { columns: [] });
    if (path === "/workflows/workspace/ws-1" && method === "GET") return json(route, state.workflow);
    if (path === "/workflows/workflow-1" && method === "PUT") {
      state.workflow = { ...state.workflow, ...body, statuses: body?.statuses as typeof state.workflow.statuses };
      return json(route, state.workflow);
    }

    if (path === "/workspaces/ws-1/requirements") {
      if (method === "GET") return story(route, state.requirements);
      const requirement = { _id: "req-1", workspaceId: "ws-1", status: "active", ...body };
      state.requirements = [...state.requirements, requirement];
      return story(route, requirement, 201);
    }

    if (path === "/workspaces/ws-1/story-contracts") {
      if (method === "GET") {
        if (state.holdContracts) await new Promise<void>((resolve) => { state.releaseContracts = resolve; });
        if (state.contractsError) return json(route, { message: "Fixture contract failure" }, 503);
        return story(route, state.contracts);
      }
      const contract = {
        _id: "contract-1",
        workspaceId: "ws-1",
        key: "STORY-1",
        title: body?.title,
        status: "active",
        currentApprovedStoryVersionId: null,
        latestStoryVersionNumber: 0,
        version: 1,
      };
      const draft = {
        _id: "draft-1",
        workspaceId: "ws-1",
        storyContractId: "contract-1",
        draftRevision: 1,
        status: "active",
        content: emptyContent,
        requirementLinks: [{ requirementId: "req-1", role: "PRIMARY", evidenceNote: "" }],
        criterionInputs: [],
        decisionProposalIds: [],
      };
      state.contracts = [contract];
      state.drafts = [draft];
      return story(route, { contract, draft }, 201);
    }

    if (path === "/workspaces/ws-1/story-contracts/contract-1") return story(route, state.contracts[0]);
    if (path === "/workspaces/ws-1/story-contracts/contract-1/drafts") {
      if (method === "GET") return story(route, state.drafts);
      return story(route, state.drafts[0], 201);
    }
    if (path === "/workspaces/ws-1/story-contracts/contract-1/drafts/draft-1") {
      if (method === "GET") return story(route, state.drafts[0]);
      const current = state.drafts[0];
      const updated = { ...current, ...body, draftRevision: Number(current.draftRevision) + 1 };
      state.drafts = [updated];
      return story(route, updated);
    }
    if (path.endsWith("/drafts/draft-1/submit")) {
      state.idempotency.push({ path, value: request.headers()["idempotency-key"] ?? null });
      const draft = state.drafts[0];
      const version = {
        _id: "version-1",
        workspaceId: "ws-1",
        storyContractId: "contract-1",
        sourceDraftId: "draft-1",
        versionNumber: 1,
        baseStoryVersionId: null,
        contentSnapshot: draft.content,
        requirementLinkSnapshot: (draft.requirementLinks as Record<string, unknown>[]).map(({ role, ...link }) => ({ ...link, relationship: role })),
        criteria: [{ acceptanceCriterionId: "criterion-1", acceptanceCriterionRevisionId: "revision-1", key: "AC-1", priority: "MUST" }],
        decisionRecordIds: state.decisions.map((item) => item._id),
        contentHash: "sha256:version-1",
      };
      state.drafts = [{ ...draft, status: "submitted", submittedStoryVersionId: "version-1" }];
      state.versions = [version];
      state.contracts = [{ ...state.contracts[0], latestStoryVersionNumber: 1 }];
      return story(route, version, 201);
    }

    if (path.endsWith("/decision-proposals")) {
      if (method === "GET") return story(route, state.proposals);
      const proposal = { _id: "proposal-1", workspaceId: "ws-1", storyContractId: "contract-1", state: "OPEN", proposedBy: { kind: "human", actorId: "admin-1" }, ...body };
      state.proposals = [proposal];
      return story(route, proposal, 201);
    }
    if (path.endsWith("/decision-proposals/proposal-1") && method === "PATCH") {
      state.proposals = [{ ...state.proposals[0], ...body }];
      return story(route, state.proposals[0]);
    }
    if (path.endsWith("/decision-proposals/proposal-1/approve")) {
      const decision = { _id: "decision-1", workspaceId: "ws-1", storyContractId: "contract-1", sourceProposalId: "proposal-1", question: state.proposals[0].question, decidedBy: "admin-1", decidedAt: "2026-07-30T10:00:00.000Z", ...body };
      state.proposals = [{ ...state.proposals[0], state: "APPROVED", resolvedBy: "admin-1" }];
      state.decisions = [decision];
      return story(route, decision, 201);
    }
    if (path.endsWith("/decisions")) return story(route, state.decisions);

    if (path.endsWith("/versions") && method === "GET") return story(route, state.versions);
    if (method === "GET" && path.endsWith("/versions/version-1")) return story(route, state.versions.find((item) => item._id === "version-1"));
    if (method === "GET" && path.endsWith("/versions/version-2")) return story(route, state.versions.find((item) => item._id === "version-2"));
    if (path.includes("/versions/") && path.includes("/diff/")) {
      return story(route, {
        _id: "diff-1",
        workspaceId: "ws-1",
        storyContractId: "contract-1",
        fromStoryVersionId: "version-1",
        toStoryVersionId: "version-2",
        fromContentHash: "sha256:version-1",
        toContentHash: "sha256:version-2",
        scopeChanges: [{ changeType: "MODIFIED", entityId: "scope-1", impactLevel: "REVIEW_REQUIRED" }],
        businessRuleChanges: [],
        permissionChanges: [],
        requirementChanges: [],
        acceptanceCriterionChanges: [],
        decisionChanges: [],
        dependencyChanges: [],
      });
    }
    if (path.endsWith("/approvals") && method === "GET") return story(route, { requests: state.approvalRequests, records: state.approvalRecords });
    if (path.endsWith("/approval-requests")) {
      const approval = { _id: "approval-1", workspaceId: "ws-1", storyContractId: "contract-1", storyVersionId: "version-1", state: "PENDING", requestedBy: "admin-1" };
      state.approvalRequests = [approval];
      return story(route, approval, 201);
    }
    if (path.endsWith("/versions/version-1/approve")) {
      state.idempotency.push({ path, value: request.headers()["idempotency-key"] ?? null });
      const record = { _id: "record-1", workspaceId: "ws-1", storyContractId: "contract-1", storyVersionId: "version-1", approvalRequestId: "approval-1", decision: "APPROVE" };
      state.approvalRequests = [{ ...state.approvalRequests[0], state: "APPROVED" }];
      state.approvalRecords = [record];
      state.contracts = [{ ...state.contracts[0], currentApprovedStoryVersionId: "version-1" }];
      state.versions = [...state.versions, { ...state.versions[0], _id: "version-2", versionNumber: 2, sourceDraftId: "draft-2", baseStoryVersionId: "version-1", contentHash: "sha256:version-2" }];
      state.impact = { _id: "impact-1", workspaceId: "ws-1", taskId: "task-1", storyContractId: "contract-1", fromStoryVersionId: "version-1", toStoryVersionId: "version-2", affectedCriterionIds: ["criterion-1"], requirementsState: "REBASE_REQUIRED", state: "PENDING" };
      return story(route, { record, approved: true });
    }

    if (path.endsWith("/criteria/criterion-1")) return story(route, { _id: "criterion-1", workspaceId: "ws-1", storyContractId: "contract-1", key: "AC-1", lifecycle: "ACTIVE" });
    if (path.endsWith("/criteria/criterion-1/revisions")) return story(route, [{ _id: "revision-1", workspaceId: "ws-1", storyContractId: "contract-1", acceptanceCriterionId: "criterion-1", revisionNumber: 1, key: "AC-1", priority: "MUST", statement: "The Story is governed", verificationMethod: "E2E", contentHash: "criterion-hash" }]);
    if (path.includes("/revisions/revision-1/verifications")) {
      if (method === "GET") return story(route, state.verifications);
      const verification = { _id: "verification-1", workspaceId: "ws-1", storyContractId: "contract-1", acceptanceCriterionId: "criterion-1", acceptanceCriterionRevisionId: "revision-1", submittedBy: "admin-1", submittedAt: "2026-07-30T10:30:00.000Z", ...body };
      state.verifications = [verification];
      return story(route, verification, 201);
    }

    if (path === "/workspaces/ws-1/board/tasks") return story(route, { tasks: [state.task] });
    if (path.endsWith("/versions/version-1/tasks/task-1/link")) {
      state.task = { ...state.task, storyContractId: "contract-1", storyVersionId: "version-1", requirementsState: "REBASE_REQUIRED" };
      state.contracts = [{ ...state.contracts[0], currentApprovedStoryVersionId: "version-2" }];
      return story(route, {});
    }
    if (path === "/workspaces/ws-1/board/key/AL-1") return story(route, state.task);
    if (
      method === "GET" &&
      [
        "/workspaces/ws-1/board/task-1/cover",
        "/workspaces/ws-1/board/task-1/attachments",
        "/workspaces/ws-1/board/task-1/comments",
      ].includes(path)
    ) return story(route, []);
    if (path === "/workspaces/ws-1/tasks/task-1/story-impact") return state.impact ? story(route, state.impact) : json(route, { message: "Not found" }, 404);
    if (path.endsWith("/story-impact/impact-1/resolve")) {
      state.idempotency.push({ path, value: request.headers()["idempotency-key"] ?? null });
      state.impact = { ...state.impact, requirementsState: "CURRENT", state: "RESOLVED" };
      state.task = { ...state.task, storyVersionId: "version-2", requirementsState: "CURRENT" };
      return story(route, state.impact);
    }
    if (path.includes("/impact")) return story(route, state.impact ? [state.impact] : []);

    state.unexpectedRequests.push(`${method} ${path}`);
    return json(route, { message: `Unexpected mocked API request: ${method} ${path}` }, 501);
  });

  return state;
}

test("admin completes the critical Story lifecycle with idempotent writes", async ({ page }) => {
  const state = await installStoryApi(page);
  await page.goto("/workspaces/AL/stories");

  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.getByLabel("Key", { exact: true }).fill("REQ-1");
  await page.getByLabel("Title", { exact: true }).fill("Govern Story delivery");
  await page.getByLabel("Body", { exact: true }).fill("Keep requirements and delivery aligned.");
  await page.getByRole("button", { name: "Save requirement" }).click();
  await expect(page.getByText("REQ-1")).toBeVisible();

  await page.getByRole("button", { name: "Create contract" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Governed checkout");
  await page.getByLabel("Primary requirement").selectOption("req-1");
  await page.locator("form").getByRole("button", { name: "Create contract" }).click();
  expect(state.unexpectedRequests).toEqual([]);
  await expect(page.getByLabel("Story draft editor")).toBeVisible();

  await page.getByLabel("Problem").fill("Checkout behavior drifts from approved requirements.");
  await page.getByLabel("Expected outcome").fill("Every delivery points to an approved Story.");
  await page.getByRole("button", { name: "Add criterion" }).click();
  await page.getByLabel("Criterion key 1").fill("AC-1");
  await page.getByLabel("Criterion statement 1").fill("Delivery remains aligned.");
  await page.getByLabel("Criterion verification method 1").fill("Playwright");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toContainText("Saved revision 2");

  await page.getByRole("button", { name: "Decisions" }).click();
  await page.getByRole("button", { name: "New proposal" }).click();
  await page.getByLabel("Question").fill("Which delivery gate?");
  await page.getByLabel("Option key 1").fill("review");
  await page.getByLabel("Option label 1").fill("Requirements review");
  await page.getByRole("button", { name: "Save proposal" }).click();
  await page.getByRole("button", { name: "Edit proposal" }).click();
  await page.getByLabel("Recommendation").fill("Use the Requirements review gate.");
  await page.getByRole("button", { name: "Save proposal" }).click();
  await page.getByRole("button", { name: "Approve proposal" }).click();
  await page.getByLabel("Selected option").selectOption("review");
  await page.getByLabel("Rationale").fill("It is the authoritative gate.");
  await page.getByRole("button", { name: "Approve decision" }).click();
  await expect(page.getByLabel("Decision record")).toContainText("Which delivery gate?");

  await page.getByRole("button", { name: "Drafts" }).click();
  await page.getByRole("button", { name: "Submit draft" }).click();
  await page.getByRole("button", { name: "Confirm submit" }).click();
  await expect(page.getByLabel("Story Versions")).toContainText("Version 1");
  expect(state.idempotency.filter((item) => item.path.endsWith("/submit"))).toHaveLength(1);
  expect(state.idempotency.find((item) => item.path.endsWith("/submit"))?.value).toBeTruthy();

  await page.getByRole("button", { name: "Approvals" }).click();
  await page.getByRole("button", { name: "Request approval for Version 1" }).click();
  await page.getByRole("button", { name: "Approve Version 1" }).click();
  await page.getByRole("dialog", { name: "Approve Version" }).getByRole("button", { name: "Approve Version" }).click();
  expect(state.idempotency.filter((item) => item.path.endsWith("/approve"))).toHaveLength(1);
  expect(state.idempotency.find((item) => item.path.endsWith("/approve"))?.value).toBeTruthy();

  await page.getByRole("button", { name: "Versions" }).click();
  await page.getByLabel("Compare from version").selectOption("version-1");
  await page.getByLabel("Compare to version").selectOption("version-2");
  const diff = page.getByRole("table", { name: "Semantic version diff" });
  await expect(diff).toContainText("scope-1");
  expect(await diff.evaluate((table) => getComputedStyle(table.parentElement!).overflowX)).toBe("auto");

  await page.getByRole("button", { name: "Criteria" }).click();
  await page.getByRole("button", { name: /AC-1MUST/ }).click();
  await page.getByRole("button", { name: "Add verification evidence" }).click();
  await page.getByLabel("Evidence type").fill("playwright");
  await page.getByLabel("Evidence reference").fill("e2e/story-governance.spec.ts");
  await page.getByRole("button", { name: "Submit verification" }).click();
  await expect(
    page.getByRole("region", { name: "Verification evidence" }),
  ).toContainText("e2e/story-governance.spec.ts");

  await page.goto("/dashboard/workflows");
  await page.getByRole("radio", { name: "Use Quality check as the requirements review gate" }).check();
  await page.getByRole("button", { name: "Save review gate" }).click();
  await expect(page.getByText("Requirements review gate", { exact: true })).toBeVisible();
  expect((state.workflow.statuses.find((status) => status.id === "review") as Record<string, unknown>)?.requirementsGate).toBe("review");

  await page.goto("/workspaces/AL/stories");
  await page.getByRole("button", { name: "Versions" }).click();
  await page.getByRole("button", { name: "Link current approved Version to Task" }).click();
  await page.getByLabel("Task", { exact: true }).selectOption("task-1");
  await page.getByRole("button", { name: "Continue to confirmation" }).click();
  await page.getByRole("dialog", { name: "Link Task to approved Version" }).getByRole("button", { name: "Link Task" }).click();
  expect(state.task.storyVersionId).toBe("version-1");
  expect(state.task.requirementsState).toBe("REBASE_REQUIRED");

  await page.goto("/workspaces/AL/board/key/AL-1");
  const taskStory = page.getByRole("region", { name: "Task Story" });
  await expect(taskStory).toContainText("Rebase required");
  await taskStory.getByRole("button", { name: "Resolve impact" }).click();
  await expect(taskStory).toContainText("Current");
  await expect(taskStory).toContainText("Version 2");
  expect(state.idempotency.filter((item) => item.path.endsWith("/resolve"))).toHaveLength(1);
  expect(state.idempotency.find((item) => item.path.endsWith("/resolve"))?.value).toBeTruthy();
  const idempotencyKeys = state.idempotency.map((item) => item.value);
  expect(idempotencyKeys.every(Boolean)).toBe(true);
  expect(new Set(idempotencyKeys).size).toBe(3);
  expect(state.task.storyVersionId).toBe("version-2");
  expect(state.task.requirementsState).toBe("CURRENT");
  expect(state.unexpectedRequests).toEqual([]);
});

test("viewer sees read-only controls and both viewports have no horizontal overflow", async ({ page }) => {
  const state = await installStoryApi(page, { role: "viewer" });
  state.requirements = [{ _id: "req-1", workspaceId: "ws-1", key: "REQ-1", title: "Read-only requirement", body: "Viewer fixture", sourceType: "manual", status: "active" }];
  state.contracts = [{ _id: "contract-1", workspaceId: "ws-1", key: "STORY-1", title: "Read-only Story", status: "active", currentApprovedStoryVersionId: "version-1", latestStoryVersionNumber: 2, version: 1 }];
  state.drafts = [{ _id: "draft-1", workspaceId: "ws-1", storyContractId: "contract-1", draftRevision: 1, status: "active", content: emptyContent, requirementLinks: [{ requirementId: "req-1", role: "PRIMARY", evidenceNote: "" }], criterionInputs: [{ key: "AC-1", priority: "MUST", statement: "Viewer cannot edit", verificationMethod: "Playwright" }], decisionProposalIds: [] }];
  state.versions = [1, 2].map((versionNumber) => ({ _id: `version-${versionNumber}`, workspaceId: "ws-1", storyContractId: "contract-1", sourceDraftId: "draft-1", versionNumber, baseStoryVersionId: versionNumber === 1 ? null : "version-1", contentSnapshot: emptyContent, requirementLinkSnapshot: [{ requirementId: "req-1", relationship: "PRIMARY" }], criteria: [{ acceptanceCriterionId: "criterion-1", acceptanceCriterionRevisionId: "revision-1", key: "AC-1", priority: "MUST" }], decisionRecordIds: [], contentHash: `sha256:version-${versionNumber}` }));
  state.proposals = [{ _id: "proposal-1", workspaceId: "ws-1", storyContractId: "contract-1", state: "OPEN", question: "Viewer decision", options: [{ key: "yes", label: "Yes" }], proposedBy: { kind: "human", actorId: "admin-1" } }];
  state.approvalRequests = [{ _id: "approval-2", workspaceId: "ws-1", storyContractId: "contract-1", storyVersionId: "version-2", state: "PENDING", requestedBy: "admin-1" }];
  state.task = { ...state.task, storyContractId: "contract-1", storyVersionId: "version-1", requirementsState: "REBASE_REQUIRED" };
  state.impact = { _id: "impact-1", workspaceId: "ws-1", taskId: "task-1", storyContractId: "contract-1", fromStoryVersionId: "version-1", toStoryVersionId: "version-2", affectedCriterionIds: ["criterion-1"], requirementsState: "REBASE_REQUIRED", state: "PENDING" };
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/workspaces/AL/stories");

  await expect(page.getByRole("button", { name: "Create", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create contract" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Archive requirement/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Archive contract/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Story contracts" })).toBeVisible();
  await page.getByRole("button", { name: "Drafts" }).click();
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Submit draft" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add criterion" })).toHaveCount(0);
  await page.getByRole("button", { name: "Decisions" }).click();
  await expect(page.getByRole("button", { name: "New proposal" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit proposal" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Approve proposal" })).toHaveCount(0);
  await page.getByRole("button", { name: "Approvals" }).click();
  await expect(page.getByRole("button", { name: "Request approval for Version 2" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Approve Version 2" })).toHaveCount(0);
  await page.getByRole("button", { name: "Criteria" }).click();
  await page.getByRole("button", { name: /AC-1MUST/ }).click();
  await expect(page.getByRole("button", { name: "Add verification evidence" })).toHaveCount(0);
  await page.getByRole("button", { name: "Versions" }).click();
  await expect(page.getByRole("button", { name: "Link current approved Version to Task" })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const mobilePanels = page.locator('nav[aria-label="Story workspace panels"]');
  await expect(mobilePanels).toBeAttached();
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  expect(await page.locator("[data-story-mobile-panel]").first().evaluate((element) => getComputedStyle(element).transform)).toBe("none");
  if ((page.viewportSize()?.width ?? 0) < 1024) await expect(mobilePanels).toBeVisible();
  await page.goto("/workspaces/AL/board/key/AL-1");
  const taskStory = page.getByRole("region", { name: "Task Story" });
  await expect(taskStory).toContainText("Rebase required");
  await expect(taskStory.getByRole("button", { name: "Resolve impact" })).toHaveCount(0);
  expect(state.unexpectedRequests).toEqual([]);
});

test("dirty Draft navigation is named and keeps focus inside the confirmation", async ({ page }) => {
  const state = await installStoryApi(page);
  await page.goto("/workspaces/AL/stories");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.getByLabel("Key", { exact: true }).fill("REQ-1");
  await page.getByLabel("Title", { exact: true }).fill("Govern Story delivery");
  await page.getByLabel("Body", { exact: true }).fill("Body");
  await page.getByRole("button", { name: "Save requirement" }).click();
  await page.getByRole("button", { name: "Create contract" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Governed checkout");
  await page.getByLabel("Primary requirement").selectOption("req-1");
  await page.locator("form").getByRole("button", { name: "Create contract" }).click();
  await page.getByLabel("Problem").fill("Unsaved");
  await page.getByRole("button", { name: "Versions" }).focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Discard Story draft edits" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Keep editing" })).toBeVisible();
  for (let index = 0; index < 4; index += 1) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  expect(state.unexpectedRequests).toEqual([]);
});

test("dense Story states remain usable across themes and responsive widths", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop project performs the desktop, tablet, and mobile visual matrix once.");
  const state = await installStoryApi(page);
  const longTitle = "A deliberately long governed checkout Story title that must remain readable without widening the document";
  state.requirements = [{ _id: "req-1", workspaceId: "ws-1", key: "REQ-1", title: longTitle, body: "Dense fixture", sourceType: "manual", status: "active" }];
  state.contracts = [{ _id: "contract-1", workspaceId: "ws-1", key: "STORY-1", title: longTitle, status: "active", currentApprovedStoryVersionId: "version-10", latestStoryVersionNumber: 10, version: 1 }];
  state.drafts = [{
    _id: "draft-1",
    workspaceId: "ws-1",
    storyContractId: "contract-1",
    draftRevision: 10,
    status: "active",
    content: { ...emptyContent, problem: longTitle },
    requirementLinks: [{ requirementId: "req-1", role: "PRIMARY", evidenceNote: "" }],
    criterionInputs: Array.from({ length: 10 }, (_, index) => ({ key: `AC-${index + 1}`, priority: "MUST", statement: `Dense criterion ${index + 1}`, verificationMethod: "Playwright" })),
    decisionProposalIds: [],
  }];
  state.versions = Array.from({ length: 10 }, (_, index) => ({
    _id: `version-${index + 1}`,
    workspaceId: "ws-1",
    storyContractId: "contract-1",
    sourceDraftId: "draft-1",
    versionNumber: index + 1,
    baseStoryVersionId: index ? `version-${index}` : null,
    contentSnapshot: { ...emptyContent, problem: longTitle },
    requirementLinkSnapshot: [{ requirementId: "req-1", relationship: "PRIMARY" }],
    criteria: Array.from({ length: 10 }, (__, criterionIndex) => ({ acceptanceCriterionId: `criterion-${criterionIndex + 1}`, acceptanceCriterionRevisionId: `revision-${criterionIndex + 1}`, key: `AC-${criterionIndex + 1}`, priority: "MUST" })),
    decisionRecordIds: [],
    contentHash: `sha256:version-${index + 1}`,
  }));

  state.holdContracts = true;
  await page.goto("/workspaces/AL/stories");
  await expect(page.getByLabel("Story contracts loading")).toBeVisible();
  state.holdContracts = false;
  state.releaseContracts?.();
  await expect(page.getByText(longTitle).first()).toBeVisible();

  for (const width of [1440, 820, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.getByRole("heading", { name: "Story contracts" })).toBeVisible();
  }

  await page.getByRole("button", { name: "Versions" }).click();
  await expect(page.getByRole("button", { name: "Version 10" })).toBeVisible();
  await expect(page.getByText("AC-10 · MUST")).toBeVisible();

  await page.evaluate(() => localStorage.setItem("app-theme", "dark"));
  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  await page.evaluate(() => localStorage.setItem("app-theme", "light"));
  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("light"))).toBe(true);

  state.contractsError = true;
  await page.reload();
  await expect(page.getByText("Story contracts could not be loaded. Refresh the page to try again.")).toBeVisible();
  state.contractsError = false;
  state.contracts = [];
  state.drafts = [];
  state.versions = [];
  await page.reload();
  await expect(page.getByText(/No story contracts yet/)).toBeVisible();
  expect(state.unexpectedRequests).toEqual([]);
});
