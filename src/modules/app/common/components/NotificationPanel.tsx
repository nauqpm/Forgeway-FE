"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Bell, X, MoreHorizontal, FileText, Settings, Maximize2, Flag, Check } from "lucide-react";

interface Notification {
  id: string;
  actor: { name: string; avatar: string };
  actionText: string;
  target?: { id: string; key: string; title: string; type: string };
  createdAt: string;
  isRead: boolean;
  category: 'DIRECT' | 'WATCHING';
  type: 'STANDARD' | 'INVITE';
  inviteData?: { spaceName: string; message: string };
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    actor: { name: "Maria Garcia", avatar: "M" },
    actionText: "invited you to a space",
    createdAt: new Date().toISOString(), // Today
    isRead: false,
    category: "DIRECT",
    type: "INVITE",
    inviteData: {
      spaceName: "team dev",
      message: "Hey! Join our dev space to track tasks."
    }
  },
  {
    id: "2",
    actor: { name: "Nguyễn Văn A", avatar: "N" },
    actionText: "changed status to Done",
    target: { id: "102", key: "TEAMD-102", title: "Fix lỗi hiển thị sai font chữ trên Safari", type: "Bug" },
    createdAt: new Date().toISOString(), // Today
    isRead: false,
    category: "WATCHING",
    type: "STANDARD"
  },
  {
    id: "3",
    actor: { name: "Trần Thị B", avatar: "T" },
    actionText: "assigned this issue to you",
    target: { id: "105", key: "TEAMD-105", title: "Nghiên cứu kiến trúc Micro-frontend", type: "Story" },
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    isRead: true,
    category: "DIRECT",
    type: "STANDARD"
  },
  {
    id: "4",
    actor: { name: "Lê Văn C", avatar: "L" },
    actionText: "commented on",
    target: { id: "101", key: "TEAMD-101", title: "Thiết kế lại luồng đăng nhập", type: "Task" },
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), // Older
    isRead: false,
    category: "WATCHING",
    type: "STANDARD"
  }
];

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'WATCHING'>('DIRECT');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [dismissBanner, setDismissBanner] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap & keyboard navigation could be added here

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setShowMenu(false);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab === 'DIRECT' && n.category !== 'DIRECT') return false;
      if (activeTab === 'WATCHING' && n.category !== 'WATCHING') return false;
      if (showUnreadOnly && n.isRead) return false;
      return true;
    });
  }, [notifications, activeTab, showUnreadOnly]);

  const groupedNotifications = useMemo(() => {
    return filteredNotifications.reduce((groups, notif) => {
      const date = new Date(notif.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key = 'Older';
      if (date.toDateString() === today.toDateString()) {
        key = 'Latest';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(notif);
      return groups;
    }, {} as Record<string, Notification[]>);
  }, [filteredNotifications]);

  const groupOrder = ['Latest', 'Yesterday', 'Older'];

  return (
    <div className="absolute right-0 top-12 w-[400px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 z-50 flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-200" ref={panelRef}>
      {/* Header */}
      <div className="px-4 pt-4 pb-0 border-b border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs font-medium text-gray-600">Only show unread</span>
              <button 
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`w-8 h-4 rounded-full relative transition-colors ${showUnreadOnly ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${showUnreadOnly ? 'translate-x-4.5 left-0.5' : 'left-0.5'}`} />
              </button>
            </div>
            
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Fullscreen">
              <Maximize2 className="w-4 h-4" />
            </button>
            
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <button onClick={markAllAsRead} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Check className="w-4 h-4 text-gray-400" />
                    Mark all as read
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    Notification settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('DIRECT')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'DIRECT' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Direct
          </button>
          <button 
            onClick={() => setActiveTab('WATCHING')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'WATCHING' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Watching
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
        {!dismissBanner && (
          <div className="mx-4 mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-3 relative">
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-900">Connect to Slack/Teams</p>
              <p className="text-xs text-indigo-700 mt-1">Get notifications where you work. Set up integrations to stay in the loop.</p>
            </div>
            <button onClick={() => setDismissBanner(true)} className="p-1 hover:bg-indigo-100 rounded text-indigo-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-900">You're all caught up!</p>
            <p className="text-sm text-gray-500 mt-1">No new notifications here.</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {groupOrder.map(group => {
              const items = groupedNotifications[group];
              if (!items || items.length === 0) return null;

              return (
                <div key={group}>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{group}</h3>
                  <div className="space-y-1">
                    {items.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => markAsRead(notif.id)}
                        className={`relative p-3 rounded-xl transition-all cursor-pointer group hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 ${!notif.isRead ? 'bg-indigo-50/40' : ''}`}
                      >
                        {!notif.isRead && (
                          <div className="absolute top-4 right-3 w-2.5 h-2.5 bg-[#0c66e4] rounded-full" />
                        )}
                        
                        <div className="flex items-start gap-3 pr-6">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                            {notif.actor.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 leading-snug">
                              <span className="font-semibold text-gray-900">{notif.actor.name}</span> {notif.actionText}
                            </p>
                            
                            {notif.type === 'STANDARD' && notif.target && (
                              <div className="mt-1.5 flex items-center gap-1.5 bg-white border border-gray-200 rounded p-1.5 w-fit hover:border-indigo-300 transition-colors">
                                <FileText className={`w-3.5 h-3.5 ${notif.target.type === 'Bug' ? 'text-red-500' : notif.target.type === 'Story' ? 'text-emerald-500' : 'text-indigo-500'}`} />
                                <span className="text-xs font-medium text-gray-700">{notif.target.key}: {notif.target.title}</span>
                              </div>
                            )}

                            {notif.type === 'INVITE' && notif.inviteData && (
                              <div className="mt-2 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                <p className="text-sm font-semibold text-gray-900">{notif.inviteData.spaceName}</p>
                                <p className="text-xs text-gray-600 mt-1 italic">"{notif.inviteData.message}"</p>
                                <button className="mt-3 bg-[#0c66e4] hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors w-full">
                                  Join the space
                                </button>
                              </div>
                            )}

                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notif.createdAt).toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            <div className="flex flex-col items-center justify-center py-6 border-t border-gray-100">
              <Flag className="w-5 h-5 text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 text-center max-w-[200px]">
                That's all your notifications from the last 30 days.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
