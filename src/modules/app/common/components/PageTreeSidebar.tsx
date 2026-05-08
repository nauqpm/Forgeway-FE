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
  spaceId: string;
}

const SortableTreeItem = ({ item, isExpanded, onToggle, spaceId }: SortableTreeItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${item.depth * 20 + 8}px`,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-1.5 py-1.5 pr-2 rounded-lg group ${isDragging ? 'bg-indigo-50 z-50 relative' : 'hover:bg-gray-100 bg-white'}`}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600">
        <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
        </svg>
      </div>
      
      <button onClick={() => onToggle(item.id)} className={`p-0.5 rounded text-gray-400 hover:bg-gray-200 transition-colors ${!hasChildren ? 'invisible' : ''}`}>
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      <Link href={`/spaces/${spaceId}/pages/${item.id}`} className="flex-1 flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600 font-medium truncate">
        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="truncate">{item.title}</span>
      </Link>
    </div>
  );
};

export default function PageTreeSidebar({ initialData, spaceId }: { initialData: PageNode[], spaceId: string }) {
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
    <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col rounded-l-2xl overflow-hidden shrink-0">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Tài liệu</h3>
        <Link href={`/spaces/${spaceId}/pages/create`} className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors bg-white border border-gray-200 shadow-sm">
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
                spaceId={spaceId}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
