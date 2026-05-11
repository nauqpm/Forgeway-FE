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

### Task 1.3: Rich Text Editor & Markdown cho Mô tả (Description)

✅ **Understanding:** Xây dựng một khu vực "Description" (Mô tả) có 2 trạng thái:
- **Chế độ Xem (Read-only):** Hiển thị văn bản đã được format (HTML/Markdown), các link có thể click, code block có highlight.
- **Chế độ Sửa (Edit mode):** Khi click vào, biến thành một Editor với:
  - Thanh công cụ (Toolbar): Định dạng text (Bold, Italic), danh sách (List), chèn ảnh, link, emoji.
  - Khối soạn thảo (Editor Area): Hỗ trợ gõ text, có khung hiển thị Code Block chuyên dụng (có line number).
  - Tùy chọn ngôn ngữ/định dạng (Dropdown "Markdown"): Cho phép chọn format cho khối code.
  - Hành động: Nút Save (Lưu) và Cancel (Hủy).

📌 **Assumptions:**
- Do việc tự build một Editor từ đầu cực kỳ tốn thời gian và dễ lỗi (đặc biệt là xử lý con trỏ chuột - cursor focus), giả định bạn sẽ dùng một thư viện mã nguồn mở mạnh mẽ cho React.
- Database của backend (AL-TASK-Backend) chỉ cần lưu trữ nội dung mô tả dưới dạng một chuỗi (chuỗi Markdown hoặc chuỗi HTML).
- Ứng dụng của bạn cần tính bảo mật để tránh lỗi XSS (Cross-Site Scripting) khi render HTML từ người dùng nhập.

🧩 **Steps:**
1. **Lựa chọn Thư viện:**
   - TipTap: (Khuyên dùng nhất cho Fullstack) Rất mạnh, headless (không có UI sẵn nên bạn tự do thiết kế toolbar giống hệt ảnh), hỗ trợ Markdown và CodeBlock với thư viện highlight.js.
   - React-Quill / TinyMCE: Dễ cài đặt, có sẵn UI, nhưng việc tùy biến code-block khó hơn TipTap.
   - UIW React Markdown Editor: Trực quan, thiên hẳn về viết Markdown.
2. **Logic State Management:**
   - Cần một state `isEditing` (boolean) để toggle giữa component Viewer và Editor.
   - Cần state `content` lưu trữ giá trị tạm thời đang gõ. Nếu bấm "Cancel", content quay về giá trị ban đầu. Nếu bấm "Save", gọi API update.

🛠️ **Plan:** 
- **Task 1: Nghiên cứu & Cài đặt Editor Core**
  - Khảo sát và cài đặt thư viện (Ví dụ: `npm install @tiptap/react @tiptap/starter-kit`).
  - Cài đặt thêm plugin cho Code Block (Ví dụ: `@tiptap/extension-code-block-lowlight` để có line number và syntax highlight).
- **Task 2: Build Component DescriptionViewer**
  - Viết component nhận prop là chuỗi HTML/Markdown và render ra màn hình.
  - Sử dụng thư viện DOMPurify để sanitize (làm sạch) chuỗi HTML trước khi render để chống XSS.
  - Bắt sự kiện onClick vào vùng này để đổi state `isEditing = true`.
- **Task 3: Build Component DescriptionEditor**
  - Thiết kế UI cho Toolbar: Thêm các nút bấm (B, I, H1, Code, List...) và gắn sự kiện tương tác với Editor API.
  - Tích hợp tính năng Code Block có dropdown chọn ngôn ngữ (như dropdown "Markdown" trong hình).
  - Thiết kế UI cụm nút "Save" (màu xanh) và "Cancel".
- **Task 4: Tích hợp API (Backend Connection)**
  - Bắt sự kiện nút "Save".
  - Gọi API PATCH `/tasks/:id` với body `{ description: htmlContent }`.
  - Cập nhật state thành công thì đổi `isEditing = false`.

💻 **Code (Gợi ý Technical cho TipTap):**
```jsx
const TaskDescription = ({ task, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempDesc, setTempDesc] = useState(task.description);

  const handleSave = async () => {
    // Gọi Service API đã viết ở phase trước
    await taskService.updateDescription(task.id, tempDesc);
    setIsEditing(false);
    onUpdate(tempDesc);
  };

  const handleCancel = () => {
    setTempDesc(task.description); // Revert lại
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div onClick={() => setIsEditing(true)} className="viewer-container hover:bg-gray-100 p-2 cursor-text rounded">
        {/* Render HTML đã sanitize tại đây */}
        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(task.description) }} />
      </div>
    );
  }

  return (
    <div className="editor-container border border-gray-300 rounded">
      <MyTipTapEditor value={tempDesc} onChange={setTempDesc} />
      <div className="button-group mt-2 flex gap-2">
        <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
        <button onClick={handleCancel} className="text-gray-600 px-3 py-1 rounded">Cancel</button>
      </div>
    </div>
  );
};
```

✅ **Validation:**
- Trải nghiệm hủy (Cancel): Gõ một đoạn text dài, bấm Cancel, mở lại xem đoạn text đó có bị lưu nhầm không.
- Xử lý Code Block: Copy một đoạn code C++ hoặc JS thực tế paste vào khối Code Block xem nó có giữ nguyên định dạng lùi lề (indentation) không. Việc mất lùi lề là lỗi rất phổ biến khi làm Editor.
- Responsive: Thu nhỏ cửa sổ trình duyệt xem thanh Toolbar có bị tràn ra ngoài màn hình không (cần áp dụng flex-wrap cho toolbar).

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

### Task 2.2: Advanced Kanban Board (Kéo thả & Thêm Cột)

✅ **Understanding:** Nâng cấp trang Board hiện tại:
- **Kéo thả Column:** Không chỉ kéo thả task giữa các cột, mà còn thay đổi thứ tự của chính các cột (ví dụ: đổi chỗ cột "TO DO" và "DONE").
- **Thêm Column mới:** Một ô input ở phía bên phải cùng để nhập tên và tạo thêm cột trạng thái mới cho dự án.

📌 **Assumptions:**
- Sử dụng thư viện hỗ trợ kéo thả đa cấp (như `@hello-pangea/dnd`) có khả năng xử lý cả `direction="horizontal"` (cho cột) và `direction="vertical"` (cho task).
- Mỗi cột trong Database có một trường `position` (kiểu số) để lưu thứ tự hiển thị.
- Trạng thái của Task (`status`) sẽ liên kết trực tiếp với tên hoặc ID của Column.

🧩 **Steps:**
1. **Cập nhật Backend (API):**
   - Viết API `PATCH /columns/reorder`: Nhận vào danh sách ID và position mới của các cột.
   - Viết API `POST /columns`: Tạo cột mới với tên và vị trí mặc định ở cuối.
2. **Refactor UI Board (Frontend):**
   - Bao bọc các Column bằng một lớp `Droppable` nằm ngang.
   - Biến mỗi ColumnContainer thành một `Draggable`. Lưu ý: Chỉ nên cho phép kéo ở phần Header của cột để tránh xung đột với việc kéo task bên trong.
3. **Hoàn thiện tính năng Add Column:**
   - Xử lý sự kiện nút "Tick" (Xác nhận) và nút "X" (Hủy) ở ô input thêm cột mới.
   - Tự động scroll sang phải cùng khi một cột mới được thêm vào thành công.

🛠️ **Plan:**
Thực hiện các thay đổi song song giữa API và cấu trúc UI hiện tại. Cần cực kỳ cẩn thận với cơ chế kéo thả lồng nhau (Droppable lồng Droppable) để tránh lỗi thư viện.

💻 **Code (State & Drag logic Outline):**
```javascript
const onDragEnd = (result) => {
  const { destination, source, draggableId, type } = result;

  if (!destination) return;

  // Trường hợp kéo thả CỘT
  if (type === 'column') {
    const newColumnOrder = Array.from(columnOrder);
    newColumnOrder.splice(source.index, 1);
    newColumnOrder.splice(destination.index, 0, draggableId);
    setColumnOrder(newColumnOrder);
    // Gọi API update position columns
    return;
  }

  // Trường hợp kéo thả TASK (giữ nguyên logic cũ)
  // ...
};
```

✅ **Validation:**
- Tránh xung đột: Kiểm tra xem khi kéo một Task, cột có bị "lung lay" hay vô tình bị kéo đi không.
- Dữ liệu trống: Khi tạo một cột mới hoàn toàn, đảm bảo nó hiển thị chữ "0" (số lượng task) và có nút "+ Create" task bên trong như các cột khác.
- Persistence: Load lại trang (F5) để chắc chắn thứ tự cột mới và cột vừa thêm vẫn nằm đúng vị trí.

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

---

## Nhóm 6: Backlog & Sprints Management (Chỉ áp dụng cho các dự án Scrum)

### Task 6.1: Backlog & Sprints Board (Drag & Drop)

✅ **Understanding:** Xây dựng trang Backlog Management — nơi quản lý các Sprint và danh sách công việc tồn đọng (linh hồn của dự án Agile).
- Phân chia khu vực: Khu vực các Sprint (đang đợi hoặc đang chạy) và khu vực Backlog chung.
- Tương tác: Kéo thả task từ Backlog vào Sprint và ngược lại (hoặc giữa các Sprint với nhau).
- Trạng thái Sprint: Có nút "Start Sprint", hiển thị tổng số lượng task/điểm nỗ lực (story points).
- Tạo mới: Cho phép tạo nhanh task ngay tại mỗi khu vực.

📌 **Assumptions:**
- Sử dụng một thư viện Drag & Drop (như `@hello-pangea/dnd` hoặc `dnd-kit`) cho React.
- Database đã có bảng `Tasks`, cần bổ sung/chỉnh sửa bảng `Sprints`.
- Mỗi task tại một thời điểm chỉ thuộc về 1 Sprint hoặc nằm ở Backlog (sprintId = null).

🧩 **Steps:**
1. **Refactor Database & API (Backend):** 
   - Tạo bảng/model Sprint (`id`, `name`, `startDate`, `endDate`, `goal`, `status`).
   - Cập nhật model Task thêm trường `sprintId` và `position`.
   - Viết API `GET /projects/:id/backlog` và API `PATCH /tasks/reorder` (nhận `taskId`, `targetSprintId`, `newPosition`).
2. **Xây dựng UI Component (Frontend):** 
   - `SprintGroup`: Header của Sprint (tên, ngày tháng, trạng thái, nút Start).
   - `TaskItem`: Dòng task nhỏ gọn (icon type, key, title, assignee avatar).
   - `Droppable Container`: Bao bọc khu vực danh sách task của từng Sprint và Backlog.
3. **Logic Kéo thả & State Management:** 
   - Tích hợp thư viện Drag & Drop.
   - Xử lý hàm `onDragEnd` (cùng danh sách đổi position, khác danh sách đổi sprintId). 
   - Cập nhật local state (Optimistic UI) rồi gọi API update.
4. **Tính năng phụ trợ:** Nút "Create Sprint", ô input "Create issue" nhanh dưới mỗi danh sách.

🛠️ **Plan:**
Chia nhỏ việc thành 4 bước thực hiện như phần Steps. Ở phía Frontend, quản lý state cho trang cần phân tách rõ mảng các `sprints` và mảng `backlog`. Dựa vào `source.droppableId` và `destination.droppableId` trong `onDragEnd` để phân biệt hướng kéo thả.

💻 **Code (State & Drag logic Outline):**
```tsx
const [data, setData] = useState({
  sprints: [
    { id: 's1', name: 'Sprint 1', tasks: [] },
    { id: 's2', name: 'Sprint 2', tasks: [] }
  ],
  backlog: [] // Các task có sprintId = null
});

// Trong hàm onDragEnd:
// Dựa vào source.droppableId và destination.droppableId để biết task đi từ đâu đến đâu.
```

✅ **Validation:**
- Kéo task cuối cùng ra khỏi Sprint: Check xem Sprint đó có hiển thị trạng thái "Empty" (0 work items) như Jira không.
- Thứ tự: Load lại trang xem thứ tự task có bị nhảy lung tung không (kiểm tra logic position).
- Tính toán: Các con số 0 0 0 (số task theo trạng thái Todo, Doing, Done) ở header Sprint có cập nhật đúng khi kéo task vào/ra không.

---

### Task 6.2: Backlog Micro-features (Các tính năng chi tiết)

✅ **Understanding:** Bóc tách các thành phần giao diện và logic chức năng siêu nhỏ (micro-features) từ các hình ảnh thực tế của Jira để hoàn thiện trang Backlog:
- **Quản lý Sprint:** Khởi tạo, chỉnh sửa, xóa và theo dõi chỉ số sức khỏe của Sprint.
- **Tương tác vật phẩm (Work Items):** Hiển thị chi tiết hàng task, cập nhật nhanh trạng thái, người thực hiện và điểm nỗ lực.
- **Cấu hình & Bộ lọc:** Tùy chỉnh mật độ hiển thị (Density) và lọc dữ liệu đa điều kiện.

📌 **Assumptions:**
- Hệ thống Backend đã hỗ trợ lưu trữ các trường dữ liệu nâng cao như: `storyPoints` (số thực), `priority` (Enum), và `goal` (Text) của Sprint.
- Sử dụng một thư viện UI Component hoặc CSS framework có khả năng xử lý Modal và Dropdown mượt mà.
- Dữ liệu được cập nhật theo thời gian thực hoặc thông qua cơ chế Optimistic UI để đảm bảo trải nghiệm giống Jira.

🧩 **Steps:**
1. **Phân tích & Phân rã:**
   - **Nhóm Sprint Control:**
     - *Sprint Header:* Hiển thị Badge tóm tắt trạng thái (To Do, In Progress, Done). Hover vào hiển thị Tooltip chi tiết về Story Points.
     - *Sprint Lifecycle:* Modal khởi tạo/chỉnh sửa tự động tính EndDate nếu chọn Duration là "2 weeks".
     - *Insights:* Sidebar/Modal hiển thị biểu đồ "Work type breakdown" (tiến trình màu xanh) để phân tích tỉ trọng công việc.
   - **Nhóm Task Row Interaction:**
     - *Quick Update:* Đổi Status qua dropdown ngay trên hàng và nhập Story Points trực tiếp.
     - *Inline Create:* Ô input "Create" luôn nằm dưới cùng của danh sách để thêm nhanh task.
   - **Nhóm View & Filter:**
     - *Density Settings:* Thay đổi khoảng cách giữa các hàng task (Default vs Compact) bằng class CSS.
     - *Multi-Filter:* Giao diện lọc (Assignee, Work type, Status...) hỗ trợ tìm kiếm và chọn nhiều giá trị cùng lúc.
2. **Hoàn thiện Schema & API:**
   - Bổ sung trường `goal`, `duration`, `startedAt` vào bảng Sprints.
   - Bổ sung trường `storyPoints`, `priority`, `key` vào bảng Tasks.
3. **Phát triển UI Components chi tiết:**
   - Build `SprintBadge`: Component nhận 3 con số trạng thái và hiển thị màu sắc.
   - Build `EditableRow`: Hàng task cho phép click-to-edit nhanh.
   - Build `FilterMenu`: Panel chứa các checkbox lọc đa năng.
4. **Logic hóa các Modal:**
   - Viết hàm tự động tính ngày cho Modal "Start Sprint".
   - Tích hợp phím tắt `Shift + F` để mở bộ lọc nhanh.

🛠️ **Plan:**
Thực hiện dần qua 3 bước: Hoàn thiện API trước -> Phát triển UI Components độc lập (Storybook-style) -> Ráp logic vào Modal và các sự kiện bàn phím.

💻 **Code (Technical Pattern - Tooltip Story Points Outline):**
```javascript
// Tính toán dữ liệu cho badge
const sprintStats = {
  todo: tasks.filter(t => t.status === 'TODO').reduce((sum, t) => sum + t.points, 0),
  inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').reduce((sum, t) => sum + t.points, 0),
  done: tasks.filter(t => t.status === 'DONE').reduce((sum, t) => sum + t.points, 0)
};

// Hiển thị Tooltip
<Tooltip title={`In Progress: ${sprintStats.inProgress} of ${totalPoints} (story points)`}>
  <Badge count={inProgressCount} color="blue" />
</Tooltip>
```

✅ **Validation:**
- Kiểm tra tính đồng nhất: Sửa Sprint Name ở Modal, tên trên Header phải cập nhật ngay.
- Kiểm tra bộ lọc: Chọn lọc "Bug" ở Filter, danh sách Backlog chỉ hiện các task icon Bug.
- Kiểm tra phím tắt: Nhấn `Shift + F` xem menu lọc có xuất hiện không.

---

### Task 6.3: Bulk Action (Thao tác hàng loạt)

✅ **Understanding:** Xây dựng tính năng cho phép chọn nhiều task cùng lúc (thông qua checkbox) để thực hiện các thao tác hàng loạt, giúp tăng tốc độ quản lý Backlog cho Scrum Master/Product Owner.
- **Checkbox đa cấp:** Mỗi Task có một checkbox riêng. Sprint Header có một checkbox tổng để chọn/bỏ chọn tất cả task trong Sprint.
- **Floating Action Bar:** Thanh công cụ nổi xuất hiện ở đáy màn hình khi có ít nhất 1 task được chọn. Cung cấp các thao tác: Change status, Delete, và Clear selection.

📌 **Assumptions:**
- State `selectedTaskIds` được quản lý ở Component cha (page.tsx) để cả danh sách và Floating Bar đều truy xuất được.
- Backend hỗ trợ API Bulk (VD: `POST /tasks/bulk-delete`) hoặc Frontend tạm thời xử lý state local cho mảng task.

🧩 **Steps:**
1. **Thiết lập State & Checkbox UI:**
   - Tạo state `selectedTaskIds` dạng mảng `string[]`.
   - Thêm UI Checkbox vào mỗi dòng Task. Gắn sự kiện `onChange`.
   - Thêm UI Checkbox vào Sprint Header và Backlog Header.
2. **Xử lý Logic Chọn (Sprint Selection):**
   - Viết hàm `toggleSprintSelection(sprintTasks)` để xử lý việc chọn/bỏ chọn toàn bộ task trong một cụm. Xử lý trạng thái Indeterminate.
3. **Xây dựng Floating Action Bar:**
   - Tạo component `BulkActionBar` cố định ở bottom với hiệu ứng trượt.
   - Thêm các nút: Đổi trạng thái, Xóa, Bỏ chọn tất cả.
   - Viết logic `Escape` để hủy chọn.
4. **Tích hợp Bulk Actions (Frontend Logic):**
   - Sự kiện Delete: Xác nhận trước khi xóa -> Lọc bỏ các ID đã chọn khỏi `issues`.
   - Sự kiện Change Status: Hiển thị menu phụ -> Cập nhật trạng thái cho tất cả ID đã chọn.

🛠️ **Plan:**
Thêm Checkbox vào giao diện list hiện tại -> Bổ sung state array -> Xây dựng thanh Floating bottom -> Tích hợp logic update mảng `issues`.

💻 **Code (Logic Toggle Sprint):**
```javascript
const toggleSprintSelection = (sprintTasks) => {
  const sprintTaskIds = sprintTasks.map(t => t.id);
  const isAllSelected = sprintTaskIds.every(id => selectedTaskIds.includes(id));

  if (isAllSelected) {
    setSelectedTaskIds(prev => prev.filter(id => !sprintTaskIds.includes(id)));
  } else {
    setSelectedTaskIds(prev => [...new Set([...prev, ...sprintTaskIds])]);
  }
};
```

✅ **Validation:**
- Kiểm tra Checkbox: Tick từng task trong Sprint, khi đủ 100% thì Sprint Checkbox phải tự động check.
- Kiểm tra Floating Bar: Trượt lên mượt mà khi chọn task đầu tiên, trượt xuống mất đi khi bỏ chọn task cuối. Nhấn `ESC` để đóng nhanh.

---

## Nhóm 7: Các chế độ xem mở rộng (Áp dụng cho cả dự án Scrum & Kanban)

### Task 7.1: Timeline (Gantt Chart)

✅ **Understanding:** Xây dựng một giao diện dòng thời gian phức tạp hơn Backlog, liên quan đến quản lý thời gian, sự phụ thuộc giữa các task và hiển thị trực quan trên trục tọa độ.
- Trục thời gian (Time Axis): Hiển thị theo Ngày, Tuần, Tháng, Quý.
- Danh sách công việc (Work/Sprints): Cột bên trái liệt kê các Sprint hoặc Task.
- Thanh biểu đồ (Gantt Bars): Hiển thị thời gian bắt đầu và kết thúc của mỗi item trên lưới thời gian.
- Tương tác: Kéo dài/thu ngắn thanh để đổi thời gian, hoặc kéo cả thanh để dời lịch.

📌 **Assumptions:**
- Dữ liệu Sprint/Task đã có `startDate` và `endDate`.
- Sử dụng thư viện hỗ trợ Timeline (như `gantt-task-react`, `frappe-gantt`) hoặc tự build bằng CSS Grid/Canvas.

🧩 **Steps:**
1. **Giai đoạn 1: Cơ sở hạ tầng dữ liệu và Khung lưới**
   - Backend: Đảm bảo API trả về đầy đủ `startDate`, `endDate`. (Mặc định: ngày tạo + 14 ngày nếu null).
   - Frontend: Layout 2 phần (Sidebar trái cố định, Timeline Grid phải scroll ngang). Viết hàm tạo dải ngày tháng theo view (Days, Weeks, Months...).
2. **Giai đoạn 2: Hiển thị Biểu đồ (Rendering)**
   - Vẽ đường kẻ dọc (Grid lines).
   - Render thanh "Bar". Công thức: `Left = (startDate - timelineStart) * pixelsPerDay`, `Width = (endDate - startDate) * pixelsPerDay`.
   - Hiển thị "Today Line".
3. **Giai đoạn 3: Tương tác và Đồng bộ (Interaction)**
   - Xử lý Drag & Move: Dời thanh công việc -> gọi API update `startDate`.
   - Xử lý Resize: Kéo 2 đầu thanh -> update `startDate` / `endDate`.
   - Bộ lọc thời gian: Today, Weeks, Months, Quarters.

🛠️ **Plan:**
Thực hiện lần lượt 3 giai đoạn. Để tự build UI (DIY), kết hợp CSS Grid (`grid-template-columns: repeat(số_ngày, 1fr)`) và sử dụng thư viện `date-fns` / `dayjs` cho mọi tính toán thời gian.

✅ **Validation:**
- Tính chính xác: Task dài 10 ngày phải chiếm đúng 10 ô.
- Scroll sync: Scroll dọc ở Timeline thì Sidebar bên trái phải cuộn theo.
- Empty state: Task chưa có ngày tháng sẽ được xử lý sao (hiển thị góc riêng hoặc ẩn).

---

### Task 7.2: Summary (Dashboard Tổng quan dự án)

✅ **Understanding:** Xây dựng một Dashboard tổng quan dự án toàn diện với nhiều widget báo cáo khác nhau:
- **Key Metrics:** 4 chỉ số chính trên cùng (Completed, Updated, Created, Due soon).
- **Status Overview:** Biểu đồ tròn (Donut chart) hiển thị tỷ lệ trạng thái công việc.
- **Recent Activity:** Danh sách các hoạt động vừa diễn ra (ai đã tạo/sửa gì).
- **Priority Breakdown:** Biểu đồ cột (Bar chart) phân bổ theo mức độ ưu tiên.
- **Types of Work:** Thống kê tỷ lệ các loại task (Task, Bug, Story...).
- **Team Workload:** Thống kê khối lượng công việc của từng thành viên.
- **Epic Progress:** Theo dõi tiến độ của các nhóm việc lớn (Epics).

📌 **Assumptions:**
- Sử dụng một thư viện biểu đồ cho React như `Recharts` hoặc `Chart.js`.
- Backend cần một endpoint tổng hợp để trả về dữ liệu cho tất cả các widget này trong một lần gọi (hoặc chia nhỏ để load song song).
- Các task trong database đã có đủ trường: `status`, `priority`, `type`, `assigneeId`, `epicId`.

🧩 **Steps:**
1. **Phân tích kỹ thuật:**
   - *Status Overview (Donut Chart):* Tính tổng số task theo từng status. Central text hiển thị "Total work items".
   - *Priority Breakdown (Bar Chart):* Trục X là mức Highest đến Lowest. Trục Y là số lượng task.
   - *Types/Workload (Horizontal Progress Bars):* Tính tỷ lệ phần trăm để vẽ thanh tiến trình.
   - *Recent Activity:* Cần bảng `ActivityLog` lưu vết thay đổi. Query N bản ghi mới nhất.
2. **Thiết kế Database & API mở rộng (Backend):**
   - Đảm bảo Schema có trường `priority` và `type`.
   - Thiết kế API `GET /projects/:id/dashboard-data` tổng hợp dữ liệu từ bảng Tasks, Users, ActivityLogs.
3. **Xây dựng Layout Dashboard (Frontend):**
   - Sử dụng CSS Grid chia bố cục 2 cột chính.
   - Tạo component `DashboardWidget` chung quản lý khung viền, tiêu đề và nút mở rộng (expand).
4. **Tích hợp Thư viện Biểu đồ:**
   - Cài đặt thư viện (`recharts`).
   - Render chart tương ứng vào từng widget.

🛠️ **Plan:**
Xây dựng khung Layout bằng CSS Grid trước. Tạo dữ liệu Mock (JSON) ở client để dựng xong các biểu đồ. Sau đó thiết kế API gộp (hoặc GraphQL) ở Backend để thay thế Mock data.

💻 **Code (Cấu trúc dữ liệu API mẫu):**
```json
{
  "keyMetrics": { "completed": 0, "updated": 2, "created": 2, "dueSoon": 1 },
  "statusDistribution": [
    { "name": "To Do", "value": 2, "color": "#0052CC" },
    { "name": "Done", "value": 0, "color": "#36B37E" }
  ],
  "priorities": [
    { "level": "Medium", "count": 2 },
    { "level": "High", "count": 0 }
  ],
  "activities": [
    { "user": "Quân Phạm", "action": "created", "target": "TEST-2: sleep", "time": "21 minutes ago" }
  ]
}
```

✅ **Validation:**
- Độ chính xác: Tổng số trong biểu đồ Donut bằng đúng "Total work items".
- Đồng bộ: Đổi Priority task ở nơi khác -> Biểu đồ Priority Breakdown cập nhật ngay.
- Trạng thái rỗng: Widget "Epic progress" hiển thị hình minh họa khi chưa có Epic.

---

### Task 7.3: Calendar (Lịch công việc nâng cao)

✅ **Understanding:** Tính năng kéo thả trên trang Calendar không chỉ để di chuyển task mà còn thiết lập thời hạn (due date):
- **Lên lịch công việc:** Kéo vật phẩm từ "Unscheduled" thả vào lưới lịch để set `dueDate`.
- **Thay đổi lịch trình:** Kéo task trên lịch sang ngày khác để đổi `dueDate`.
- **Hủy lịch trình:** Kéo task từ lịch thả về "Unscheduled work" để xóa `dueDate`.

📌 **Assumptions:**
- Mỗi ô ngày trên lịch là một vùng chứa (Droppable container) định danh bằng chuỗi ngày (VD: `2026-05-12`).
- Panel "Unscheduled work" là Droppable container với ID `unscheduled-zone`.
- Sử dụng thư viện `dnd-kit` hoặc `@hello-pangea/dnd`.

🧩 **Steps:**
1. **Phân tích cơ chế Droppable đa điểm:**
   - Lưới lịch tháng (35-42 ô) => mỗi ô là 1 Droppable.
   - Logic: `onDragEnd` trả về `result.destination.droppableId`. Nếu là chuỗi ngày -> set ngày; nếu là `unscheduled-zone` -> set null.
2. **API & Database (Backend):**
   - Đảm bảo API `PATCH /tasks/:id` nhận giá trị null cho `dueDate`.
   - Viết logic kiểm tra: Nếu `dueDate` thay đổi, ghi nhận vào `ActivityLog`.
3. **Xây dựng vùng Droppable (Frontend):**
   - Duyệt mảng các ngày trong tháng, bọc mỗi ô bằng `Droppable`.
   - Bọc panel "Unscheduled work" bằng một `Droppable` riêng.
4. **Xử lý sự kiện Kéo-Thả:**
   - Lấy `taskId` từ `active.id` và target từ `over.id`.
   - Gọi API cập nhật và đồng bộ State.

🛠️ **Plan:**
Chia lịch thành lưới Grid. Đảm bảo hiệu năng khi có 42 vùng Droppable cùng lúc (ưu tiên dùng `dnd-kit` vì performance tốt). Cần xử lý kĩ giao diện khi kéo thả lướt qua các ô (highlight ngày).

💻 **Code (Technical Logic):**
```javascript
const handleDragEnd = (event) => {
  const { active, over } = event;
  if (!over) return;

  const taskId = active.id;
  const targetDate = over.id; // '2026-05-10' hoặc 'unscheduled-zone'

  if (targetDate === 'unscheduled-zone') {
    // Xóa ngày hạn
    updateTaskDate(taskId, null);
  } else {
    // Đặt ngày hạn mới
    updateTaskDate(taskId, targetDate);
  }
};
```

✅ **Validation:**
- Phản hồi thị giác: Kéo task đè lên ô ngày -> ô đổi màu nền (Highlight).
- Hiển thị Badge: Sau khi thả task vào lịch, các thông số ở Header Sprint và Summary phải cập nhật tương ứng.
- Kiểm tra Search: Đang search trong Unscheduled panel, việc kéo thả vẫn hoạt động chính xác.

---


---

### Task 7.4: Detail Drawer (Ngăn kéo chi tiết)

✅ **Understanding:** Xây dựng một Sidebar trượt ra từ bên phải màn hình khi người dùng click vào một hàng Work Item (Epic/Task) trên lưới Timeline.
- Giao diện: Chiếm khoảng 30-40% chiều rộng màn hình, đè lên phần bên phải của Timeline.
- Nội dung: Hiển thị chi tiết Task, bao gồm: Header (Breadcrumb, Close, Share, Lock, Eye), Meta (Status, Type, Actions), Description (TipTap Editor), Child items (Subtasks table), Linked items.

📌 **Assumptions:**
- Sử dụng CSS `position: fixed; right: 0; transform: translateX(...)` để tạo hiệu ứng trượt.
- Lưu trữ ID của Task đang được mở (`selectedTaskId`) bằng state cục bộ hoặc global.
- Drawer chia sẻ chung các component con (Description, Subtasks) đã được xây dựng từ trước cho Modal.

🧩 **Steps:**
1. **Thiết lập Component Layout & State:** Định nghĩa state `selectedTaskId`, tích hợp component Drawer với animation slide-in/slide-out. Gắn sự kiện `onDoubleClick` hoặc `onClick` vào thanh Task trên Timeline.
2. **Gọi API Detail & Loading State:** Mô phỏng gọi API lấy chi tiết task và hiển thị Skeleton Loader khi đang đợi.
3. **Build Header & Meta Data:** Breadcrumb, Title inline-edit, Status dropdown.
4. **Tích hợp Description:** Sử dụng lại `IssueDescription` component.
5. **Build Child Work Items Section:** Bảng sub-tasks và thanh tiến độ.

🛠️ **Plan:**
- Tạo component `TaskDetailDrawer.tsx` với cấu trúc tương tự `IssueDetailModal` nhưng layout dạng panel trượt (Drawer).
- Tích hợp vào `TimelineView.tsx` hoặc `page.tsx`. Khi click đúp vào bar trên Timeline, sẽ set `selectedTaskId` và mở Drawer.

💻 **Code:**
(Đã thực hiện trong source code: tạo `TaskDetailDrawer.tsx` và gắn vào hệ thống)

✅ **Validation:**
- Hiệu ứng trượt: Đóng mở Drawer mượt mà.
- Đóng form: Bấm nút X hoặc click ra ngoài overlay để đóng.
- Sync Dữ liệu: Chỉnh sửa trạng thái hoặc description sẽ tự cập nhật lại trên Timeline hoặc Kanban Board.


## Nhóm 8: Architecture & Data Integration (API Layer)

### Task 8.1: Thiết lập cấu trúc Mock Data & API Layer

✅ **Understanding:** Xây dựng một lớp giao tiếp (API Layer) trên Frontend để kết nối với AL-TASK-Backend.
- Định nghĩa các hàm gọi API (GET, POST, PATCH, DELETE) cho các tính năng đã phân tích (Board, Backlog, Summary, Calendar).
- Sử dụng Mock Data tạm thời để test UI trong lúc Backend đang hoàn thiện.
- Thiết kế sao cho việc chuyển từ Mock sang API thật chỉ cần đổi 1 biến môi trường (Environment Variable), không phải sửa lại code UI.

📌 **Assumptions:**
- Backend được thiết kế theo chuẩn RESTful API với các resource cơ bản: `/tasks`, `/sprints`, `/columns`, `/projects`.
- Sử dụng framework Frontend như React/Next.js cùng với thư viện gọi API là `axios` hoặc `fetch`.
- Sử dụng TypeScript hoặc JSDoc để định nghĩa cấu trúc dữ liệu trả về.

🧩 **Steps:**
1. **Khởi tạo kiến trúc API & Biến môi trường:**
   - Tạo file `.env` và thêm biến `VITE_USE_MOCK_API=true` (hoặc `NEXT_PUBLIC_USE_MOCK_API` tùy framework).
   - Thiết lập axios instance với base URL trỏ tới AL-TASK-Backend.
   - Cấu hình Interceptors để tự động đính kèm Token (nếu có) và xử lý lỗi global (401, 500).
2. **Chuẩn bị Mock Data (Giả lập Database):**
   - Tạo thư mục `src/mocks`.
   - Tạo file `tasks.mock.json`: Chứa mảng task mẫu với đầy đủ field (`id`, `title`, `status`, `sprintId`, `dueDate`, `priority`).
   - Tạo file `sprints.mock.json` và `summary.mock.json`.
3. **Viết Services (Lớp giao tiếp):**
   - Tạo file `taskService.js` (hoặc `.ts`).
   - Viết các hàm `getTasks()`, `createTask()`, `updateTaskStatus()`, `updateTaskDate()`.
   - Tích hợp logic rẽ nhánh: Nếu `USE_MOCK = true` thì trả về file JSON giả lập delay, nếu false thì gọi axios.
4. **Tích hợp State Management vào UI:**
   - Board: Gọi `getTasks()` khi mount, map dữ liệu.
   - Backlog: Tích hợp API tạo Sprint và API kéo thả.
   - Summary: Tích hợp API lấy số liệu tổng quan.
   - Xử lý trạng thái Loading (Spinner/Skeleton) và Error.

🛠️ **Plan:**
Thực hiện việc này như một Phase riêng biệt. Việc chia thành 3 phần chính `Models/Types`, `Mock Data`, và `Services/API Layer` giúp kiến trúc vững chắc, cho phép Frontend và Backend phát triển độc lập song song.

💻 **Code (Technical Pattern - Service):**
```javascript
import axiosClient from './axiosClient'; // Axios instance đã config
import mockTasks from '../mocks/tasks.mock.json';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'; // Hoặc dùng NEXT_PUBLIC_...

export const taskService = {
  // Lấy danh sách task
  getAll: async (projectId) => {
    if (USE_MOCK) {
      // Giả lập độ trễ mạng (Network delay)
      return new Promise((resolve) => 
        setTimeout(() => resolve(mockTasks.filter(t => t.projectId === projectId)), 500)
      );
    }
    const response = await axiosClient.get(`/projects/${projectId}/tasks`);
    return response.data;
  },

  // Cập nhật trạng thái (Kéo thả Board)
  updateStatus: async (taskId, newStatus, newPosition) => {
    if (USE_MOCK) {
      console.log(`[MOCK] Updated Task ${taskId} to ${newStatus}`);
      return { success: true };
    }
    const response = await axiosClient.patch(`/tasks/${taskId}/status`, { status: newStatus, position: newPosition });
    return response.data;
  }
};
```

✅ **Validation:**
- Test Mock Mode: Chạy web, kiểm tra console xem dữ liệu có log ra từ file mock không. Thực hiện kéo thả và check console xem hàm Mock update có chạy không.
- Test Real Mode: Đổi biến `USE_MOCK = false`, khởi động backend. Kiểm tra tab Network xem các request GET/PATCH có status 200/201 không.
- Error Handling: Thử tắt Backend đi và load trang web xem UI có bị crash không (phải hiển thị thông báo lỗi lịch sự thay vì trắng trang).
