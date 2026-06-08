# Phase 3 — Discussion Log
**Date:** 2026-06-07
**Phase:** CRDT Yjs Collaborative Docs Editing

---

## Areas Discussed

### 1. Yjs Document Structure

| Question | Options Presented | Decision |
|---|---|---|
| Shared type structure for title + content | Single Y.Doc (Y.XmlFragment + Y.Text) / Two separate Y.Docs / Title via REST | **Single Y.Doc — two shared types** |
| Update transport over Socket.IO | Binary Uint8Array via new event / Base64 JSON / y-socket.io library | **Binary Uint8Array via `page:yjs-update`** |
| Reconnect sync mechanism | Full state vector on rejoin / Wait for next broadcast / None | **Full yjsState on rejoin** |
| Offline pending queue | In-memory Uint8Array[] queue + drain on reconnect / Discard on disconnect | **In-memory queue, drain on reconnect** |

### 2. Draft Storage Model

| Question | Options Presented | Decision |
|---|---|---|
| What PageDraft stores | yjsState+content / yjsState only / content only | **Both: yjsState Buffer + content String + title String** |
| page:join response | yjsState + content + title / yjsState only / content only | **{ok, yjsState: number[], content, title}** |
| BE Yjs state accumulation | Apply updates and persist in PageDraft / Store raw chunks / Relay only | **Apply Y.applyUpdate, persist full snapshot** |

### 3. Read/Edit Mode UX

| Question | Options Presented | Decision |
|---|---|---|
| Mode switching mechanism | Header toggle button / URL param / Default Read + floating Edit button | **Header toggle button ('Xem' / 'Chỉnh sửa')** |
| Content in Read mode | Published (main page) content / Draft content / Fresh API fetch | **Published (Zustand store) content** |
| Update button placement | EditorHeader next to toggle / Floating FAB / Above title | **EditorHeader, indigo primary button** |

### 4. Publish Flow

| Question | Options Presented | Decision |
|---|---|---|
| What Update button does | PATCH + POST /publish (two-step) / POST /publish only (BE flushes) / Socket event | **Two-step: PATCH {title,content} then POST /publish** |
| Status change on Update | Always publish / Only save content / Confirm dialog | **Always set status='published'** |
| Auto-flush removal | Remove entirely / Keep with 30s delay / Keep flushDraftIfRoomEmpty only | **Remove all auto-flush behavior** |

### 5. Offline Warning

| Question | Options Presented | Decision |
|---|---|---|
| Warning trigger condition | Edit mode + disconnected + pending queue | **All three conditions must be true** |
| In-editor disconnect indicator | Toast/banner + colored dot in header / Modal blocker / No indicator | **Non-blocking banner + colored dot in EditorHeader** |

---

## Agent Discretion Items
- Using `number[]` (not `Buffer`) as JSON wire format for `yjsState` in socket responses — avoids binary encoding issues in socket.io JSON mode
- Yjs connection established only when entering Edit mode (not on page load) — reduces unnecessary socket room joins for readers
- CollaborationCursor (presence) deferred — not in scope for this phase

## Deferred Ideas
- CollaborationCursor presence avatars — future enhancement
- Full offline editing with IndexedDB persistence — explicitly out of scope per spec
- y-socket.io library integration — decided against for simpler custom relay
