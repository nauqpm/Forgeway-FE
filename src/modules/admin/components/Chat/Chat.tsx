"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Camera,
  Check,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  Paperclip,
  PhoneOff,
  Plus,
  Search,
  Send,
  Smile,
  MessageSquare,
  UserPlus,
  Users,
  Video,
  VideoOff,
} from "lucide-react";

type ChatKind = "direct" | "group";

type Conversation = {
  id: string;
  kind: ChatKind;
  name: string;
  status: string;
  initials: string;
  color: string;
  members: string[];
  lastMessage: string;
  lastTime: string;
  unread?: number;
  online?: boolean;
};

type ChatMessage = {
  id: string;
  author: string;
  content: string;
  time: string;
  mine?: boolean;
};

const conversations: Conversation[] = [
  {
    id: "direct-minh",
    kind: "direct",
    name: "Minh Nguyen",
    status: "Online",
    initials: "MN",
    color: "bg-emerald-500",
    members: ["Minh Nguyen"],
    lastMessage: "I pushed the workspace invite update.",
    lastTime: "09:42",
    online: true,
  },
  {
    id: "group-platform",
    kind: "group",
    name: "SDLC Platform Team",
    status: "8 members",
    initials: "SP",
    color: "bg-indigo-600",
    members: ["Minh Nguyen", "Linh Tran", "Quan Pham", "Hoang Nam"],
    lastMessage: "Standup starts in 15 minutes.",
    lastTime: "09:31",
    unread: 3,
    online: true,
  },
  {
    id: "direct-linh",
    kind: "direct",
    name: "Linh Tran",
    status: "Away",
    initials: "LT",
    color: "bg-sky-500",
    members: ["Linh Tran"],
    lastMessage: "Can you review the board filters?",
    lastTime: "Yesterday",
  },
  {
    id: "group-admin",
    kind: "group",
    name: "Admin Ops",
    status: "5 members",
    initials: "AO",
    color: "bg-amber-500",
    members: ["Admin Ops", "Security", "Workspace Owners"],
    lastMessage: "Permission matrix is ready.",
    lastTime: "Mon",
  },
];

const messageSeed: Record<string, ChatMessage[]> = {
  "direct-minh": [
    {
      id: "m1",
      author: "Minh Nguyen",
      content: "I pushed the workspace invite update. Copy link now creates a fresh invitation.",
      time: "09:36",
    },
    {
      id: "m2",
      author: "You",
      content: "Nice. I will check the login redirect and then we can review the chat UI.",
      time: "09:38",
      mine: true,
    },
    {
      id: "m3",
      author: "Minh Nguyen",
      content: "Great. Ping me when you want to test the 1-1 call state.",
      time: "09:42",
    },
  ],
  "group-platform": [
    {
      id: "p1",
      author: "Quan Pham",
      content: "Standup starts in 15 minutes. Please drop blockers here.",
      time: "09:31",
    },
    {
      id: "p2",
      author: "Linh Tran",
      content: "I am checking responsive layout on the workspace board.",
      time: "09:33",
    },
    {
      id: "p3",
      author: "You",
      content: "I am building chat and video call entry points in the sidebar.",
      time: "09:35",
      mine: true,
    },
  ],
  "direct-linh": [
    {
      id: "l1",
      author: "Linh Tran",
      content: "Can you review the board filters after the chat page lands?",
      time: "Yesterday",
    },
  ],
  "group-admin": [
    {
      id: "a1",
      author: "Security",
      content: "Permission matrix is ready. The admin chat tab should remain behind authenticated layout.",
      time: "Mon",
    },
  ],
};

const callParticipants = [
  { name: "You", initials: "YO", speaking: true, muted: false },
  { name: "Minh Nguyen", initials: "MN", speaking: false, muted: false },
  { name: "Linh Tran", initials: "LT", speaking: false, muted: true },
  { name: "Quan Pham", initials: "QP", speaking: false, muted: false },
];

export default function AdminChat() {
  const [selectedId, setSelectedId] = useState(conversations[0].id);
  const [filter, setFilter] = useState<"all" | ChatKind>("all");
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [showCallChat, setShowCallChat] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);

  const selected = conversations.find((item) => item.id === selectedId) ?? conversations[0];
  const messages = messageSeed[selected.id] ?? [];

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations.filter((item) => {
      const matchesFilter = filter === "all" || item.kind === filter;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.members.some((member) => member.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const handleSend = () => {
    if (!composer.trim()) return;
    setComposer("");
  };

  const startCall = () => {
    setCallActive(true);
    setShowCallChat(false);
  };

  const endCall = () => {
    setCallActive(false);
    setShowCallChat(false);
  };

  const chatPane = (compact = false) => (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-gray-900">
      <header className="shrink-0 flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-gray-800">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold text-white ${selected.color}`}>
            {selected.initials}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-slate-950 dark:text-white">{selected.name}</h2>
            <p className="truncate text-xs text-slate-500 dark:text-gray-400">
              {selected.kind === "direct" ? selected.status : selected.members.join(", ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!compact && (
            <button className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
              <Bell className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={startCall}
            className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700"
          >
            <Video className="h-4 w-4" />
          </button>
          {!compact && (
            <button className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50 px-4 py-6 dark:bg-gray-950">
        <div className={`mx-auto flex flex-col gap-4 ${compact ? "max-w-full" : "max-w-3xl"}`}>
          <div className="self-center rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm dark:bg-gray-900 dark:text-gray-400">
            Today
          </div>
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                message.mine
                  ? "rounded-br-md bg-indigo-600 text-white"
                  : "rounded-bl-md border border-slate-200 bg-white text-slate-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              }`}>
                {!message.mine && (
                  <p className="mb-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">{message.author}</p>
                )}
                <p className="text-sm leading-6">{message.content}</p>
                <p className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${message.mine ? "text-indigo-100" : "text-slate-400"}`}>
                  {message.time}
                  {message.mine && <Check className="h-3 w-3" />}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="shrink-0 border-t border-slate-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className={`mx-auto flex items-end gap-2 ${compact ? "max-w-full" : "max-w-3xl"}`}>
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            value={composer}
            onChange={(event) => setComposer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder={`Message ${selected.name}`}
            className="max-h-28 min-h-10 flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
            <Smile className="h-4 w-4" />
          </button>
          <button
            onClick={handleSend}
            disabled={!composer.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed dark:disabled:bg-indigo-950"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </main>
  );

  const callPane = (withChat = false) => (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-950 text-white">
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold text-white ${selected.color}`}>
            {selected.initials}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">Video call with {selected.name}</h2>
            <p className="truncate text-xs text-slate-400">
              {selected.kind === "direct" ? "1-1 call" : `${selected.members.length} group members`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCallChat((value) => !value)}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${
              showCallChat
                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-white/10 text-slate-100 hover:bg-white/15"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
            <UserPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <div className={`grid h-full min-h-0 gap-3 ${withChat ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
          {callParticipants.slice(0, selected.kind === "direct" ? 2 : 4).map((participant, index) => (
            <div
              key={participant.name}
              className={`relative overflow-hidden rounded-lg border bg-slate-900 ${
                participant.speaking ? "border-emerald-400" : "border-white/10"
              } ${!withChat && index === 0 && selected.kind === "direct" ? "md:col-span-2" : ""}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,.38),transparent_34%),linear-gradient(135deg,#0f172a,#111827)]" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/10 text-xl font-bold">
                  {participant.initials}
                </span>
              </div>
              <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-black/45 px-2 py-1 text-xs">
                {participant.muted && <MicOff className="h-3 w-3 text-red-300" />}
                <span>{participant.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setMuted((value) => !value)}
            className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${
              muted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setCameraOn((value) => !value)}
            className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${
              cameraOn ? "bg-white/10 text-white hover:bg-white/15" : "bg-red-500 text-white"
            }`}
          >
            {cameraOn ? <Camera className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15">
            <MonitorUp className="h-5 w-5" />
          </button>
          <button
            onClick={endCall}
            className="grid h-11 w-11 place-items-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-500"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );

  if (callActive) {
    return (
      <div className="m-[calc(var(--app-page-pad-y)*-1)] mx-[calc(var(--app-page-pad)*-1)] h-[calc(100dvh-var(--app-header-h))] overflow-hidden bg-slate-950">
        <div className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
          {showCallChat && (
            <div className="flex min-h-0 min-w-0 border-b border-slate-200 dark:border-gray-800 lg:w-[420px] lg:shrink-0 lg:border-b-0 lg:border-r">
              {chatPane(true)}
            </div>
          )}
          {callPane(showCallChat)}
        </div>
      </div>
    );
  }

  return (
    <div className="m-[calc(var(--app-page-pad-y)*-1)] mx-[calc(var(--app-page-pad)*-1)] h-[calc(100dvh-var(--app-header-h))] overflow-hidden bg-slate-50 dark:bg-gray-950">
      <div className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
        <aside className="flex min-h-0 w-full shrink-0 flex-col border-b border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:w-80 lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-slate-100 p-4 dark:border-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Chat</h1>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-gray-800">
              {[
                { value: "all", label: "All" },
                { value: "direct", label: "1-1" },
                { value: "group", label: "Groups" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value as "all" | ChatKind)}
                  className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                    filter === item.value
                      ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-900 dark:text-indigo-300"
                      : "text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                  selected.id === conversation.id
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold text-white ${conversation.color}`}>
                  {conversation.initials}
                  {conversation.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-gray-900" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{conversation.name}</span>
                    {conversation.kind === "group" && <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                  </span>
                  <span className="block truncate text-xs text-slate-500 dark:text-gray-400">{conversation.lastMessage}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[11px] text-slate-400">{conversation.lastTime}</span>
                  {conversation.unread && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
                      {conversation.unread}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {chatPane()}
      </div>
    </div>
  );
}
