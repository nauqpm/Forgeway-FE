import assert from "node:assert/strict";

import {
  DEFAULT_WORKSPACE_AVATAR_URL,
  getWorkspaceAvatarInitial,
  getWorkspaceAvatarUrl,
  selectRandomWorkspaceAvatar,
  updateWorkspaceAvatarInList,
} from "./workspaceAvatar";

assert.equal(getWorkspaceAvatarUrl({ avatar: "https://example.com/a.png" }), "https://example.com/a.png");
assert.equal(getWorkspaceAvatarUrl({ name: "Legacy" }), DEFAULT_WORKSPACE_AVATAR_URL);
assert.equal(getWorkspaceAvatarInitial({ name: "Engineering" }), "E");
assert.equal(getWorkspaceAvatarInitial({ key: "qa" }), "Q");

const avatars = [
  { id: "one", publicId: "folder/one", url: "https://example.com/one.png" },
  { id: "two", publicId: "folder/two", url: "https://example.com/two.png" },
];

assert.equal(selectRandomWorkspaceAvatar(avatars, () => 0.99), avatars[1].url);
assert.equal(selectRandomWorkspaceAvatar([], () => 0.99), DEFAULT_WORKSPACE_AVATAR_URL);

const workspaces = [
  { _id: "1", name: "One", avatar: "old-1" },
  { _id: "2", name: "Two", avatar: "old-2" },
];
const updated = updateWorkspaceAvatarInList(workspaces, "2", "new-2");

assert.notEqual(updated, workspaces);
assert.equal(updated[0], workspaces[0]);
assert.deepEqual(updated[1], { _id: "2", name: "Two", avatar: "new-2" });

console.log("workspaceAvatar tests passed");
