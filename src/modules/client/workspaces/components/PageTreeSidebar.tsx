"use client";

import React, { useState, useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, ChevronDown, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

export interface PageNode {
  id: string;
  title: string;
  children?: PageNode[];
}

interface FlattenedItem extends PageNode {
  parentId: string | null;
  depth: number;
}

interface SortableTreeItemProps {
  item: FlattenedItem;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  workspaceId: string;
}

const SortableTreeItem = ({ item, isExpanded, onToggle, workspaceId }: SortableTreeItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${item.depth * 20 + 8}px`,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-1.5 py-1.5 pr-2 rounded-[6px] group ${isDragging ? 'bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.08)] z-50 relative' : 'hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] bg-white dark:bg-transparent'}`}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#787774] dark:hover:text-[#9B9A97]">
        <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
        </svg>
      </div>

      <button onClick={() => onToggle(item.id)} className={`p-0.5 rounded-[4px] text-[#ABABAB] dark:text-[#6B6B6B] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors ${!hasChildren ? 'invisible' : ''}`}>
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      <Link href={`/workspaces/${workspaceId}/pages/${item.id}`} className="flex-1 flex items-center gap-2 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:text-[#2563EB] dark:hover:text-[#3B82F6] font-medium truncate">
        <FileText className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B] shrink-0" />
        <span className="truncate">{item.title}</span>
      </Link>
    </div>
  );
};

export default function PageTreeSidebar({ initialData, workspaceId }: { initialData: PageNode[], workspaceId: string }) {
  const [items, setItems] = useState<PageNode[]>(initialData);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(initialData.map(i => i.id)));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const flattenedItems = useMemo(() => {
    const flatten = (nodes: PageNode[], depth = 0, parentId: string | null = null): FlattenedItem[] => {
      return nodes.reduce<FlattenedItem[]>((acc, node) => {
        const isExpanded = expandedIds.has(node.id);
        const children = isExpanded ? flatten(node.children || [], depth + 1, node.id) : [];
        return [
          ...acc,
          { ...node, depth, parentId },
          ...children
        ];
      }, []);
    };
    return flatten(items);
  }, [items, expandedIds]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const newItems = JSON.parse(JSON.stringify(items));
      
      const findNodeArrayAndIndex = (nodes: any[], id: string): [any[], number] | null => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === id) return [nodes, i];
          if (nodes[i].children) {
            const res = findNodeArrayAndIndex(nodes[i].children, id);
            if (res) return res;
          }
        }
        return null;
      };

      const activeResult = findNodeArrayAndIndex(newItems, active.id as string);
      const overResult = findNodeArrayAndIndex(newItems, over.id as string);

      if (activeResult && overResult) {
        const [activeArr, activeIdx] = activeResult;
        const [overArr, overIdx] = overResult;
        
        const [removed] = activeArr.splice(activeIdx, 1);
        overArr.splice(overIdx, 0, removed);
        setItems(newItems);
      }
    }
  };

  return (
    <div className="w-[var(--workspace-list-sidebar-w)] border-r border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] flex flex-col rounded-l-[8px] overflow-hidden shrink-0">
      <div className="p-[var(--workspace-surface-pad)] border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between">
        <h3 className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Docs</h3>
        <Link href={`/workspaces/${workspaceId}/pages/create`} className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[4px] text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.08]">
          <Plus className="w-4 h-4" />
        </Link>
      </div>
      <div className="p-2 flex-1 overflow-y-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={flattenedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {flattenedItems.map(item => (
              <SortableTreeItem 
                key={item.id} 
                item={item} 
                isExpanded={expandedIds.has(item.id)} 
                onToggle={toggleExpand} 
                workspaceId={workspaceId}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
