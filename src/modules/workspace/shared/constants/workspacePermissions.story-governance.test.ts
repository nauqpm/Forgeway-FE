import { describe, expect, it } from "vitest";

import { WORKSPACE_ROLE_PERMISSIONS } from "./workspacePermissions";

describe("Story Governance workspace permissions", () => {
  it("matches the Backend viewer/member/admin role matrix", () => {
    expect(WORKSPACE_ROLE_PERMISSIONS.viewer).toEqual(
      expect.arrayContaining(["story:read", "story:compare_versions", "story:read_impact"]),
    );
    expect(WORKSPACE_ROLE_PERMISSIONS.member).toEqual(
      expect.arrayContaining([
        "story:create",
        "story:create_draft",
        "story:edit_draft",
        "story:submit",
        "story:resolve_impact",
        "decision:propose",
        "criterion:submit_verification",
      ]),
    );
    expect(WORKSPACE_ROLE_PERMISSIONS.member).not.toEqual(
      expect.arrayContaining(["story:approve", "story:archive", "decision:approve"]),
    );
    expect(WORKSPACE_ROLE_PERMISSIONS.workspace_admin).toEqual(
      expect.arrayContaining(["story:approve", "story:archive", "decision:approve"]),
    );
  });
});
