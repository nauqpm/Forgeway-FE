# Frontend Refactor Plan

> **Mục tiêu:** Chuẩn hóa cấu trúc `src/` — loại bỏ duplicate, xác lập quy tắc rõ ràng về nơi đặt hook/util/store/service, dọn dead code.
> **Nguyên tắc chỉ đạo:** Module-first · Single source of truth · Không speculative abstraction

---

## Kiến trúc hiện tại → Mục tiêu

```
Frontend/                          Frontend/
├── app/           (root, đúng)    ├── app/           (GIỮ NGUYÊN, chỉ dọn zombie routes)
│   ├── (auth)/                    │   ├── (auth)/
│   ├── (client)/                  │   ├── (client)/   ← xóa account/, dọn dashboard/
│   ├── admin/     ← XÓA           │   ├── invites/
│   ├── staff/     ← XÓA           │   └── layout.tsx
│   ├── aboutUs/   ← XÓA           │
│   └── invites/                   └── src/
│                                      ├── modules/    (feature modules — tự chứa)
└── src/                               │   ├── auth/
    ├── common/    ← ĐỔI TÊN           │   ├── workspace/  ← từ client/workspaces/
    ├── context/   ← XÓA               │   ├── docs/
    ├── hooks/     ← PHÂN TÁN          │   ├── notifications/
    ├── lib/       ← GIỮ, DỌN          │   ├── profile/
    ├── modules/                        │   └── for-you/
    │   ├── admin/ ← XÓA               ├── shared/     ← đổi tên từ common/
    │   ├── client/← GIẢI TÁN          │   ├── components/
    │   ├── auth/                       │   ├── hooks/
    │   └── staff/ ← XÓA               ├── lib/
    ├── stores/                         │   ├── axios/
    ├── config/                         │   ├── socket/
    ├── types/                          │   └── realtime/  ← từ hooks/realtime/
    └── utils/     ← XÓA (duplicate)   ├── stores/
                                        ├── config/
                                        └── types/
```

---

## Kết quả Verify Thực Tế (2026-06-17)

> Codegraph index bị stale — một số file nó báo tồn tại thực ra đã bị xóa. Đã dùng `find` + `grep` để verify.

| Codegraph báo | Thực tế |
|---|---|
| `src/config/api.ts` tồn tại | ❌ Không tồn tại |
| `src/common/utils/api.ts` tồn tại | ❌ Không tồn tại |
| `src/common/utils/axios.ts` tồn tại | ❌ Không tồn tại |
| `src/common/services/api.service.ts` tồn tại | ❌ Không tồn tại |
| `src/modules/admin/index.ts` tồn tại | ❌ Không tồn tại |

| Không có trong plan | Thực tế |
|---|---|
| `src/lib/axiosIns.ts` | ✅ Tồn tại — axios đã centralized |
| `src/lib/admin-url.ts` | ✅ Tồn tại |
| `src/modules/shared/` (25 files) | ✅ Tồn tại — rename từ `modules/staff/` đã xong |
| `src/common/utils/apiError.ts` | ✅ Tồn tại |
| `src/common/utils/uploadService.ts` | ✅ Tồn tại |
| `src/common/services/account-switcher.service.ts` | ✅ Tồn tại |
| `src/common/services/recent-logins.service.ts` | ✅ Tồn tại |
| `src/common/hooks/useImages.ts` (zero consumers) | ✅ Tồn tại — dead code |
| `src/modules/admin/components/Chat/Chat.tsx` (zero consumers) | ✅ Tồn tại — dead code |

---

## Phase Index

| # | Tên | Phụ thuộc | Rủi ro | Thời gian ước tính | Trạng thái |
|---|-----|-----------|--------|-------------------|------------|
| 0 | Dead Code Removal | — | 🟢 Thấp | 1h | ☐ |
| 1 | Consolidate Duplicate Utils | 0 | 🟢 Thấp | 1h | ☐ |
| 2 | `common/` → `shared/` + phân tán services | 1 | 🟡 Trung bình | 2-3h | ☐ |
| 3 | Consolidate Hooks | 2 | 🟡 Trung bình | 2h | ☐ |
| 4 | Normalize Stores | 2 | 🟢 Thấp | 1h | ☐ |
| 5 | Consolidate API Config | 2 | 🟡 Trung bình | 1-2h | ☐ |
| 6 | Eliminate AuthContext Wrapper | 2, 4 (fully done) | 🔴 Cao | 3-4h | ☐ |
| 7a | Workspace Module — Types/Utils/Services | 2, 3 | 🟡 Trung bình | 2h | ☐ |
| 7b | Workspace Module — Feature sub-domains | 7a | 🟡 Trung bình | 2-3h | ☐ |
| 7c | Workspace Module — Tasks/Board + cleanup | 7b | 🔴 Cao | 2-3h | ☐ |
| 8 | Final Cleanup & Alias Update | 0-7c | 🟢 Thấp | 1h | ☐ |

**Quy tắc thực hiện:**
- Luôn tạo branch mới trước mỗi phase: `git checkout -b refactor/phase-N`
- Sau mỗi step: `npx tsc --noEmit` — fix ngay, không để dồn
- Sau mỗi phase: `npm run lint && npm run build`
- Commit ngay khi phase xong, không gộp nhiều phase vào một commit

---

## Phase 0 — Dead Code Removal

**Context:** Các file/folder này không có consumer nào. Đã verify thực tế — `app/admin/`, `app/staff/`, `app/(client)/account/` đã được xóa trước đó.

**Branch:** `refactor/phase-0-dead-code`

> ✅ **Đã hoàn thành trước đó:** `app/admin/`, `app/staff/`, `app/(client)/account/`
> ⚠️ **Không phải dead code:** `app/aboutUs/` (linked từ header/footer), `app/LandingAuthActions.tsx` và `app/AdminNavLink.tsx` (dùng trong `app/page.tsx` landing page)

> 📌 **Context: `src/modules/staff/` vs `src/modules/shared/`**
> `src/modules/staff/` đã được rename → `src/modules/shared/` (25 files, hoàn thành). `src/modules/staff/` còn lại chỉ là re-export shims:
> `staff/components/Users/Users.tsx` → re-exports from `@/modules/shared/components/Users/Users`
> `staff/components/Workflows/Workflows.tsx` → re-exports from `@/modules/shared/components/Workflows/Workflows`
> Không có consumer nào import trực tiếp từ `modules/staff` → an toàn xóa.

### Bước 0.1 — Xóa `src/modules/staff/`

Verify không có consumer:
```bash
grep -rn "modules/staff" src/ app/ --include="*.ts" --include="*.tsx"
# Phải rỗng
```

```
XÓA: src/modules/staff/    (toàn bộ folder — chỉ là re-export shims của modules/shared/)
```

### Bước 0.2 — Xóa `src/modules/admin/`

Verify không có consumer:
```bash
grep -rn "modules/admin" src/ app/ --include="*.ts" --include="*.tsx"
# Phải rỗng
```

Nội dung: `components/Chat/Chat.tsx` — không có file nào import từ đây.

```
XÓA: src/modules/admin/    (toàn bộ folder)
```

### Bước 0.3 — Xóa `src/common/hooks/useAuth.ts`

Verify không có consumer:
```bash
grep -rn "from.*common/hooks/useAuth" src/ app/ --include="*.ts" --include="*.tsx"
# Phải rỗng
```

Hook cũ, chỉ có `register()` dùng axios thô trực tiếp. Hook thực sự là `src/modules/auth/shared/hooks/useAuth.ts`.

```
XÓA: src/common/hooks/useAuth.ts
```

### Bước 0.4 — Xóa `src/common/hooks/useImages.ts`

Verify không có consumer:
```bash
grep -rn "useImages\|common/hooks/useImages" src/ app/ --include="*.ts" --include="*.tsx" | grep -v "^src/common/hooks/useImages.ts"
# Phải rỗng
```

```
XÓA: src/common/hooks/useImages.ts
```

### Verification Phase 0

```bash
npx tsc --noEmit
npm run lint
```

---

## Phase 1 — Consolidate Duplicate Utils

**Context:** `src/utils/` là bản copy không đồng bộ của `src/common/utils/`. Hai file bị duplicate hoàn toàn.

**Depends on:** Phase 0

**Branch:** `refactor/phase-1-utils`

### Files bị duplicate

| `src/utils/` | `src/common/utils/` |
|---|---|
| `slug.utils.ts` | `slug.utils.ts` |
| `transformSunEditorHtml.ts` | `transformSunEditorHtml.ts` |

### Files chỉ có trong `src/utils/` (không có bản copy)

```
src/utils/getThumbnailPath.ts
src/utils/jqlParser.ts
src/utils/timeTracking.ts
src/utils/workSpaceUI.ts
```

### Files chỉ có trong `src/common/utils/` (không có bản copy trong `src/utils/`)

```
src/common/utils/apiError.ts      ← error helper, giữ lại trong shared/utils/
src/common/utils/uploadService.ts ← upload helper, giữ lại trong shared/utils/
```

> ⚠️ **Verify lại:** `src/common/utils/api.ts` và `src/common/utils/axios.ts` không tồn tại thực tế (codegraph stale). Đừng tạo move task cho chúng.

### Bước 1.1 — Diff hai file duplicate để chọn bản mới hơn

```bash
diff src/utils/slug.utils.ts src/common/utils/slug.utils.ts
diff src/utils/transformSunEditorHtml.ts src/common/utils/transformSunEditorHtml.ts
```

Nếu có khác biệt → giữ bản mới hơn, copy nội dung vào `src/common/utils/`.

### Bước 1.2 — Tìm tất cả import dùng `src/utils/`

```bash
grep -rn "from.*@/utils/" src/ app/ --include="*.ts" --include="*.tsx"
grep -rn "from.*'../utils/" src/ app/ --include="*.ts" --include="*.tsx"
grep -rn "from.*'../../utils/" src/ app/ --include="*.ts" --include="*.tsx"
```

### Bước 1.3 — Update imports: `@/utils/X` → `@/common/utils/X`

Với mỗi file tìm được ở 1.2, thay đổi import path.

**Lưu ý:** `@/common/utils/` là đích tạm thời — Phase 2 sẽ đổi thành `@/shared/utils/`. Nếu làm Phase 1 và Phase 2 liên tiếp trong cùng branch (`refactor/phase-1-2-combined`), bỏ qua bước này và update thẳng về `@/shared/utils/` luôn để tránh phải sửa hai lần.

### Bước 1.4 — Move 4 files còn lại vào `src/common/utils/`

```
src/utils/getThumbnailPath.ts  → src/common/utils/getThumbnailPath.ts
src/utils/jqlParser.ts         → src/common/utils/jqlParser.ts
src/utils/timeTracking.ts      → src/common/utils/timeTracking.ts
src/utils/workSpaceUI.ts       → src/common/utils/workSpaceUI.ts
```

Kiểm tra xem `jqlParser.ts` và `workSpaceUI.ts` có thuộc về một module cụ thể không — nếu có thì move thẳng vào module đó thay vì `common/utils/`.

### Bước 1.5 — Xóa `src/utils/`

Sau khi tất cả imports đã được update và không còn file nào trong `src/utils/`.

### Verification Phase 1

```bash
# Đảm bảo không còn import nào trỏ về src/utils/
grep -rn "@/utils/" src/ app/ --include="*.ts" --include="*.tsx"
# Output phải rỗng

npx tsc --noEmit
npm run lint
```

---

## Phase 2 — `src/common/` → `src/shared/` + Phân tán Services

**Context:** Tên `common` mờ nhạt. `shared` rõ hơn: code dùng chung cross-module. Ngoài đổi tên, phase này cũng phân tán các service/component đang bị đặt sai chỗ trong `common/`.

**Depends on:** Phase 1

**Branch:** `refactor/phase-2-shared`

### Bước 2.0 — Rename `src/modules/shared/` → `src/modules/admin-shared/` (TRƯỚC KHI LÀM GÌ KHÁC)

Tại sao cần làm trước: Phase này sẽ tạo `src/shared/` mới. Nếu để `src/modules/shared/` tên cũ, developer mới sẽ nhầm hai folder có ý nghĩa hoàn toàn khác nhau.

- `src/shared/` (sẽ tạo) = cross-cutting hooks/utils/components
- `src/modules/shared/` (hiện có) = admin feature module (Dashboard, Users, Workflows)

Verify consumers hiện tại:
```bash
grep -rn "modules/shared" src/ app/ --include="*.ts" --include="*.tsx"
```

Rename folder: `src/modules/shared/` → `src/modules/admin-shared/`

Update tất cả imports:
```bash
# Find all imports
grep -rn "from.*modules/shared" src/ app/ --include="*.ts" --include="*.tsx"
```
Thay: `@/modules/shared` → `@/modules/admin-shared`

Chạy `npx tsc --noEmit` để confirm không có lỗi trước khi tiếp tục.

### Bước 2.1 — Tạo `src/shared/` với cùng cấu trúc

```
src/shared/
├── components/
│   ├── ui/
│   └── (các component khác)
├── hooks/
├── providers/
├── services/      ← tạm thời, sẽ phân tán ở bước 2.4
├── types/
└── utils/
```

### Bước 2.2 — Move toàn bộ nội dung `src/common/` → `src/shared/`

Move từng subfolder (không rename file, chỉ đổi path):

```
src/common/components/ → src/shared/components/
src/common/hooks/      → src/shared/hooks/
src/common/providers/  → src/shared/providers/
src/common/services/   → src/shared/services/   (tạm thời)
src/common/types/      → src/shared/types/
src/common/utils/      → src/shared/utils/
```

### Bước 2.3 — Update path alias trong `tsconfig.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

**Giữ lại `@/common/*` alias** song song trong 1-2 ngày nếu cần rollback nhanh, xóa ở Phase 8.

### Bước 2.4 — Global find-replace imports

```bash
# Tìm tất cả import cũ
grep -rn "from.*@/common/" src/ app/ --include="*.ts" --include="*.tsx"
```

Thay toàn bộ: `@/common/` → `@/shared/`

### Bước 2.5 — Phân tán `src/shared/services/` về đúng modules

> ⚠️ **Verify**: `src/common/services/api.service.ts` không tồn tại (codegraph stale). Danh sách thực tế:

| File hiện tại | Đích mới | Lý do |
|---|---|---|
| `notification.service.ts` | `src/modules/notifications/services/` | Thuộc notifications feature |
| `imageService.ts` | `src/shared/utils/imageService.ts` | Utility cross-module |
| `locationService.ts` | `src/shared/services/locationService.ts` | Giữ, dùng cho address picker |
| `account-switcher.service.ts` | `src/modules/auth/services/` | Auth/session feature |
| `recent-logins.service.ts` | `src/modules/auth/services/` | Auth/session feature |

Tạo `src/modules/notifications/` nếu chưa tồn tại:
```
src/modules/notifications/
├── components/
│   └── NotificationPanel.tsx    ← move từ shared/components/
└── services/
    └── notification.service.ts  ← move từ shared/services/
```

> 📌 **Lưu ý về `src/modules/shared/`:** Đây là module khác với `src/shared/` sẽ tạo ở Phase này.
> - `src/shared/` (mới) = cross-cutting hooks, utils, common UI components
> - `src/modules/shared/` (đã có) = admin components (Dashboard, Users, Workflows, Permissions, KanbanBoard)
> Hai folder tồn tại song song, không xung đột về path.

### Bước 2.6 — Phân tán components sai chỗ trong `src/shared/components/`

| File | Đích mới | Lý do |
|---|---|---|
| `AdminGuard.tsx` | `src/modules/auth/guards/` | Auth concern |
| `TokenHandler.tsx` | `src/modules/auth/shared/components/` | Auth concern |
| `NotificationPanel.tsx` | `src/modules/notifications/components/` | Feature component |

Các component sau **GIỮ LẠI** trong `src/shared/components/` (dùng cross-module thực sự):
```
AssigneePicker.tsx
PriorityPicker.tsx
StatusPicker.tsx
TypePicker.tsx
CustomDatePicker.tsx
ThemeSwitcher.tsx
FontSizeControl.tsx
withPermission.tsx
ui/ (Badge, Button, Input, Modal)
```

### Bước 2.7 — Xóa `src/common/`

Sau khi đã move hết và không còn import nào trỏ về `src/common/`.

### Verification Phase 2

```bash
grep -rn "@/common/" src/ app/ --include="*.ts" --include="*.tsx"
# Output phải rỗng (hoặc chỉ còn alias cũ trong tsconfig)

npx tsc --noEmit
npm run lint
npm run build
```

---

## Phase 3 — Consolidate Hooks

**Context:** Hooks hiện nằm ở 3 layer không nhất quán:
- `src/hooks/` — root level (realtime + 3 generic hooks)
- `src/shared/hooks/` — cross-module hooks (sau Phase 2)
- `src/modules/*/hooks/` — module-level hooks

**Rule mới:**
- `src/shared/hooks/` — hook dùng ≥2 module không liên quan, không có module owner
- `src/lib/realtime/hooks/` — tất cả realtime hooks (infrastructure)
- `src/lib/realtime/utils/` — tất cả realtime cache utils
- `src/modules/*/hooks/` — hook thuộc module đó

**Depends on:** Phase 2

**Branch:** `refactor/phase-3-hooks`

### Bước 3.1 — Tạo `src/lib/realtime/`

```
src/lib/realtime/
├── hooks/
└── utils/
```

### Bước 3.2 — Move realtime hooks `src/hooks/realtime/` → `src/lib/realtime/`

**Hooks:**
```
src/hooks/realtime/use-task-realtime.ts              → src/lib/realtime/hooks/
src/hooks/realtime/use-task-detail-realtime.ts       → src/lib/realtime/hooks/
src/hooks/realtime/use-task-detail-realtime-room.ts  → src/lib/realtime/hooks/
src/hooks/realtime/use-sprint-realtime.ts            → src/lib/realtime/hooks/
src/hooks/realtime/use-workspace-realtime.ts         → src/lib/realtime/hooks/
src/hooks/realtime/use-notification-realtime.ts      → src/lib/realtime/hooks/
src/hooks/realtime/use-socket.ts                     → src/lib/realtime/hooks/
```

**Utils:**
```
src/hooks/realtime/task-realtime-cache.utils.ts       → src/lib/realtime/utils/
src/hooks/realtime/task-detail-cache.utils.ts         → src/lib/realtime/utils/
src/hooks/realtime/task-realtime.mapper.ts            → src/lib/realtime/utils/
src/hooks/realtime/sprint-realtime-cache.utils.ts     → src/lib/realtime/utils/
src/hooks/realtime/workspace-realtime-cache.utils.ts  → src/lib/realtime/utils/
```

### Bước 3.3 — Move generic hooks `src/hooks/` → `src/shared/hooks/`

```
src/hooks/useFontSize.ts    → src/shared/hooks/
src/hooks/usePageTitle.ts   → src/shared/hooks/
src/hooks/useTheme.ts       → src/shared/hooks/
```

### Bước 3.4 — `src/hooks/useWorkspaceSocket.ts`

Kiểm tra hook này làm gì:
```bash
cat src/hooks/useWorkspaceSocket.ts
```
- Nếu chỉ setup socket connection → `src/lib/realtime/hooks/`
- Nếu có workspace business logic → `src/modules/workspace/hooks/`

### Bước 3.5 — Update tất cả imports

```bash
grep -rn "from.*@/hooks/" src/ app/ --include="*.ts" --include="*.tsx"
grep -rn "from.*hooks/realtime" src/ app/ --include="*.ts" --include="*.tsx"
```

Thay đổi:
- `@/hooks/realtime/use-X` → `@/lib/realtime/hooks/use-X`
- `@/hooks/realtime/X-cache.utils` → `@/lib/realtime/utils/X-cache.utils`
- `@/hooks/useFontSize` → `@/shared/hooks/useFontSize`

### Bước 3.6 — Xóa `src/hooks/`

Sau khi toàn bộ đã được move và imports đã update.

### Verification Phase 3

```bash
grep -rn "@/hooks/" src/ app/ --include="*.ts" --include="*.tsx"
# Output phải rỗng

npx tsc --noEmit
npm run lint
```

---

## Phase 4 — Normalize Stores

**Context:** `workspaceStore` ở `src/stores/` (root-level), auth stores ở trong module — không nhất quán về quy tắc.

**Rule mới:**
- `src/stores/` — stores dùng bởi ≥2 module không liên quan → chỉ `workspaceStore` thỏa điều kiện hiện tại
- `src/modules/*/stores/` — stores của riêng module → auth stores đang đúng chỗ

**Depends on:** Phase 2

**Branch:** `refactor/phase-4-stores`

### Bước 4.1 — Kiểm tra toàn bộ Zustand stores hiện có

```bash
grep -rn "create<" src/ --include="*.ts" --include="*.tsx" -l
```

Liệt kê tất cả stores, xác định module owner của từng cái.

### Bước 4.2 — Audit `src/stores/workspaceStore.ts`

File này re-export type từ `modules/client/workspaces/types/workspace.type.ts`. Sau Phase 7 (rename workspace module), cần update import path:

```typescript
// Trước (sẽ cần sửa ở Phase 7)
import type { Workspace } from "@/modules/client/workspaces/types/workspace.type"

// Sau
import type { Workspace } from "@/modules/workspace/shared/types/workspace.type"
```

**Không cần làm gì thêm ở Phase 4** — `workspaceStore.ts` đúng chỗ rồi. Phase này chủ yếu là audit và cập nhật import path (chuẩn bị cho Phase 7).

### Bước 4.3 — Nếu phát hiện store nào đang ở sai chỗ (từ bước 4.1)

Ví dụ: nếu có store nào ở `src/stores/` mà chỉ dùng trong một module → move vào module đó.

### Verification Phase 4

```bash
npx tsc --noEmit
```

---

## Phase 5 — Consolidate API Config

**Context:** 4+ file liên quan đến API config/axios rải rác không rõ vai trò.

**Depends on:** Phase 2

**Branch:** `refactor/phase-5-api-config`

### Hiện trạng (đã verify thực tế)

> ⚠️ **Codegraph stale:** `src/config/api.ts`, `src/shared/utils/api.ts`, `src/shared/utils/axios.ts`, `src/shared/services/api.service.ts` — **đều không tồn tại** trên filesystem.

| File | Vai trò thực tế |
|------|-----------------|
| `src/lib/axiosIns.ts` | ✅ Axios instance — ĐÃ TỒN TẠI, đã centralized |
| `src/config/apiRoutes.ts` | Route path strings |
| `src/config/config.ts` | App config (import từ envConfig) |
| `src/config/envConfig.ts` | Env vars |

**Axios đã centralized tại `src/lib/axiosIns.ts`.** Mục tiêu Phase 5 là dọn dẹp `config/config.ts` + `config/envConfig.ts`, không phải di chuyển axios nữa.

### Bước 5.1 — Đọc và phân loại file thực tế

```bash
cat src/config/config.ts
cat src/config/envConfig.ts
cat src/lib/axiosIns.ts
```

### Bước 5.2 — Gộp env config

Gộp `src/config/envConfig.ts` + `src/config/config.ts` → `src/config/env.ts`:

```typescript
// src/config/env.ts — tất cả env vars ở một chỗ
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL!,
  // ... tất cả env vars khác
}
```

Xóa `envConfig.ts` và `config.ts` sau khi đã update imports.

### Bước 5.3 — Axios đã ở đúng chỗ — chỉ verify

Axios instance đã tồn tại tại `src/lib/axiosIns.ts`. Kiểm tra các pages còn import axios từ nơi khác không:

```bash
grep -rn "from.*config/api\|from.*utils/axios\|import axios" src/ app/ --include="*.ts" --include="*.tsx" | grep -v "axiosIns\|node_modules"
# Nếu rỗng → không cần làm gì thêm
```

Nếu còn import cũ → redirect về `@/lib/axiosIns`.

### Bước 5.4 — Giữ `src/config/apiRoutes.ts` nguyên vẹn

File này đúng chỗ — tất cả route path strings ở một nơi.

### Bước 5.5 — Xóa files đã gộp

```
XÓA: src/config/config.ts      (sau khi đã update tất cả imports về env.ts)
XÓA: src/config/envConfig.ts   (sau khi đã update tất cả imports về env.ts)
```

> `src/shared/utils/axios.ts`, `src/shared/utils/api.ts`, `src/shared/services/api.service.ts` — không tồn tại, bỏ qua.

### Bước 5.6 — Update tất cả imports

```bash
grep -rn "from.*config/config" src/ --include="*.ts" --include="*.tsx"
grep -rn "from.*envConfig" src/ --include="*.ts" --include="*.tsx"
grep -rn "from.*utils/axios" src/ --include="*.ts" --include="*.tsx"
grep -rn "from.*api.service" src/ --include="*.ts" --include="*.tsx"
```

### Verification Phase 5

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## Phase 6 — Eliminate AuthContext Wrapper

**Context:** `src/context/AuthContext.tsx` là một lớp React Context wrap thừa trên `modules/auth/shared/hooks/useAuth`. Re-expose gần như y hệt cùng API nhưng qua Context, tạo hai nguồn truth cho auth state.

**Depends on:** Phase 2, Phase 4 (phải hoàn toàn done — xem note bên dưới)

**Branch:** `refactor/phase-6-auth-context`

> ⚠️ **Prerequisite check:** Phase 4 có thể phát hiện store cần move (bước 4.3). Nếu `permissionStore` hoặc bất kỳ store nào liên quan đến auth bị di chuyển trong Phase 4, Phase 6 sẽ cần update đích import. Luôn verify Phase 4 commit đã merged và stable trước khi bắt đầu branch này.

⚠️ **Phase rủi ro cao — làm từng bước, commit thường xuyên.**

### Bước 6.1 — Audit toàn bộ consumers của AuthContext

```bash
grep -rn "from.*context/AuthContext" src/ app/ --include="*.ts" --include="*.tsx"
grep -rn "from.*@/context" src/ app/ --include="*.ts" --include="*.tsx"
grep -rn "useAuth" src/ app/ --include="*.ts" --include="*.tsx" | grep -v "modules/auth"
```

Lập danh sách đầy đủ tất cả file dùng `useAuth()` từ Context.

### Bước 6.2 — So sánh API của Context vs module hook

**AuthContext hiện cung cấp:**
```typescript
token: string | null
user: User | null
isAuthenticated: boolean
isLoading: boolean
login: (token?: string) => Promise<void>
logout: () => Promise<void>
hasAdminAccess: () => boolean         ← THIẾU trong module hook
hasPermission: (r, a) => boolean      ← THIẾU trong module hook
fetchUserPermissions: () => Promise   ← THIẾU trong module hook
isLoadingPermissions: boolean
verifyToken: () => Promise<void>      ← = refreshUser() trong module hook
```

### Bước 6.3 — Bổ sung methods thiếu vào `src/modules/auth/shared/hooks/useAuth.ts`

Thêm vào return của `useAuth()`:

```typescript
const hasPermission = (resource: string, action: string): boolean => {
  if (!user) return false
  if (user.role === 'super_admin' || user.role === 'admin') return true
  return globalPermissions.some(
    p => (p.resource === resource || p.resource === '*') &&
         (p.action === action || p.action === '*')
  )
}

const hasAdminAccess = (): boolean => {
  if (!user) return false
  return user.role === 'super_admin' || user.role === 'admin' || globalPermissions.length > 0
}

// Return thêm:
return {
  // ...existing
  hasPermission,
  hasAdminAccess,
  fetchUserPermissions,  // đã có trong permissionStore, expose lên đây
}
```

### Bước 6.4 — Update consumers từng file một

Với mỗi file tìm được ở bước 6.1:

```typescript
// BEFORE
import { useAuth } from "@/context/AuthContext"

// AFTER
import { useAuth } from "@/modules/auth/shared/hooks/useAuth"
```

Chạy `npx tsc --noEmit` sau mỗi file.

### Bước 6.5 — Remove `AuthProvider` khỏi `app/layout.tsx`

`AuthProvider` từ Context không còn cần thiết vì Zustand không cần Provider. Xóa khỏi layout:

```tsx
// BEFORE
<AuthProvider>
  <QueryProvider>
    {children}
  </QueryProvider>
</AuthProvider>

// AFTER
<QueryProvider>
  {children}
</QueryProvider>
```

### Bước 6.6 — Xóa `src/context/`

```
XÓA: src/context/AuthContext.tsx
XÓA: src/context/              (folder)
```

### Verification Phase 6

```bash
grep -rn "from.*context/AuthContext" src/ app/ --include="*.ts" --include="*.tsx"
grep -rn "AuthProvider" src/ app/ --include="*.ts" --include="*.tsx"
# Cả hai output phải rỗng

npx tsc --noEmit
npm run lint
npm run test -- --passWithNoTests --forceExit
npm run build
# Test thủ công: login, logout, permission check, hasPermission guard
```

---

## Phase 7a — Workspace Module: Types / Utils / Services / Siblings

**Context:** Bước đầu của việc extract `src/modules/client/workspaces/`. Phase này chỉ move các layer ít dependency nhất (types, utils, services, hooks) và các module anh em (docs, profile, invites). Không move component layer.

**Depends on:** Phase 2, Phase 3

**Branch:** `refactor/phase-7a-workspace-foundation`

> Cấu trúc mục tiêu cuối cùng của `src/modules/workspace/` xem bên dưới.

### Cấu trúc mục tiêu `src/modules/workspace/` (tham chiếu cho cả 7a/7b/7c)

```
src/modules/workspace/
├── board/         (7b)
├── tasks/         (7b + 7c)
├── sprint/        (7b)
├── members/       (7b)
├── timeline/      (7b)
├── calendar/      (7b)
├── archive/       (7b)
├── list/          (7b)
└── shared/
    ├── components/ (7b)
    ├── hooks/      (7a)
    ├── services/   (7a)
    ├── types/      (7a)  ← bắt đầu đây
    ├── utils/      (7a)
    └── constants/  (7a)
```

### Bước 7a.1 — Tạo skeleton folder

```bash
mkdir -p src/modules/workspace/shared/{types,utils,services,hooks,constants}
```

### Bước 7a.2 — Move `shared/types/`

```
src/modules/client/workspaces/types/ → src/modules/workspace/shared/types/
```

Chạy `npx tsc --noEmit` → fix imports → commit.

### Bước 7a.3 — Move `shared/utils/`

```
src/modules/client/workspaces/utils/ → src/modules/workspace/shared/utils/
```

Chạy `npx tsc --noEmit` → fix → commit.

### Bước 7a.4 — Move `shared/services/` và `shared/hooks/`

```
src/modules/client/workspaces/services/ → src/modules/workspace/shared/services/
src/modules/client/workspaces/hooks/    → src/modules/workspace/shared/hooks/
```

Chạy `npx tsc --noEmit` → fix → commit.

### Bước 7a.5 — Move `shared/constants/`

```
src/modules/client/workspaces/constants/ → src/modules/workspace/shared/constants/
```

### Bước 7a.6 — Update `src/stores/workspaceStore.ts`

```typescript
// Cập nhật import path
import type { Workspace } from "@/modules/workspace/shared/types/workspace.type"
```

### Bước 7a.7 — Move modules anh em trong `src/modules/client/`

```
src/modules/client/docs/     → src/modules/docs/
src/modules/client/for-you/  → src/modules/for-you/
src/modules/client/profile/  → src/modules/profile/
src/modules/client/invites/  → src/modules/invites/
```

### Bước 7a.8 — Verify `src/modules/client/common/` consumers trước khi move

```bash
grep -rn "modules/client/common" src/ app/ --include="*.ts" --include="*.tsx"
```

Lập danh sách đầy đủ tất cả file import từ `client/common` (header, footer, layout). Sẽ move ở Phase 7c.

### Verification Phase 7a

```bash
npx tsc --noEmit
npm run lint
npm run test -- --passWithNoTests --forceExit
# Test thủ công: workspace list, board load
```

---

## Phase 7b — Workspace Module: Feature Sub-domains (low dependency)

**Context:** Move các sub-domain ít cross-dependency: timeline, calendar, archive, list, sprint, members, tasks/covers, tasks/labels, tasks/attachments, tasks/create. Không touch board và tasks/detail.

**Depends on:** Phase 7a

**Branch:** `refactor/phase-7b-workspace-subdomains`

### Bước 7b.1 — Tạo skeleton sub-domain folders

```bash
mkdir -p src/modules/workspace/{timeline/{components,utils,services},calendar/{components,hooks,services},archive/{components,utils},list/components,sprint/{components,hooks,services},members/{components,services}}
mkdir -p src/modules/workspace/tasks/{covers/{components,hooks,services},labels/{components,services},attachments/{components,hooks,services},create/components}
```

### Bước 7b.2 — Move từng sub-domain (theo thứ tự)

Với **mỗi** sub-domain: move → `npx tsc --noEmit` → fix → commit riêng.

```
timeline/   → src/modules/workspace/timeline/
calendar/   → src/modules/workspace/calendar/
archive/    → src/modules/workspace/archive/
list/       → src/modules/workspace/list/
sprint/     → src/modules/workspace/sprint/
members/    → src/modules/workspace/members/
tasks/covers/      → src/modules/workspace/tasks/covers/
tasks/labels/      → src/modules/workspace/tasks/labels/
tasks/attachments/ → src/modules/workspace/tasks/attachments/
tasks/create/      → src/modules/workspace/tasks/create/
```

### Bước 7b.3 — Move `shared/components/` (workspace cross-cutting UI)

```
src/modules/client/workspaces/components/shared/ → src/modules/workspace/shared/components/
```

Chạy `npx tsc --noEmit` → fix → commit.

### Verification Phase 7b

```bash
npx tsc --noEmit
npm run lint
npm run test -- --passWithNoTests --forceExit
# Test thủ công: timeline view, calendar, sprint, task covers/labels/attachments
```

---

## Phase 7c — Workspace Module: Board, Tasks/Detail + Final Cleanup

**Context:** Board và tasks/detail là phần nhiều dependency nhất (nhiều component, nhiều hooks cross-reference). Làm cuối cùng khi toàn bộ shared foundation đã ổn định.

**Depends on:** Phase 7b

**Branch:** `refactor/phase-7c-workspace-board-final`

### Bước 7c.1 — Move `board/`

```
src/modules/client/workspaces/components/board/ → src/modules/workspace/board/
```

Chạy `npx tsc --noEmit` → fix mọi cross-import → commit.

### Bước 7c.2 — Move `tasks/detail/`

```
src/modules/client/workspaces/components/task-detail/ → src/modules/workspace/tasks/detail/
```

Chạy `npx tsc --noEmit` → fix → commit.

### Bước 7c.3 — Move `src/modules/client/common/` (header, footer, layout)

Verify consumers (từ bước 7a.8):
```bash
grep -rn "modules/client/common" src/ app/ --include="*.ts" --include="*.tsx"
```

Move:
```
modules/client/common/header/ → src/shared/components/layout/header/
modules/client/common/footer/ → src/shared/components/layout/footer/
modules/client/common/layout/ → src/shared/components/layout/
modules/client/common/account-switcher/ → src/shared/components/layout/
modules/client/common/back-to-top/      → src/shared/components/
```

### Bước 7c.4 — Xóa `src/modules/client/`

```bash
grep -rn "modules/client/" src/ app/ --include="*.ts" --include="*.tsx"
# Phải rỗng trước khi xóa
```

### Bước 7c.5 — Update imports trong `app/` pages

```bash
grep -rn "modules/client/workspaces" app/ --include="*.ts" --include="*.tsx"
```

Thay tất cả `@/modules/client/workspaces/` → `@/modules/workspace/`

### Verification Phase 7c

```bash
grep -rn "modules/client/" src/ app/ --include="*.ts" --include="*.tsx"
# Phải rỗng

npx tsc --noEmit
npm run lint
npm run test -- --passWithNoTests --forceExit
npm run build
# Test thủ công: mở workspace, board, sprint, task detail, timeline, calendar
```

---

## Phase 8 — Final Cleanup & Alias Update

**Context:** Dọn dẹp cuối cùng sau khi tất cả phases hoàn thành.

**Depends on:** Phase 0-7

**Branch:** `refactor/phase-8-cleanup`

### Bước 8.1 — Update `tsconfig.json` — xóa alias cũ, thêm alias mới

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Kiểm tra alias nào hay dùng nhất và cân nhắc thêm shortcuts:
```json
{
  "@/shared/*": ["./src/shared/*"],
  "@/modules/*": ["./src/modules/*"],
  "@/lib/*": ["./src/lib/*"],
  "@/config/*": ["./src/config/*"]
}
```

### Bước 8.2 — Xóa alias `@/common/*` nếu còn

```bash
grep -rn "@/common/" src/ app/ --include="*.ts" --include="*.tsx"
# Phải rỗng trước khi xóa alias
```

### Bước 8.3 — Dọn `next.config.js` vs `next.config.ts`

Hiện có cả hai file cùng tồn tại. Xóa `next.config.js`, giữ `next.config.ts`.

### Bước 8.4 — Kiểm tra không còn `console.log` stray

```bash
grep -rn "console.log" src/ --include="*.ts" --include="*.tsx"
```

### Bước 8.5 — Final check toàn diện

```bash
# TypeScript
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build

# Tests
npm run test -- --passWithNoTests --forceExit
```

### Bước 8.6 — Cập nhật `MEMORY.md` và documentation

Cập nhật `CLAUDE.md` phản ánh cấu trúc mới:
- `src/modules/workspace/` thay cho `src/modules/client/workspaces/`
- `src/shared/` thay cho `src/common/`
- `src/lib/realtime/` thay cho `src/hooks/realtime/`

---

## Quick Reference — Rules sau refactor

| Loại code | Đặt ở đâu |
|-----------|-----------|
| Feature component/hook/service | `src/modules/<feature>/` |
| UI component dùng nhiều module | `src/shared/components/` |
| Hook dùng nhiều module | `src/shared/hooks/` |
| Axios instance | `src/lib/axios/instance.ts` |
| Socket client | `src/lib/socket/` |
| Realtime hooks & utils | `src/lib/realtime/` |
| Global store (≥2 module) | `src/stores/` |
| Module store | `src/modules/<feature>/stores/` |
| Env vars | `src/config/env.ts` |
| API route strings | `src/config/apiRoutes.ts` |
| Page shells | `app/` (root level) |

## Câu hỏi để tự kiểm tra khi thêm file mới

1. **"File này dùng cho một feature hay nhiều feature?"**
   - Một → `src/modules/<feature>/`
   - Nhiều → `src/shared/` hoặc `src/lib/`

2. **"File này là business logic hay infrastructure?"**
   - Business → `src/modules/` hoặc `src/shared/`
   - Infrastructure (http, socket, cache) → `src/lib/`

3. **"Store này dùng ở bao nhiêu module?"**
   - ≥2 module không liên quan → `src/stores/`
   - 1 module → `src/modules/<feature>/stores/`
