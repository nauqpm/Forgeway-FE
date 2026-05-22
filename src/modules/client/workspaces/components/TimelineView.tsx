import React, { useState, useMemo, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { addDays, differenceInDays, format, eachDayOfInterval, isToday, startOfMonth, isSameMonth } from 'date-fns';
import { Calendar, ZoomIn, ZoomOut, Search, ChevronRight } from 'lucide-react';

interface TimelineViewProps {
  issues: any[];
  sprints: any[];
  onUpdateIssueDate: (id: string, start: string, end: string) => void;
  onClickTask?: (issue: any) => void;
}

export default function TimelineView({ issues, sprints, onUpdateIssueDate, onClickTask }: TimelineViewProps) {
  const [pixelsPerDay, setPixelsPerDay] = useState(40); // Zoom level
  const [activeTooltip, setActiveTooltip] = useState<{ id: string, start: string, end: string, x: number, y: number } | null>(null);
  
  const ROW_HEIGHT = 48;

  // Flatten and prepare data
  const items = useMemo(() => {
    const result: any[] = [];
    sprints.forEach(sprint => {
      // Create Sprint Row
      const sStart = sprint.startDate || new Date().toISOString().split('T')[0];
      const sEnd = sprint.endDate || addDays(new Date(), 14).toISOString().split('T')[0];
      result.push({
        id: `sprint-${sprint.id}`,
        originalId: sprint.id,
        title: sprint.name,
        startDate: sStart,
        endDate: sEnd,
        type: 'sprint',
        color: 'bg-indigo-100',
        textColor: 'text-indigo-800',
        borderColor: 'border-indigo-300'
      });
      
      // Create Tasks Rows for this sprint
      const sprintIssues = issues.filter(i => i.sprintId === sprint.id);
      sprintIssues.forEach(issue => {
        const iStart = issue.startDate || sStart;
        const iEnd = issue.endDate || addDays(new Date(iStart), 3).toISOString().split('T')[0];
        
        let color = 'bg-blue-500/90';
        if (issue.status === 'Done') color = 'bg-emerald-500/90';
        if (issue.type === 'Bug') color = 'bg-red-500/90';

        result.push({
          ...issue,
          id: `task-${issue.id}`,
          originalId: issue.id,
          startDate: iStart,
          endDate: iEnd,
          type: 'task',
          color,
          textColor: 'text-white',
          borderColor: color.replace('/90', '') 
        });
      });
    });

    // Backlog tasks
    const backlogIssues = issues.filter(i => i.sprintId === null);
    if (backlogIssues.length > 0) {
      result.push({
        id: 'backlog-header',
        title: 'Backlog',
        type: 'header',
      });
      backlogIssues.forEach(issue => {
        const iStart = issue.startDate || new Date().toISOString().split('T')[0];
        const iEnd = issue.endDate || addDays(new Date(iStart), 3).toISOString().split('T')[0];
        result.push({
          ...issue,
          id: `task-${issue.id}`,
          originalId: issue.id,
          startDate: iStart,
          endDate: iEnd,
          type: 'task',
          color: 'bg-gray-500/90',
          textColor: 'text-white',
          borderColor: 'border-gray-400'
        });
      });
    }

    return result;
  }, [issues, sprints]);

  // Calculate timeline min/max boundaries
  const { minDate, maxDate, daysArray } = useMemo(() => {
    let min = new Date();
    let max = new Date();
    items.forEach(item => {
      if (item.type === 'header') return;
      const s = new Date(item.startDate);
      const e = new Date(item.endDate);
      if (s < min) min = s;
      if (e > max) max = e;
    });
    // Padding
    min = addDays(min, -7);
    max = addDays(max, 30);
    
    return { 
      minDate: min, 
      maxDate: max,
      daysArray: eachDayOfInterval({ start: min, end: max })
    };
  }, [items]);

  const totalWidth = daysArray.length * pixelsPerDay;

  // Sync scroll
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const handleRightScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (leftRef.current) {
      leftRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };
  const handleLeftScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (rightRef.current) {
      rightRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Drag & Resize Handlers
  const handleDragStop = (id: string, originalId: string, newX: number) => {
    setActiveTooltip(null);
    const daysShifted = Math.round(newX / pixelsPerDay);
    const newStartDate = format(addDays(minDate, daysShifted), 'yyyy-MM-dd');
    
    const item = items.find(i => i.id === id);
    if (!item) return;
    const duration = differenceInDays(new Date(item.endDate), new Date(item.startDate));
    const newEndDate = format(addDays(new Date(newStartDate), duration), 'yyyy-MM-dd');
    
    if (item.type === 'task') {
      onUpdateIssueDate(originalId, newStartDate, newEndDate);
    }
  };

  const handleResizeStop = (id: string, originalId: string, newX: number, newWidth: number) => {
    setActiveTooltip(null);
    const newStartDays = Math.round(newX / pixelsPerDay);
    const newStartDate = format(addDays(minDate, newStartDays), 'yyyy-MM-dd');
    
    const durationDays = Math.round(newWidth / pixelsPerDay);
    const newEndDate = format(addDays(new Date(newStartDate), durationDays), 'yyyy-MM-dd');
    
    const item = items.find(i => i.id === id);
    if (item && item.type === 'task') {
      onUpdateIssueDate(originalId, newStartDate, newEndDate);
    }
  };

  const handleDrag = (e: any, d: any, item: any) => {
    const startD = format(addDays(minDate, Math.round(d.x / pixelsPerDay)), 'MMM dd');
    const duration = differenceInDays(new Date(item.endDate), new Date(item.startDate));
    const endD = format(addDays(minDate, Math.round(d.x / pixelsPerDay) + duration), 'MMM dd');
    setActiveTooltip({ id: item.id, start: startD, end: endD, x: e.clientX, y: e.clientY - 40 });
  };

  const handleResize = (e: any, direction: any, ref: any, delta: any, position: any, item: any) => {
    const startD = format(addDays(minDate, Math.round(position.x / pixelsPerDay)), 'MMM dd');
    const duration = Math.round(ref.offsetWidth / pixelsPerDay);
    const endD = format(addDays(minDate, Math.round(position.x / pixelsPerDay) + duration), 'MMM dd');
    setActiveTooltip({ id: item.id, start: startD, end: endD, x: e.clientX, y: e.clientY - 40 });
  };

  return (
    <div className="workspace-list-height bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col font-sans text-gray-700 dark:text-gray-200 relative">
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANEL: Lists */}
        <div className="w-[var(--workspace-list-sidebar-w)] flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col z-10 shadow-[4px_0_12px_rgba(0,0,0,0.03)]">
          {/* Header */}
          <div className="h-[60px] border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center px-4 shrink-0">
            <span className="font-semibold text-sm text-gray-500 dark:text-gray-400">Work Items</span>
          </div>
          {/* List Content */}
          <div 
            ref={leftRef}
            onScroll={handleLeftScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-20"
          >
            {items.map((item, i) => (
              <div 
                key={item.id} 
                className={`h-[48px] flex items-center px-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${item.type === 'sprint' ? 'bg-gray-50/80' : item.type === 'header' ? 'bg-gray-100 dark:bg-gray-800 font-bold' : ''} ${item.type === 'task' ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (item.type === 'task' && onClickTask) {
                    const originalTask = issues.find(i => i.id === item.originalId) || item;
                    onClickTask(originalTask);
                  }
                }}
              >
                {item.type === 'sprint' && <ChevronRight className="w-4 h-4 mr-2 text-indigo-500" />}
                {item.type === 'task' && <div className="w-4 h-4 mr-2 ml-4 rounded-sm flex items-center justify-center bg-gray-100 dark:bg-gray-800"><span className={`w-2 h-2 rounded-full ${item.status === 'Done' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span></div>}
                <span className={`text-sm truncate ${item.type === 'sprint' ? 'font-semibold text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-200'}`}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Timeline Grid & Bars */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden flex flex-col bg-white dark:bg-gray-900 custom-scrollbar relative">
          
          {/* Header Grid (Sticky Top) */}
          <div className="h-[60px] shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex sticky top-0 z-20" style={{ width: totalWidth }}>
            {daysArray.map((day, i) => {
              const isFirstOfMonth = day.getDate() === 1;
              return (
                <div 
                  key={i} 
                  className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center justify-end pb-1 relative"
                  style={{ width: pixelsPerDay }}
                >
                  {/* Month Label (only show occasionally to prevent clutter) */}
                  {(isFirstOfMonth || i === 0) && (
                    <span className="absolute top-1 left-2 text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                      {format(day, 'MMM yyyy')}
                    </span>
                  )}
                  {/* Day Label */}
                  <span className={`text-[10px] font-medium ${isToday(day) ? 'text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-1 rounded' : 'text-gray-500 dark:text-gray-400'}`}>
                    {format(day, 'dd')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Body Grid & Content */}
          <div 
            ref={rightRef}
            onScroll={handleRightScroll}
            className="flex-1 overflow-y-auto relative pb-20"
            style={{ width: totalWidth }}
          >
            {/* Grid Lines Overlay */}
            <div className="absolute inset-0 flex pointer-events-none z-0">
              {daysArray.map((day, i) => (
                <div 
                  key={i} 
                  className={`flex-shrink-0 border-r ${isToday(day) ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10' : 'border-gray-100 dark:border-gray-800'}`}
                  style={{ width: pixelsPerDay }}
                />
              ))}
            </div>

            {/* Today Marker */}
            {daysArray.findIndex(d => isToday(d)) !== -1 && (
              <div 
                className="absolute top-0 bottom-0 border-l-2 border-indigo-400 dark:border-indigo-500 z-10 pointer-events-none shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                style={{ left: daysArray.findIndex(d => isToday(d)) * pixelsPerDay + (pixelsPerDay / 2) }}
              />
            )}

            {/* Rows & Bars */}
            <div className="relative z-10">
              {items.map((item, i) => {
                if (item.type === 'header') return <div key={i} className="h-[48px] border-b border-gray-100 dark:border-gray-800" />;
                
                const left = differenceInDays(new Date(item.startDate), minDate) * pixelsPerDay;
                const width = Math.max(1, differenceInDays(new Date(item.endDate), new Date(item.startDate))) * pixelsPerDay;

                return (
                  <div key={item.id} className="h-[48px] border-b border-gray-100 dark:border-gray-800 relative flex items-center hover:bg-gray-50/50 dark:hover:bg-gray-800/50 group">
                    <Rnd
                      bounds="parent"
                      dragAxis="x"
                      enableResizing={{ left: true, right: true, top: false, bottom: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                      position={{ x: left, y: 8 }}
                      size={{ width: width, height: 32 }}
                      onDrag={(e, d) => handleDrag(e, d, item)}
                      onDragStop={(e, d) => handleDragStop(item.id, item.originalId, d.x)}
                      onResize={(e, dir, ref, delta, pos) => handleResize(e, dir, ref, delta, pos, item)}
                      onResizeStop={(e, dir, ref, delta, pos) => handleResizeStop(item.id, item.originalId, pos.x, ref.offsetWidth)}
                      onClick={() => {
                        // Prevent click if we just dragged. We can do a simple check or just allow click.
                        // Actually, Rnd has onDragStop which handles drags, but standard onClick still fires.
                        // Let's pass the issue to onClickTask if it's a task.
                        if (item.type === 'task' && onClickTask) {
                          const originalTask = issues.find(i => i.id === item.originalId) || item;
                          onClickTask(originalTask);
                        }
                      }}
                      className={`absolute rounded-md shadow-sm flex items-center px-3 text-xs font-semibold ${item.textColor} overflow-hidden cursor-pointer border-l-4 ${item.borderColor} ${item.color} hover:brightness-105 transition-[filter] backdrop-blur-sm`}
                      minWidth={pixelsPerDay}
                    >
                      <span className="truncate drop-shadow-sm">{item.title}</span>
                    </Rnd>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-6 right-6 z-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg flex items-center p-1.5 gap-1">
        <button 
          onClick={() => setPixelsPerDay(Math.max(10, pixelsPerDay - 10))}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
        <span className="text-xs font-mono font-medium px-2 text-gray-600 dark:text-gray-300">{pixelsPerDay}px</span>
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
        <button
          onClick={() => setPixelsPerDay(Math.min(100, pixelsPerDay + 10))}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Tooltip */}
      {activeTooltip && (
        <div 
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs px-3 py-2 rounded shadow-xl pointer-events-none font-mono"
          style={{ left: activeTooltip.x, top: activeTooltip.y }}
        >
          {activeTooltip.start} - {activeTooltip.end}
        </div>
      )}

      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}} />
    </div>
  );
}
