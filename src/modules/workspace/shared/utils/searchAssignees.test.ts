import * as assert from "node:assert/strict";

import { buildSearchAssignees } from "./searchAssignees";

const objectId = "6a716afc607f9684a9646d50";

assert.deepEqual(
  buildSearchAssignees([
    {
      userId: {
        _id: objectId,
        fullName: "Sang Tran",
        email: "sang@example.com",
        avatar: "avatar.png",
      },
      role: "member",
    },
  ]),
  [{ id: objectId, name: "Sang Tran", avatar: "avatar.png" }],
  "search assignees should use the hydrated member name",
);

assert.equal(
  buildSearchAssignees([{ userId: objectId, role: "member" }])[0]?.name,
  "Unknown member",
  "an unresolved member must never expose a MongoDB id as its label",
);

assert.equal(
  buildSearchAssignees(
    [{ userId: objectId, role: "member" }],
    { id: objectId, fullName: "Current User" },
  )[0]?.name,
  "Current User",
  "the authenticated user's name should resolve while member data is raw",
);
