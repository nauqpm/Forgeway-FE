# Phase 3 — CRDT Yjs Collaborative Docs Editing
**Date:** 2026-06-07
**Status:** Discussion complete → ready for planning

---

## <domain>
Replace the current last-write-wins Socket.IO broadcasting in the `docs` editor with
Yjs CRDT-based collaborative editing. Introduce an explicit **Read/Edit mode** split
and replace automatic draft publishing with an explicit **Update** button.

**Branch:** `feat-collaborative-docs` (FE) / corresponding BE branch.

Scope:
- ✅ Yjs CRDT sync for both title and content
- ✅ Read mode (published content) / Edit mode (live Yjs draft)
- ✅ Auto-save to shared draft via Yjs (no auto-publish)
- ✅ Explicit Update button → flush draft + publish main page
- ✅ Offline pending update queue (in-memory Uint8Array[])
- ✅ beforeunload warning when disconnected + pending updates
- ✅ Reconnect with state sync (server sends full yjsState on rejoin)
- ❌ Full offline editing (out of scope)
</domain>

---

## <decisions>

### 1. Yjs Document Structure
**Decision:** Single `Y.Doc` with two shared types:
- `Y.XmlFragment` named `"default"` — bound to `@tiptap/extension-collaboration` for rich text content
- `Y.Text` named `"title"` — bound to a custom collaborative title input
- Both types live in one `Y.Doc`, one socket connection, one `page:join` / `page:yjs-update` channel

### 2. Yjs Update Transport
**Decision:** Binary Uint8Array updates via a **new** `page:yjs-update` socket event
- Client emits: `socket.emit('page:yjs-update', { pageId, update: Uint8Array })`
- BE relays raw binary bytes to all OTHER clients in the page room (`client.to(pageRoom).emit(...)`)
- BE **additionally** applies the update to its in-memory or persisted `Y.Doc` snapshot via `Y.applyUpdate(ydoc, update)` in NestJS (requires `yjs` npm package on BE)
- Remove existing `page:update` HTML-based event from `SOCKET_COMMANDS` and gateway

### 3. Reconnect State Sync
**Decision:** On `page:join` (including reconnect), server returns the full Yjs state as `yjsState: number[]`
- FE does `Y.applyUpdate(ydoc, new Uint8Array(yjsState))` to merge server state into local doc
- This handles short disconnects gracefully — client catches up with missed updates

### 4. Offline Pending Queue
**Decision:** In-memory queue on FE: `pendingUpdates: Uint8Array[]`
- While socket is disconnected, Yjs updates (from `ydoc.on('update', ...)`) are pushed to the queue
- On reconnect (via `realtimeSocketClient.onReconnect()`), drain the queue: apply each pending update to local `Y.Doc`, then emit all via `page:yjs-update` to server
- **NOT** persisted to localStorage — purely in-memory

### 5. Draft Storage (Backend: PageDraft schema changes)
**Decision:** `PageDraft` stores **both** fields:
```ts
yjsState: Buffer  // serialized Y.encodeStateAsUpdate(ydoc) — the full Yjs snapshot
content: string   // HTML string derived from Yjs (for search, fallback)
title: string     // Current collaborative title (plain text from Y.Text)
```
- `yjsState` is updated whenever `page:yjs-update` is received (apply update → re-encode)
- `content` and `title` are derived from Yjs state at update time (used for fallback and search)
- Old `PageDraft.content: string` field is **replaced** by `yjsState: Buffer + content: string + title: string`

### 6. page:join Response Shape
**Decision:**
```ts
{ ok: true, yjsState: number[], content: string, title: string }
```
- `yjsState`: `Array.from(Y.encodeStateAsUpdate(ydoc))` — serialized as plain number array (JSON-safe)
- `content`: HTML string from current draft (fallback if yjsState is empty/no draft)
- `title`: current collaborative title string
- FE merges: `Y.applyUpdate(ydoc, new Uint8Array(yjsState))`; if yjsState is empty, initialize from `content` HTML via `@tiptap/extension-collaboration` initial content

### 7. Remove Auto-Flush Behavior (Backend)
**Decision:** Remove all automatic draft-to-page flushing from `PageCollabService`:
- Remove `flushTimers` debounce (currently 10 seconds)
- Remove `flushDraftIfRoomEmpty()` call from `page:leave` handler
- Remove `flushDraft()` auto-call path entirely
- **Keep** `flushDraft()` as a method but only called by the explicit Update endpoint

### 8. Publish Flow (Update button)
**Decision:** Update button triggers a two-step sequential REST call:
1. `PATCH /pages/:id` with `{ title, content }` — flush current Yjs-derived HTML + title to main Page
2. `POST /pages/:id/publish` — set status = `'published'`
- Both calls are made from the FE using existing `pagesService.updatePage()` + a new `pagesService.publishPage()` method
- On success: toast "Cập nhật thành công", update the local Zustand store doc with new `status: 'published'`
- On failure: toast error, do NOT update the main page doc in store

### 9. Read/Edit Mode
**Decision:** Header toggle button (in `EditorHeader`):
- Default: **Read mode** — shows published (`document.content` from Zustand store), toolbar hidden, inputs non-editable
- Edit mode: shows Yjs collaborative draft, toolbar visible, title/content editable
- Toggle is a `<button>` with two states: `'Xem'` / `'Chỉnh sửa'`
- Only users with `PAGE_EDIT` permission can enter Edit mode (toggle button hidden for read-only users)
- Yjs connection (socket join, update listener) is **only established when entering Edit mode**
- On switching from Edit → Read: leave page room (`page:leave`), disconnect Yjs listeners

### 10. Connection Status Indicator
**Decision:** Non-blocking inline indicator in `EditorHeader` (Edit mode only):
- 🟢 Connected: "Đang cộng tác" (green dot)
- 🟡 Connecting: "Đang kết nối..." (yellow dot, spinner)
- 🔴 Disconnected: "Mất kết nối. Thay đổi được lưu cục bộ. Đang kết nối lại..." (red dot)
- Uses `realtimeSocketClient.subscribeStatus()` to track `RealtimeStatusSnapshot`

### 11. beforeunload Warning
**Decision:** Register `window.beforeunload` handler **only** when:
- User is in **Edit mode**, AND
- Socket status is `'disconnected'` or `'error'`, AND
- `pendingUpdates.length > 0` (there are queued unsent Yjs updates)

Warning message: `"Bạn có thay đổi chưa được đồng bộ. Nếu rời trang, các thay đổi này có thể bị mất."`

</decisions>

---

## <canonical_refs>

### Frontend — Files to modify/create
- `src/modules/client/docs/editor/TiptapEditor.tsx` — Major rewrite: Yjs, mode state, offline queue
- `src/modules/client/docs/editor/EditorHeader.tsx` — Add mode toggle, Update button, connection indicator
- `src/modules/client/docs/editor/editorExtensions.ts` — Add Collaboration + CollaborationCursor extensions
- `src/lib/socket/socket.page.ts` — Replace `update()` HTML method with `yjsUpdate()` binary method
- `src/lib/socket/socket.events.ts` — Add `PAGE_YJS_UPDATE: 'page:yjs-update'` event
- `src/modules/client/docs/services/pages.service.ts` — Add `publishPage(id)` method

### Backend — Files to modify
- `src/modules/pages/schemas/page-draft.schema.ts` — Add `yjsState: Buffer`, `title: string` fields
- `src/modules/realtime/realtime.gateway.ts` — Add `page:yjs-update` handler, modify `page:join` response
- `src/modules/realtime/services/page-collab.service.ts` — Rework: add `yjs` npm, remove auto-flush, add `applyYjsUpdate()`, `getYjsState()`
- `src/modules/realtime/dto/page-update.dto.ts` → Rename/replace with `page-yjs-update.dto.ts`

### npm packages required
- **Frontend:** `yjs`, `@tiptap/extension-collaboration`, `@tiptap/extension-collaboration-cursor`
- **Backend:** `yjs` (for `Y.applyUpdate`, `Y.encodeStateAsUpdate`)

### Key references
- Existing `PageRoomManager` — `src/lib/socket/socket.page.ts` (extend, don't replace)
- Existing `RealtimeSocketClient.onReconnect()` — use to drain pending update queue
- Existing `realtimeSocketClient.subscribeStatus()` — use for connection indicator
- Existing `pagesService.updatePage()` — reuse for PATCH on Update button
- Backend `POST /pages/:id/publish` endpoint — already implemented in `pages.controller.ts`

</canonical_refs>

---

## <code_context>

### Reusable assets
- **`realtimeSocketClient`** — Singleton with `connect()`, `subscribeStatus()`, `onReconnect()`, `pageManager`. All hooks available — use directly.
- **`PageRoomManager.join()`** — Already handles leave-before-join, reconnect via `rejoin()`. Need to add `yjsUpdate()` method.
- **`getEditorExtensions()`** — Must add `Collaboration.configure({ document: ydoc })` and `CollaborationCursor` here. Remove `History` extension (conflicts with Collaboration).
- **`useDocsStore`** — `documents` array has `content` (published HTML) and `title`. In Read mode, render from store. In Edit mode, render from Yjs Y.Doc.
- **`WORKSPACE_PERMISSIONS.PAGE_EDIT`** + `useWorkspacePermission()` — already wired up for edit permission check.

### Key gaps / changes needed
- `page:update` event and `PageUpdateDto` → **replace** with `page:yjs-update` + `PageYjsUpdateDto`  
- `PageDraft.content: string` → **extend** schema with `yjsState: Buffer`, `title: string`
- `page:join` response `{ ok, draft?: string }` → **replace** with `{ ok, yjsState: number[], content: string, title: string }`
- `PageCollabService.handleUpdate()` receiving HTML string → **replace** with `applyYjsUpdate(pageId, update: Buffer)`
- Auto-flush timers in `PageCollabService` → **remove entirely**
- `TiptapEditor` `onUpdate` debounce emitting HTML → **remove**, replace with Yjs `ydoc.on('update', ...)` listener
- `EditorHeader` save status indicator → repurpose as connection status + **add Update button** + **mode toggle**

</code_context>

---

## <deferred>
- CollaborationCursor (presence avatars showing each user's cursor position) — can be added as enhancement but not required for this phase
- Full offline editing (IndexedDB persistence of Yjs state) — explicitly out of scope per spec
- y-socket.io library integration — decided against; custom relay is simpler
</deferred>

---

## <next_steps>
```
/gsd-plan-phase 3
```

Implementation order suggested:
1. **Backend first:** Update `PageDraft` schema, rework `PageCollabService` (add `yjs` npm), update `page:join` response shape, add `page:yjs-update` gateway handler
2. **FE socket layer:** Add `PAGE_YJS_UPDATE` event, add `yjsUpdate()` to `PageRoomManager`
3. **FE editor:** Install `yjs` + Tiptap Collaboration extensions, rework `TiptapEditor` with Yjs, mode state, offline queue
4. **FE header:** Add mode toggle, Update button, connection indicator to `EditorHeader`
5. **FE service:** Add `publishPage()` to `pagesService`
</next_steps>
