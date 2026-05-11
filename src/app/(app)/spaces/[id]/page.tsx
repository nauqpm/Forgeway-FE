"use client";

import { useEffect, useState, use, useMemo, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import Link from "next/link";
import {
  BookOpen, Plus, ArrowRight, Search, Lock, Globe, Settings,
  FileText, Columns, Repeat, ChevronRight, X, Check
} from "lucide-react";
import IssueDetailModal from "@/modules/app/common/components/IssueDetailModal";
import PageTreeSidebar from "@/modules/app/common/components/PageTreeSidebar";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface Space {
  _id: string;
  name: string;
  key: string;
  description?: string;
  visibility: "private" | "public";
  template: "kanban" | "scrum";
}

export default function SpaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: spaceId } = use(params);
  const { currentWorkspace } = useWorkspaceStore();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"board" | "backlog" | "pages">("pages");
  const [columns, setColumns] = useState(["To Do", "In Progress", "Done"]);
  const [sprints, setSprints] = useState([
    { id: "s1", name: "Sprint 1", status: "Active", startDate: "10 Aug", endDate: "24 Aug" },
    { id: "s2", name: "Sprint 2", status: "Planned", startDate: "25 Aug", endDate: "08 Sep" }
  ]);
  const [issues, setIssues] = useState([
    { id: "1", title: "Thiết kế lại luồng đăng nhập theo chuẩn mới", status: "To Do", priority: "High", type: "Design", assignee: "A", color: "bg-indigo-600", sprintId: "s1" },
    { id: "2", title: "Fix lỗi hiển thị sai font chữ trên Safari", status: "To Do", priority: "High", type: "Bug", assignee: "B", color: "bg-teal-500", sprintId: "s1" },
    { id: "3", title: "Viết test case cho module Thanh toán", status: "In Progress", priority: "Medium", type: "Task", assignee: "C", color: "bg-emerald-500", sprintId: null },
    { id: "4", title: "Tối ưu hóa hình ảnh Landing Page", status: "Done", priority: "Low", type: "Task", assignee: "D", color: "bg-orange-500", sprintId: null },
    { id: "5", title: "Nghiên cứu kiến trúc Micro-frontend", status: "To Do", priority: "Medium", type: "Story", assignee: "U", color: "bg-purple-500", sprintId: null },
  ]);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [newIssueForm, setNewIssueForm] = useState<{title: string, type: string, priority: string, status: string, sprintId: string | null}>({ title: "", type: "Task", priority: "Medium", status: "To Do", sprintId: null });
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [filters, setFilters] = useState({ search: "", assigneeId: null as string | null, priority: null as string | null });
  const [showCreateColumn, setShowCreateColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const columnsEndRef = useRef<HTMLDivElement>(null);

  const filteredIssues = useMemo(() => {
    if (!space) return [];
    return issues.filter(issue => {
      const matchSearch = issue.title.toLowerCase().includes(filters.search.toLowerCase()) 
                       || `${space.key}-${100 + parseInt(issue.id)}`.toLowerCase().includes(filters.search.toLowerCase());
      const matchAssignee = filters.assigneeId ? issue.assignee === filters.assigneeId : true;
      const matchPriority = filters.priority ? issue.priority === filters.priority : true;
      
      return matchSearch && matchAssignee && matchPriority;
    });
  }, [issues, filters, space]);

  const uniqueAssignees = useMemo(() => {
    const map = new Map<string, { id: string, color: string }>();
    issues.forEach(i => {
      if (!map.has(i.assignee)) {
        map.set(i.assignee, { id: i.assignee, color: i.color });
      }
    });
    return Array.from(map.values());
  }, [issues]);

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueForm.title.trim()) return;

    const newId = Date.now().toString();
    const issue = {
      id: newId,
      title: newIssueForm.title,
      status: newIssueForm.status,
      priority: newIssueForm.priority,
      type: newIssueForm.type,
      assignee: "U",
      color: "bg-indigo-600",
      sprintId: newIssueForm.sprintId
    };

    setIssues([...issues, issue]);
    setShowCreateIssue(false);
    setNewIssueForm({ title: "", type: "Task", priority: "Medium", status: "To Do", sprintId: null });
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (type === "column") {
      if (source.index === destination.index) return;
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);
      setColumns(newColumns);
      return;
    }

    if (type === "task") {
      const sourceStatus = source.droppableId;
      const destStatus = destination.droppableId;
      
      const draggedIssueIndex = issues.findIndex(i => i.id === draggableId);
      if (draggedIssueIndex === -1) return;
      
      const draggedIssue = issues[draggedIssueIndex];
      const newIssues = Array.from(issues);
      
      if (sourceStatus === destStatus) {
        if (source.index === destination.index) return;
        
        const columnIssues = newIssues.filter(i => i.status === sourceStatus);
        const targetIssue = columnIssues[destination.index];
        
        newIssues.splice(draggedIssueIndex, 1);
        const targetIndex = newIssues.findIndex(i => i.id === targetIssue?.id);
        newIssues.splice(targetIndex !== -1 ? targetIndex : newIssues.length, 0, draggedIssue);
      } else {
        const columnIssues = newIssues.filter(i => i.status === destStatus);
        const targetIssue = columnIssues[destination.index];
        
        newIssues.splice(draggedIssueIndex, 1);
        const newIssue = { ...draggedIssue, status: destStatus };
        const targetIndex = newIssues.findIndex(i => i.id === targetIssue?.id);
        newIssues.splice(targetIndex !== -1 ? targetIndex : newIssues.length, 0, newIssue);
      }
      
      setIssues(newIssues);
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      setShowCreateColumn(false);
      return;
    }
    setColumns([...columns, newColumnName.trim()]);
    setNewColumnName("");
    setShowCreateColumn(false);
    setTimeout(() => {
      columnsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
    }, 100);
  };

  const handleCreateSprint = () => {
    const newSprintId = `s${sprints.length + 1}`;
    setSprints([
      ...sprints,
      { id: newSprintId, name: `Sprint ${sprints.length + 1}`, status: "Planned", startDate: "", endDate: "" }
    ]);
  };

  const handleBacklogDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newIssues = Array.from(issues);
    const draggedIssueIndex = newIssues.findIndex(i => i.id === draggableId);
    if (draggedIssueIndex === -1) return;

    const draggedIssue = newIssues[draggedIssueIndex];
    
    // Xử lý xác định sprintId đích
    let targetSprintId: string | null = null;
    if (destination.droppableId.startsWith("sprint-")) {
      targetSprintId = destination.droppableId.replace("sprint-", "");
    }

    // Logic di chuyển
    const sourceIssues = newIssues.filter(i => 
      source.droppableId === "backlog" ? i.sprintId === null : i.sprintId === source.droppableId.replace("sprint-", "")
    );
    const destIssues = newIssues.filter(i => 
      destination.droppableId === "backlog" ? i.sprintId === null : i.sprintId === destination.droppableId.replace("sprint-", "")
    );

    if (source.droppableId === destination.droppableId) {
      // Reorder cùng một danh sách (Sprint hoặc Backlog)
      const targetIssue = sourceIssues[destination.index];
      newIssues.splice(draggedIssueIndex, 1);
      const targetIndex = newIssues.findIndex(i => i.id === targetIssue?.id);
      newIssues.splice(targetIndex !== -1 ? targetIndex : newIssues.length, 0, draggedIssue);
    } else {
      // Đổi sang danh sách khác
      const targetIssue = destIssues[destination.index];
      newIssues.splice(draggedIssueIndex, 1);
      const newIssue = { ...draggedIssue, sprintId: targetSprintId };
      const targetIndex = newIssues.findIndex(i => i.id === targetIssue?.id);
      newIssues.splice(targetIndex !== -1 ? targetIndex : newIssues.length, 0, newIssue);
    }

    setIssues(newIssues);
  };

  useEffect(() => {
    if (!spaceId) return;
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        const allSpaces = JSON.parse(localStorage.getItem("MOCK_SPACES") || "[]");
        const found = allSpaces.find((s: any) => s._id === spaceId);
        if (found) {
          setSpace(found);
          // Auto-select tab based on template
          if (found.template === "kanban") setActiveTab("board");
          else if (found.template === "scrum") setActiveTab("backlog");
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [spaceId]);

  if (loading) return <LoadingSpinner />;
  if (!space) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-gray-500 mb-4">Không tìm thấy không gian (Space) này</p>
      <Link href="/spaces" className="text-indigo-600 hover:text-indigo-800">Quay lại danh sách Space</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/spaces" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-5 h-5 text-gray-500 rotate-180" />
          </Link>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${space.template === 'scrum' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
            {space.template === 'scrum' ? <Repeat className="w-7 h-7 text-white" /> : <Columns className="w-7 h-7 text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono font-bold">{space.key}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${space.visibility === "private" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
                }`}>
                {space.visibility === "private" ? <><Lock className="w-3 h-3" /> Private</> : <><Globe className="w-3 h-3" /> Public</>}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {space.name}
              <Link href={`/spaces/${spaceId}/settings`} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-700">
                <Settings className="w-5 h-5" />
              </Link>
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors shadow-sm">
            Mời thành viên
          </button>
          <button onClick={() => setShowCreateIssue(true)} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Tạo Issue
          </button>
        </div>
      </div>

      {/* Description */}
      {space.description && (
        <p className="text-gray-600 text-sm mb-6 bg-white rounded-lg px-4 py-3 border border-gray-200">{space.description}</p>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {space.template === "kanban" && (
          <button onClick={() => setActiveTab("board")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "board" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Kanban Board
          </button>
        )}
        {space.template === "scrum" && (
          <>
            <button onClick={() => setActiveTab("backlog")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "backlog" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              Backlog
            </button>
            <button onClick={() => setActiveTab("board")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "board" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              Active Sprint
            </button>
          </>
        )}
        <button onClick={() => setActiveTab("pages")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "pages" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          Tài liệu (Pages)
        </button>
      </div>

      {/* Content Area */}
      <div className={`rounded-2xl ${activeTab === 'pages' ? 'bg-white border border-gray-200 min-h-[500px] flex' : ''}`}>
        {activeTab === "pages" && (
          <>
            <PageTreeSidebar 
              spaceId={spaceId}
              initialData={[
                {
                  id: "getting-started",
                  title: "Getting Started",
                  children: [
                    { id: "installation", title: "Installation" },
                    { id: "configuration", title: "Configuration" }
                  ]
                },
                {
                  id: "api-reference",
                  title: "API Reference",
                  children: [
                    { id: "auth", title: "Authentication" },
                    { id: "endpoints", title: "Endpoints" }
                  ]
                }
              ]} 
            />
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white rounded-r-2xl">
              <BookOpen className="w-16 h-16 text-indigo-100 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tài liệu dự án</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">Quản lý tài liệu theo cấu trúc hình cây. Kéo thả để sắp xếp lại các trang. Chọn một trang bên trái để xem nội dung.</p>
              <Link href={`/spaces/${spaceId}/pages/create`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors">
                <Plus className="w-4 h-4" /> Tạo trang mới
              </Link>
            </div>
          </>
        )}

        {activeTab === "board" && (
          <div className="flex flex-col gap-4">
            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-4 px-4 pt-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm issue..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Assignee:</span>
                <div className="flex -space-x-2">
                  {uniqueAssignees.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setFilters(prev => ({ ...prev, assigneeId: prev.assigneeId === user.id ? null : user.id }))}
                      className={`w-8 h-8 rounded-full ${user.color} text-white flex items-center justify-center text-xs font-bold ring-2 ring-white hover:z-10 transition-transform hover:scale-110 ${filters.assigneeId === user.id ? 'ring-indigo-500 ring-offset-2 ring-offset-white' : ''} ${filters.assigneeId && filters.assigneeId !== user.id ? 'opacity-40' : ''}`}
                      title={user.id}
                    >
                      {user.id}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Priority:</span>
                <select
                  value={filters.priority || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value || null }))}
                  className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Tất cả</option>
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟠 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>
              {(filters.search || filters.assigneeId || filters.priority) && (
                <button 
                  onClick={() => setFilters({ search: "", assigneeId: null, priority: null })}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="board-columns" direction="horizontal" type="column">
                {(provided) => (
                  <div 
                    className="flex gap-6 overflow-x-auto pb-4 min-h-[500px] p-4"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {columns.map((status, index) => (
                      <Draggable key={status} draggableId={`col-${status}`} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex-shrink-0 w-80 bg-gray-50 rounded-xl flex flex-col max-h-full border border-gray-200 shadow-sm"
                          >
                            <div 
                              {...provided.dragHandleProps}
                              className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-100/50 rounded-t-xl cursor-grab active:cursor-grabbing"
                            >
                              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide flex items-center gap-2">
                                {status}
                                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold">{filteredIssues.filter(i => i.status === status).length}</span>
                              </h3>
                              <button onClick={() => { setNewIssueForm({ ...newIssueForm, status }); setShowCreateIssue(true); }} className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors cursor-pointer"><Plus className="w-4 h-4" /></button>
                            </div>
                            
                            <Droppable droppableId={status} type="task">
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}
                                >
                                  {filteredIssues.filter(i => i.status === status).map((issue, issueIndex) => (
                                    <Draggable key={issue.id} draggableId={issue.id} index={issueIndex}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          onClick={() => setSelectedIssue(issue)}
                                          className={`bg-white p-3.5 rounded-lg shadow-sm border ${snapshot.isDragging ? 'border-indigo-500 shadow-lg rotate-2 z-50 relative' : 'border-gray-200 hover:border-indigo-400 hover:shadow-md'} transition-all cursor-grab active:cursor-grabbing group`}
                                        >
                                          <p className="text-sm font-medium text-gray-900 mb-2 leading-snug group-hover:text-indigo-600">{issue.title}</p>
                                          <div className="flex flex-wrap gap-1.5 mb-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${issue.priority === 'High' ? 'bg-red-50 text-red-600' : issue.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                              {issue.priority}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600`}>
                                              {issue.type}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                                            <span className="text-xs font-mono font-bold text-gray-400">{space.key}-{100 + parseInt(issue.id)}</span>
                                            <div className={`w-6 h-6 rounded-full ${issue.color} text-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-white`}>{issue.assignee}</div>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                  {filteredIssues.filter(i => i.status === status).length === 0 && !snapshot.isDraggingOver && (
                                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-sm font-medium text-gray-400">
                                      {issues.filter(i => i.status === status).length === 0 ? "Kéo thả issue vào đây" : "Không có issue phù hợp"}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {/* Thêm cột mới */}
                    <div className="flex-shrink-0 w-80 bg-transparent flex flex-col" ref={columnsEndRef}>
                      {showCreateColumn ? (
                        <div className="bg-white rounded-xl border border-indigo-200 p-3 shadow-sm">
                          <input
                            type="text"
                            autoFocus
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddColumn();
                              if (e.key === 'Escape') {
                                setShowCreateColumn(false);
                                setNewColumnName("");
                              }
                            }}
                            placeholder="Tên cột mới..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                          <div className="flex items-center gap-2 mt-3">
                            <button onClick={handleAddColumn} className="flex-1 bg-indigo-600 text-white text-xs font-medium py-1.5 rounded hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Thêm cột
                            </button>
                            <button onClick={() => { setShowCreateColumn(false); setNewColumnName(""); }} className="flex-1 bg-gray-100 text-gray-600 text-xs font-medium py-1.5 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                              <X className="w-3.5 h-3.5" /> Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowCreateColumn(true)}
                          className="flex items-center gap-2 w-full bg-gray-50/50 hover:bg-gray-100 border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-xl p-4 text-gray-500 hover:text-gray-700 transition-all font-medium text-sm justify-center"
                        >
                          <Plus className="w-5 h-5" /> Thêm cột mới
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {activeTab === "backlog" && (
          <DragDropContext onDragEnd={handleBacklogDragEnd}>
            <div className="space-y-6 w-full max-w-4xl mx-auto py-6">
              {/* Sprints Mapping */}
              {sprints.map((sprint) => {
                const sprintIssues = issues.filter(i => i.sprintId === sprint.id);
                return (
                  <div key={sprint.id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          {sprint.name} 
                          {sprint.status === "Active" && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wide">Active</span>}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {sprint.startDate ? `${sprint.startDate} - ${sprint.endDate}` : 'Chưa có ngày'} &middot; {sprintIssues.length} issues
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                          <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center" title="To Do">{sprintIssues.filter(i => i.status === "To Do").length}</span>
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center" title="In Progress">{sprintIssues.filter(i => i.status === "In Progress").length}</span>
                          <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center" title="Done">{sprintIssues.filter(i => i.status === "Done").length}</span>
                        </div>
                        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                          {sprint.status === "Active" ? "Complete Sprint" : "Start Sprint"}
                        </button>
                      </div>
                    </div>
                    
                    <Droppable droppableId={`sprint-${sprint.id}`} type="backlog-issue">
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-2 space-y-1 min-h-[50px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/30' : ''}`}
                        >
                          {sprintIssues.map((issue, index) => (
                            <Draggable key={issue.id} draggableId={issue.id} index={index}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setSelectedIssue(issue)}
                                  className={`flex items-center justify-between bg-white p-3 rounded-lg border ${snapshot.isDragging ? 'border-indigo-400 shadow-md rotate-1 z-50 relative' : 'border-gray-100 hover:border-indigo-200'} transition-all group cursor-pointer shadow-sm`}
                                >
                                  <div className="flex items-center gap-3">
                                    <FileText className={`w-4 h-4 ${issue.type === 'Bug' ? 'text-red-500' : issue.type === 'Story' ? 'text-emerald-500' : 'text-indigo-500'}`} />
                                    <span className="text-xs font-mono font-medium text-gray-500 w-16">{space?.key}-{100 + parseInt(issue.id)}</span>
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">{issue.title}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${issue.status === 'Done' ? 'bg-green-50 text-green-700' : issue.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{issue.status}</span>
                                    {issue.assignee ? (
                                      <div className={`w-6 h-6 rounded-full ${issue.color} text-white flex items-center justify-center text-[10px] font-bold`}>{issue.assignee}</div>
                                    ) : (
                                      <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center"></div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {sprintIssues.length === 0 && !snapshot.isDraggingOver && (
                            <div className="p-4 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg mx-2 my-1">
                              Plan your sprint by dragging issues here
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                    <div className="px-3 pb-3">
                      <button onClick={() => { setNewIssueForm({ ...newIssueForm, sprintId: sprint.id }); setShowCreateIssue(true); }} className="text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors">
                        <Plus className="w-4 h-4" /> Create issue
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Backlog Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    Backlog 
                    <span className="text-gray-400 font-normal text-sm">({issues.filter(i => i.sprintId === null).length} issues)</span>
                  </h3>
                  <button onClick={handleCreateSprint} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">Create Sprint</button>
                </div>
                
                <Droppable droppableId="backlog" type="backlog-issue">
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 space-y-1 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? 'bg-gray-50/80' : ''}`}
                    >
                      {issues.filter(i => i.sprintId === null).map((issue, index) => (
                        <Draggable key={issue.id} draggableId={issue.id} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedIssue(issue)}
                              className={`flex items-center justify-between bg-white p-3 rounded-lg border ${snapshot.isDragging ? 'border-indigo-400 shadow-md rotate-1 z-50 relative' : 'border-gray-100 hover:bg-gray-50'} transition-all group cursor-pointer`}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className={`w-4 h-4 ${issue.type === 'Bug' ? 'text-red-500' : issue.type === 'Story' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                <span className="text-xs font-mono font-medium text-gray-400 w-16">{space?.key}-{100 + parseInt(issue.id)}</span>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{issue.title}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">{issue.status}</span>
                                {issue.assignee ? (
                                  <div className={`w-6 h-6 rounded-full ${issue.color} text-white flex items-center justify-center text-[10px] font-bold`}>{issue.assignee}</div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:border-indigo-500 transition-colors">
                                    <Plus className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                <div className="p-3 bg-gray-50/30 border-t border-gray-100">
                  <button onClick={() => { setNewIssueForm({ ...newIssueForm, sprintId: null }); setShowCreateIssue(true); }} className="w-full text-left p-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" /> Tạo issue mới...
                  </button>
                </div>
              </div>
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Modal Tạo Issue */}
      {showCreateIssue && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Tạo Issue mới
              </h3>
              <button onClick={() => setShowCreateIssue(false)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateIssue} className="p-6 space-y-5 bg-gray-50/30">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề công việc <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newIssueForm.title}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm transition-all"
                  placeholder="Vd: Sửa lỗi hiển thị trên màn hình Mobile..."
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại Issue</label>
                  <select
                    value={newIssueForm.type}
                    onChange={(e) => setNewIssueForm({ ...newIssueForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
                  >
                    <option value="Task">📌 Task (Nhiệm vụ)</option>
                    <option value="Bug">🐛 Bug (Lỗi)</option>
                    <option value="Story">📖 Story (Tính năng)</option>
                    <option value="Design">🎨 Design (Thiết kế)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mức độ ưu tiên</label>
                  <select
                    value={newIssueForm.priority}
                    onChange={(e) => setNewIssueForm({ ...newIssueForm, priority: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
                  >
                    <option value="High">🔴 High (Cao)</option>
                    <option value="Medium">🟠 Medium (Trung bình)</option>
                    <option value="Low">🟢 Low (Thấp)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái ban đầu</label>
                <select
                  value={newIssueForm.status}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm bg-white"
                >
                  <option value="To Do">⭕ To Do (Chưa làm)</option>
                  <option value="In Progress">⏳ In Progress (Đang làm)</option>
                  <option value="Done">✅ Done (Hoàn thành)</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateIssue(false)} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                  Tạo mới ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jira-style Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          spaceKey={space.key}
          onClose={() => setSelectedIssue(null)}
          onUpdateIssue={(updatedIssue) => {
            setIssues(issues.map(i => i.id === updatedIssue.id ? updatedIssue : i));
            setSelectedIssue(updatedIssue);
          }}
        />
      )}
    </div>
  );
}
