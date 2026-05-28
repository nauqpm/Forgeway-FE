# Task Archive APIs

## 1. Archive Task

### Endpoint

```http
PATCH /workspaces/:workspaceKey/board/:taskId/archive
```

### Mô tả

Dùng khi user bấm **Archive** trong task menu.

### Example Request

```http
PATCH /workspaces/TESKB/board/665fabc123/archive
```

### Response

```json
{
  "id": "665fabc123",
  "key": "TESKB-12",
  "title": "Fix login bug",
  "isArchived": true,
  "archivedAt": "2026-05-28T10:00:00.000Z",
  "archivedBy": "userId",
  "archivedByUser": {
    "id": "userId",
    "fullName": "Do Thanh Loc",
    "email": "loc@example.com",
    "avatar": "https://..."
  }
}
```

### Frontend Handling

Sau khi archive thành công:

- Remove task khỏi:
    
    - Board
        
    - List
        
    - Backlog hiện tại
        
- Task sẽ không còn xuất hiện trong active workflow.
    

---

# 2. Restore Task

## Endpoint

```http
PATCH /workspaces/:workspaceKey/board/:taskId/restore
```

## Mô tả

Dùng cho button **Restore** trong trang Archived Tasks.

## Example Request

```http
PATCH /workspaces/TESKB/board/665fabc123/restore
```

## Response

```json
{
  "id": "665fabc123",
  "key": "TESKB-12",
  "title": "Fix login bug",
  "isArchived": false,
  "archivedAt": null,
  "archivedBy": null
}
```

## Frontend Handling

Sau khi restore thành công:

- Remove task khỏi trang Archives
    
- Task sẽ xuất hiện lại ở:
    
    - Board
        
    - Backlog
        
    - Sprint cũ
        

Dựa theo các field cũ:

- `columnId`
    
- `status`
    
- `sprintId`


# Delete Task API

## Endpoint

```http
DELETE /workspaces/:workspaceKey/board/:taskId
```

---

## Description

Dùng để **xóa vĩnh viễn task** khỏi hệ thống.

API yêu cầu frontend gửi `confirmText` để tránh user xóa nhầm task.

---

## Request Body

```json
{
  "confirmText": "delete"
}
```

---

## Example Request

```http
DELETE /workspaces/TESKB/board/665fabc123
```

```json
{
  "confirmText": "delete"
}
```

---

## Validation Rules

### confirmText bắt buộc phải là:

```txt
delete
```

Nếu:

- Không truyền `confirmText`
    
- Hoặc truyền sai giá trị
    

Backend sẽ trả về `400 Bad Request`.

---

## Error Response

```json
{
  "message": "Type \"delete\" to permanently delete this task",
  "statusCode": 400
}
```

---

## Frontend Handling

Sau khi delete thành công:

- Remove task khỏi:
    
    - Board
        
    - Backlog
        
    - Sprint
        
    - Task detail view
        
- Task sẽ không thể restore lại.
    

---

