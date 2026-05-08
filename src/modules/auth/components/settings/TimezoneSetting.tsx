'use client';

import React, { useMemo, useState } from 'react';
import { useTimezone } from '../../hooks/useTimezone';
import { Globe, Search, RotateCcw, Check } from 'lucide-react';

const TimezoneSetting: React.FC = () => {
  const { timezone, updateTimezone } = useTimezone();
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const allTimezones = useMemo(() => {
    try { return Intl.supportedValuesOf('timeZone'); }
    catch { return ['UTC', 'Asia/Ho_Chi_Minh', 'Asia/Tokyo', 'America/New_York', 'Europe/London']; }
  }, []);

  const filtered = useMemo(() => {
    if (!search) return allTimezones.slice(0, 20);
    const q = search.toLowerCase();
    return allTimezones.filter((tz) => tz.toLowerCase().includes(q)).slice(0, 20);
  }, [allTimezones, search]);

  const handleSelect = async (tz: string) => {
    setSaving(true);
    try { await updateTimezone(tz); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch { /* Best-effort */ }
    finally { setSaving(false); }
  };

  const now = new Date();
  const preview = new Intl.DateTimeFormat('vi-VN', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(now);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Múi giờ</h3>
        </div>
        {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" />Đã lưu</span>}
      </div>

      <div className="p-3 bg-indigo-50 rounded-xl text-sm">
        <span className="text-gray-600">Hiện tại: </span>
        <span className="font-medium text-indigo-700">{timezone}</span>
        <span className="text-gray-500 ml-2">({preview})</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm múi giờ..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>

      <div className="max-h-60 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2">
        {filtered.map((tz) => (
          <button key={tz} onClick={() => handleSelect(tz)} disabled={saving}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              tz === timezone ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
            } disabled:opacity-50`}>
            {tz}
          </button>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Không tìm thấy múi giờ</p>}
      </div>

      <button onClick={() => handleSelect(Intl.DateTimeFormat().resolvedOptions().timeZone)}
        className="w-full py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
        <RotateCcw className="w-3.5 h-3.5" />Sử dụng múi giờ trình duyệt
      </button>
    </div>
  );
};

export default TimezoneSetting;