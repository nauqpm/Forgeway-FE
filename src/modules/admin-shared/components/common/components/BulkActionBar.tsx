import React, { useEffect, useRef, useState } from 'react';
import { X, Trash2, ChevronUp, ArrowRightCircle } from 'lucide-react';
import AssigneePicker, { AssigneePickerUser } from '@/shared/components/AssigneePicker';
import StatusPicker from '@/shared/components/StatusPicker';
import PriorityPicker from '@/shared/components/PriorityPicker';
import TypePicker from '@/shared/components/TypePicker';

interface SprintOption {
  id: string;
  name: string;
}

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBulkUpdate: (updates: Record<string, any>) => Promise<void>;
  onDelete: () => void;
  members?: AssigneePickerUser[];
  sprints?: SprintOption[];
  onMoveSprint?: (sprintId: string | null) => void;
  canEditTask?: boolean;
  canDeleteTask?: boolean;
  canMoveTask?: boolean;
}

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Done'];

const PICKER_CLS =
  '[&>button]:!h-8 [&>button]:!py-0 [&>button]:!flex [&>button]:!items-center [&>button]:!text-sm [&>button]:!font-medium [&>button]:!bg-transparent [&>button]:!border-white/[0.08] [&>button]:!text-[#9B9A97] [&>button]:hover:!bg-white/8 [&>button]:hover:!text-[#E8E8E7] [&>button]:hover:!border-white/[0.18] [&>button]:!rounded-[6px]';

const menuCls =
  'absolute bottom-full mb-2 left-0 min-w-[9rem] bg-[#2A2A2A] border border-white/[0.08] rounded-[8px] py-1 z-10';
const menuShadow = { boxShadow: '0 8px 32px rgba(0,0,0,0.32)' };
const menuItemCls =
  'w-full text-left px-4 py-[7px] text-sm text-[#9B9A97] hover:bg-white/8 hover:text-[#E8E8E7] transition-colors';

const BTN = 'h-8 flex items-center gap-1.5 px-3 rounded-[6px] text-sm font-medium transition-colors border';
const BTN_DEFAULT = `${BTN} border-white/[0.08] text-[#9B9A97] hover:bg-white/8 hover:text-[#E8E8E7] hover:border-white/[0.18]`;
const BTN_ACTIVE  = `${BTN} bg-white/10 text-[#E8E8E7] border-white/[0.18]`;

export default function BulkActionBar({
  selectedCount,
  onClear,
  onBulkUpdate,
  onDelete,
  members = [],
  sprints,
  onMoveSprint,
  canEditTask = true,
  canDeleteTask = true,
  canMoveTask = true,
}: BulkActionBarProps) {
  const [showSprintMenu, setShowSprintMenu] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setShowSprintMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showSprintMenu) setShowSprintMenu(false);
      else if (selectedCount > 0) onClear();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSprintMenu, selectedCount, onClear]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apply = async (updates: Record<string, any>) => {
    setShowSprintMenu(false);
    await onBulkUpdate(updates);
  };

  if (selectedCount === 0) return null;

  return (
    <div
      data-bulk-action-bar="true"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300"
      ref={barRef}
    >
      <div
        className="bg-[#202020] text-[#E8E8E7] rounded-[10px] px-3 py-2 flex items-center gap-2 border border-white/[0.12]"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)' }}
      >
        {/* Badge */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/[0.08] shrink-0 h-8">
          <div className="bg-[#2563EB] min-w-[1.5rem] h-6 px-1 rounded-[4px] flex items-center justify-center text-xs font-bold">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-[#9B9A97] whitespace-nowrap">selected</span>
        </div>

        {/* Status */}
        {canEditTask && (
          <StatusPicker
            value={null}
            placeholder="Status"
            placement="top"
            options={STATUS_OPTIONS}
            onChange={(status) => apply({ status })}
            size="sm"
            variant="default"
            className={PICKER_CLS}
          />
        )}

        {/* Priority */}
        {canEditTask && (
          <PriorityPicker
            value={null}
            onChange={(priority) => apply({ priority })}
            placement="top"
            variant="default"
            className={PICKER_CLS}
          />
        )}

        {/* Type */}
        {canEditTask && (
          <TypePicker
            value={null}
            onChange={(type) => apply({ type })}
            placement="top"
            variant="default"
            size="sm"
            className={PICKER_CLS}
          />
        )}

        {/* Assignee */}
        {canEditTask && (
          <div className="[&_button]:!h-8 [&_button]:!py-0 [&_button]:!flex [&_button]:!items-center [&_button]:!text-sm [&_button]:!font-medium [&_button]:!w-auto [&_button]:!rounded-[6px] [&_button]:!border [&_button]:!border-white/[0.08] [&_button]:hover:!border-white/[0.18] [&_button]:!px-3 [&_button]:hover:!bg-white/8">
            <AssigneePicker
              users={members}
              value={null}
              onChange={(uid) => apply({ assigneeId: uid })}
              placement="top"
            />
          </div>
        )}

        {/* Move sprint */}
        {canMoveTask && onMoveSprint && (
          <div className="relative">
            <button
              onClick={() => setShowSprintMenu((p) => !p)}
              className={showSprintMenu ? BTN_ACTIVE : BTN_DEFAULT}
            >
              <ArrowRightCircle className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
              <span>Move sprint</span>
              <ChevronUp className="w-3 h-3 text-[#6B6B6B]" />
            </button>
            {showSprintMenu && (
              <div className={`${menuCls} min-w-[13rem] max-h-56 overflow-y-auto`} style={menuShadow}>
                <button
                  onClick={() => { onMoveSprint(null); setShowSprintMenu(false); }}
                  className={`${menuItemCls} italic text-[#6B6B6B] hover:text-[#9B9A97]`}
                >
                  Backlog (no sprint)
                </button>
                {sprints && sprints.length > 0 && (
                  <>
                    <div className="border-t border-white/[0.08] my-1" />
                    {sprints.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { onMoveSprint(s.id); setShowSprintMenu(false); }}
                        className={menuItemCls}
                      >
                        {s.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="w-px h-5 bg-white/[0.08] mx-0.5 shrink-0" />

        {/* Delete */}
        {canDeleteTask && (
          <button
            onClick={onDelete}
            className="h-8 flex items-center gap-1.5 px-3 rounded-[6px] text-sm font-medium text-[#F87171] hover:text-[#FCA5A5] hover:bg-[rgba(159,47,45,0.12)] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            Delete
          </button>
        )}

        {/* Deselect all */}
        <button
          onClick={onClear}
          className="h-8 w-8 flex items-center justify-center hover:bg-white/8 rounded-[6px] text-[#6B6B6B] hover:text-[#E8E8E7] transition-colors shrink-0"
          title="Deselect all (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
