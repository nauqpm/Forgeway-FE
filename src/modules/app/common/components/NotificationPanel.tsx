"use client";
import { useEffect, useState } from "react";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { Bell, Check, X } from "lucide-react";

interface Notification {
  _id: string;
  title: string;
  message?: string;
  type: string;
  isRead: boolean;
  targetType?: string;
  targetId?: string;
  createdAt: string;
}

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get(apiRoutes.NOTIFICATIONS.BASE);
        setNotifications(res.data);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.put(apiRoutes.NOTIFICATIONS.READ(id));
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put(apiRoutes.NOTIFICATIONS.READ_ALL);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  return (
    <div className="absolute right-4 top-14 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Mark all read</button>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No notifications</div>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!n.isRead ? "bg-indigo-50/50" : ""}`} onClick={() => markAsRead(n._id)}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
