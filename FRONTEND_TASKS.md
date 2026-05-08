# Chi Tiết Các Task Frontend (AL-TASK)

Tài liệu này phân tích chi tiết từng task cần thực hiện cho dự án AL-TASK, tuân thủ nghiêm ngặt **Workflow 6 bước** (Understanding, Assumptions, Steps, Plan, Execution, Validation).

---

## Nhóm 1: Quản lý Issue / Task (Nâng cao)

### Task 1.1: Sub-tasks (Parent - Child Hierarchy)

✅ **Understanding:** Xây dựng giao diện quản lý Sub-task bên trong Issue Detail Modal. Yêu cầu hiển thị danh sách dạng bảng, ô nhập liệu để tạo nhanh sub-task mới, và thanh tiến độ (Progress Bar) tính % hoàn thành dựa trên trạng thái "Done".

📌 **Assumptions:**
- `parentIssue` có chứa mảng `subtasks[]` theo interface `{ id, title, status, priority }`.
- Dự án sử dụng Tailwind CSS, giao diện cần đồng nhất với Jira (Dark theme support).
- Mức độ đệ quy (nếu có) thường giới hạn ở 1 cấp (Story -> Subtask).

🧩 **Steps:**
1. Thiết kế component `SubtaskList` nhận prop `subtasks`.
2. Tính toán tỷ lệ hoàn thành: `(done_subtasks / total_subtasks) * 100`.
3. Render Progress Bar với màu xanh lá cho phần hoàn thành.
4. Render danh sách subtask dạng table/list rút gọn.
5. Xây dựng form "Tạo nhanh" (Quick Create) bắt sự kiện phím `Enter`.

🛠️ **Plan:** 
Tạo một component riêng biệt `IssueSubtasks.tsx`. Dùng `useMemo` để tính toán phần trăm hoàn thành. Cập nhật state cục bộ khi tạo sub-task mới trước khi gọi API để UI phản hồi nhanh (Optimistic UI).

💻 **Code (Outline):**
```tsx
const IssueSubtasks = ({ subtasks, onAdd }) => {
  const [newTitle, setNewTitle] = useState("");
  const doneCount = subtasks.filter(t => t.status === "Done").length;
  const percent = subtasks.length === 0 ? 0 : Math.round((doneCount / subtasks.length) * 100);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && newTitle.trim()) {
      onAdd(newTitle);
      setNewTitle("");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sub-tasks</h3>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
      </div>
      <div className="flex flex-col gap-2">
        {subtasks.map(task => <SubtaskItem key={task.id} task={task} />)}
        <input 
          value={newTitle} 
          onChange={e => setNewTitle(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder="Thêm sub-task..." 
          className="w-full p-2 border rounded bg-transparent dark:border-gray-600 dark:text-white"
        />
      </div>
    </div>
  );
};
```

✅ **Validation:**
- Test case: Không có subtask (0%).
- Test case: Nhập title trống bấm Enter (không được tạo).
- Test case: Update status 1 task sang Done -> Progress Bar phải chạy.

---

### Task 1.2: Time Tracking & Log Work

✅ **Understanding:** Thêm tính năng quản lý thời gian vào Sidebar của Issue Modal. Cần viết hàm parse chuỗi thời gian, render Progress bar (thời gian đã log vs thời gian dự kiến), và tạo Modal "Log work" để nhập số giờ.

📌 **Assumptions:**
- `timeEstimated` là string (VD: "2d 4h"), `timeLogged` là số phút (number).
- 1 ngày (d) = 8 giờ (h), 1 giờ (h) = 60 phút (m).

🧩 **Steps:**
1. Viết 2 hàm helper: `parseTimeStringToMinutes` và `formatMinutesToTimeString`.
2. Xây dựng component `TimeTrackingSidebar`.
3. Render Progress bar với 2 đoạn màu: Đã làm (xanh) và Còn lại (xám/cam).
4. Tạo Modal `LogWorkModal` nhận input thời gian và mô tả.

🛠️ **Plan:** 
Sử dụng Regex `/(\d+)([dhm])/g` để bóc tách chuỗi thời gian. Tính toán tỷ lệ phần trăm để render thanh tiến độ.

💻 **Code (Helper Outline):**
```typescript
export const parseTimeToMinutes = (timeStr: string): number => {
  let minutes = 0;
  const regex = /(\d+)([dhm])/g;
  let match;
  while ((match = regex.exec(timeStr.toLowerCase())) !== null) {
    const val = parseInt(match[1]);
    const unit = match[2];
    if (unit === 'd') minutes += val * 8 * 60;
    if (unit === 'h') minutes += val * 60;
    if (unit === 'm') minutes += val;
  }
  return minutes;
};
```

✅ **Validation:**
- Input hợp lệ: "1d 2h", "90m", "1h 30m".
- Input không hợp lệ: "abc", "1x 2y" -> Hàm trả về 0 hoặc throw error.
- Progress bar không được vượt quá 100% về mặt UI nếu log vượt estimate.

---

## Nhóm 2: Kanban Board & Bộ lọc

### Task 2.1: Custom Filters (Quick Filters)

✅ **Understanding:** Nâng cấp Header của Kanban Board để lọc issues theo tiêu đề/key, Assignee (click vào avatar), và Priority. Cần lọc trực tiếp trên client để phản hồi tức thì.

📌 **Assumptions:**
- Đã có mảng `issues[]` và `members[]` từ state/store của Space.
- Các bộ lọc kết hợp với nhau theo logic **AND**.

🧩 **Steps:**
1. Tạo UI thanh filter: `<input search />`, danh sách Avatar, Select dropdown cho Priority.
2. Khai báo state cục bộ `filters = { search: '', assignee: null, priority: null }`.
3. Dùng `useMemo` để lọc danh sách `issues` gốc thành `filteredIssues`.
4. Truyền `filteredIssues` xuống component render Board.

🛠️ **Plan:** 
Sử dụng `useMemo` để tránh filter lại khi không cần thiết. Đảm bảo logic filter xử lý tốt chuỗi rỗng và giá trị null.

💻 **Code (Logic Outline):**
```tsx
const [filters, setFilters] = useState({ search: "", assigneeId: null, priority: null });

const filteredIssues = useMemo(() => {
  return issues.filter(issue => {
    const matchSearch = issue.title.toLowerCase().includes(filters.search.toLowerCase()) 
                     || issue.key.toLowerCase().includes(filters.search.toLowerCase());
    const matchAssignee = filters.assigneeId ? issue.assigneeId === filters.assigneeId : true;
    const matchPriority = filters.priority ? issue.priority === filters.priority : true;
    
    return matchSearch && matchAssignee && matchPriority;
  });
}, [issues, filters]);
```

✅ **Validation:**
- Click avatar -> Chỉ hiện task của người đó.
- Nhập search trùng key -> Hiện 1 task duy nhất.
- Bật đồng thời 3 filter -> Logic AND chạy đúng.

---

## Nhóm 3: Quản lý Tài Liệu (Confluence-style)

### Task 3.1: Page Tree Sidebar

✅ **Understanding:** Sidebar chứa cây thư mục đa cấp cho các trang tài liệu. Yêu cầu render theo độ thụt lề (indentation), cho phép đóng/mở (toggle) thư mục cha, và kéo thả (dnd-kit) để thay đổi cấp bậc/thứ tự.

📌 **Assumptions:**
- Dữ liệu `pages` có cấu trúc đệ quy: `{ id, title, children: [] }`.

🧩 **Steps:**
1. Tạo component `TreeNode` đệ quy để render chính nó cho mỗi mảng `children`.
2. Thêm state `isExpanded` cho từng node cha.
3. Tích hợp `@dnd-kit/core` và `SortableTree` để xử lý sự kiện kéo thả.
4. Viết hàm update lại cấu trúc cây sau khi kéo thả xong.

🛠️ **Plan:** 
Viết logic đệ quy tách biệt. Do DOM lồng nhau phức tạp với dnd-kit, sẽ dùng cấu trúc Flatten Tree (làm phẳng cây đệ quy ra mảng 1 chiều kèm thông tin độ sâu - depth) để `@dnd-kit/sortable` dễ xử lý hơn.

💻 **Code (Flatten Tree Logic):**
```tsx
// Chuyển tree đệ quy thành mảng 1 chiều để render dnd-kit
const flattenTree = (items, depth = 0) => {
  return items.reduce((acc, item) => {
    return [...acc, { ...item, depth }, ...flattenTree(item.children || [], depth + 1)];
  }, []);
};
```

✅ **Validation:**
- Cây có 5 cấp (depth=5) vẫn thụt lề chính xác.
- Kéo con ra khỏi cha -> con trở thành cấp root.
- State đóng/mở không bị reset khi kéo thả.

---

## Nhóm 4: Collaboration (Tương tác Team)

### Task 4.1: Comments & @Mentions

✅ **Understanding:** Khung comment hỗ trợ gõ `@` để mở popup danh sách user. Chọn user xong thì highlight chữ và lưu dạng format đặc biệt.

📌 **Assumptions:**
- Danh sách `users` có thể mention được lấy từ thành viên trong Space.

🧩 **Steps:**
1. Phân tích: Dùng thư viện `react-mentions` sẽ tiết kiệm thời gian, còn tự build bằng `contenteditable` sẽ mất nhiều nỗ lực bắt tọa độ con trỏ (caret).
2. Quyết định: Dùng `react-mentions` kết hợp Tailwind để custom style.
3. Khi lưu vào DB, text có dạng `[@username](userId)`.
4. Khi render UI, regex bắt pattern trên để hiển thị dưới dạng thẻ `<a>` màu xanh.

🛠️ **Plan:** 
Sử dụng `react-mentions` vì chi phí tự viết logic đo tọa độ x,y của text cursor trong textarea là rất lớn (trade-off). Render comment bằng thư viện Markdown nhỏ.

💻 **Code (Outline):**
```tsx
import { MentionsInput, Mention } from 'react-mentions';

const CommentBox = ({ users }) => {
  const [value, setValue] = useState("");

  return (
    <MentionsInput value={value} onChange={(e) => setValue(e.target.value)}>
      <Mention
        trigger="@"
        data={users.map(u => ({ id: u.id, display: u.username }))}
        markup="[@__display__](__id__)"
        className="text-indigo-600 bg-indigo-50 rounded px-1"
      />
    </MentionsInput>
  );
};
```

✅ **Validation:**
- Gõ `@` xuất hiện popup.
- Gõ `@admin` lọc đúng danh sách người dùng tên admin.
- Format lưu xuống đúng chuẩn markup.

---

## Nhóm 5: Global Search & Notifications

### Task 5.1: Advanced Search với JQL (Jira Query Language) cơ bản

✅ **Understanding:** Thanh tìm kiếm toàn cục hỗ trợ cú pháp `key:value` (VD: `status:"Done"`). Khi gõ sẽ có Autocomplete gợi ý từ khóa (assignee, status, priority).

📌 **Assumptions:**
- Các từ khóa hỗ trợ: `assignee:`, `status:`, `priority:`.
- Dữ liệu gợi ý được fetch nhanh từ client hoặc cache.

🧩 **Steps:**
1. Xây dựng ô Search Input.
2. Lắng nghe sự kiện `onChange`. Bóc tách text hiện tại bằng regex.
3. Nếu từ cuối cùng kết thúc bằng chữ `:` (VD `status:`), bung popup gợi ý giá trị (To Do, In Progress, Done).
4. Viết hàm parser để chuyển chuỗi `assignee:me status:Done` thành object filter `{ assignee: "me", status: "Done" }`.

🛠️ **Plan:** 
Tách hàm `parseJQL` thành một utility function thuần túy để dễ unit test. Giao diện Search Bar sẽ dùng debounce để tránh giật lag.

💻 **Code (Parser Outline):**
```typescript
export const parseJQL = (query: string) => {
  const filters: Record<string, string> = {};
  const regex = /(assignee|status|priority):("([^"]+)"|([^\s]+))/g;
  let match;
  
  while ((match = regex.exec(query)) !== null) {
    const key = match[1];
    const value = match[3] || match[4]; // Match string có ngoặc kép hoặc không
    filters[key] = value;
  }
  
  // Phần text không match regex sẽ là text search thông thường
  const textSearch = query.replace(regex, '').trim();
  
  return { filters, textSearch };
};
```

✅ **Validation:**
- Cú pháp: `status:"In Progress" priority:High fix bug` -> `{ filters: { status: "In Progress", priority: "High" }, textSearch: "fix bug" }`.
- Gõ `status:` -> Hiện UI popup gợi ý.
