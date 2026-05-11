import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { LayoutDashboard, Baby, ClipboardCheck, MessageCircle, Send, Megaphone, Bell } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import DashboardLayout from "../../components/DashboardLayout";
import api, { formatApiError } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

const NAV = [
  { to: "/parent", label: "Dashboard", icon: LayoutDashboard },
  { to: "/parent/child", label: "My Child", icon: Baby },
  { to: "/parent/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/parent/announcements", label: "Announcements", icon: Megaphone },
  { to: "/parent/messages", label: "Messages", icon: MessageCircle },
  { to: "/parent/alerts", label: "Telegram Alerts", icon: Bell },
];

const TITLES = {
  "/parent": "Parent Dashboard",
  "/parent/child": "My Child",
  "/parent/attendance": "Attendance",
  "/parent/announcements": "Announcements",
  "/parent/messages": "Messages",
  "/parent/alerts": "Telegram Alert Setup",
};

export default function ParentDashboard() {
  const location = useLocation();
  return (
    <DashboardLayout navItems={NAV} title={TITLES[location.pathname] || "Parent"}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="child" element={<ChildPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="announcements" element={<AnnouncementsList />} />
        <Route path="messages" element={<Messages />} />
        <Route path="alerts" element={<TelegramSetup />} />
      </Routes>
    </DashboardLayout>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/parent/dashboard").then((r) => setData(r.data)); }, []);
  if (!data) return <p>Loading...</p>;
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4" data-testid="parent-children">
        {data.children.map((c) => (
          <ChildSummary key={c.id} child={c} />
        ))}
        {data.children.length === 0 && (
          <div className="card-soft p-8 text-center md:col-span-2">
            <p className="text-slate-500">No children registered yet. Please contact the academy.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChildSummary({ child }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/parent/children/${child.id}/attendance`).then((r) => setData(r.data)); }, [child.id]);
  return (
    <div className="card-soft p-6">
      <div className="flex items-center gap-4 mb-4">
        {child.photo_url ? (
          <img src={`${process.env.REACT_APP_BACKEND_URL}${child.photo_url}`} alt={child.name}
            className="w-16 h-16 rounded-2xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-[#FFD4C7] flex items-center justify-center font-heading text-2xl font-semibold">
            {child.name[0]}
          </div>
        )}
        <div>
          <h3 className="font-heading text-xl font-semibold">{child.name}</h3>
          <p className="text-sm text-slate-500">Age {child.age} • {child.class_name || "No class"}</p>
          <p className="text-xs text-slate-500">Teacher: {child.teacher_name || "—"}</p>
        </div>
      </div>
      {data && data.summary.total > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Present" value={data.summary.present} color="#A7E8D0" />
          <MiniStat label="Absent" value={data.summary.absent} color="#FFD4C7" />
          <MiniStat label="Late" value={data.summary.late} color="#FDF3B8" />
        </div>
      )}
    </div>
  );
}

function ChildPage() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/parent/dashboard").then((r) => setData(r.data)); }, []);
  if (!data) return <p>Loading...</p>;
  return (
    <div className="space-y-4">
      {data.children.map((c) => (
        <div key={c.id} className="card-soft p-8">
          <div className="flex items-center gap-6 mb-6">
            {c.photo_url ? (
              <img src={`${process.env.REACT_APP_BACKEND_URL}${c.photo_url}`} alt={c.name}
                className="w-24 h-24 rounded-3xl object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#FFD4C7] to-[#FDF3B8] flex items-center justify-center font-heading text-5xl font-semibold">
                {c.name[0]}
              </div>
            )}
            <div>
              <h2 className="font-heading text-3xl font-semibold">{c.name}</h2>
              <p className="text-slate-600">{c.age} years old{c.gender ? ` • ${c.gender}` : ""}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Info label="Class" value={c.class_name || "Not assigned"} />
            <Info label="Teacher" value={c.teacher_name || "—"} />
            <Info label="Enrolled" value={new Date(c.enrolled_at).toLocaleDateString()} />
            <Info label="Notes" value={c.notes || "—"} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendancePage() {
  const [children, setChildren] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/parent/dashboard").then((r) => {
      setChildren(r.data.children);
      if (r.data.children[0]) setActiveId(r.data.children[0].id);
    });
  }, []);
  useEffect(() => {
    if (!activeId) return;
    api.get(`/parent/children/${activeId}/attendance`).then((r) => setData(r.data));
  }, [activeId]);

  if (!data) return <p>Loading...</p>;

  const trend = data.records.slice().reverse().map((r) => ({
    date: r.date.slice(5),
    present: r.status === "present" ? 1 : 0,
  }));
  const pct = data.summary.total ? Math.round(data.summary.present / data.summary.total * 100) : 0;

  const pie = [
    { name: "Present", value: data.summary.present },
    { name: "Absent", value: data.summary.absent },
    { name: "Late", value: data.summary.late },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)} data-testid={`child-tab-${c.id}`}
              className={`px-5 py-2 rounded-full text-sm font-bold ${activeId === c.id ? "bg-[#FF8C73] text-white" : "bg-white text-slate-700"}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      <div className="grid md:grid-cols-4 gap-4">
        <MiniStat label="Attendance" value={`${pct}%`} color="#A7E8D0" />
        <MiniStat label="Present" value={data.summary.present} color="#A7E8D0" />
        <MiniStat label="Absent" value={data.summary.absent} color="#FFD4C7" />
        <MiniStat label="Late" value={data.summary.late} color="#FDF3B8" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-soft p-6">
          <h3 className="font-heading text-xl font-semibold mb-4">Distribution</h3>
          {pie.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                  {pie.map((_, i) => <Cell key={i} fill={["#A7E8D0", "#FF8C73", "#FDF3B8"][i]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 py-12 text-center">No data yet</p>}
        </div>
        <div className="card-soft p-6">
          <h3 className="font-heading text-xl font-semibold mb-4">Trend</h3>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} domain={[0, 1]} />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke="#FF8C73" strokeWidth={3} dot={{ fill: "#FF8C73" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 py-12 text-center">No data yet</p>}
        </div>
      </div>
      <div className="card-soft p-6">
        <h3 className="font-heading text-xl font-semibold mb-4">Recent Records</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto" data-testid="parent-attendance-records">
          {data.records.map((r) => (
            <div key={r.id} className="flex justify-between p-3 rounded-2xl bg-[#FFFAF5]">
              <span className="font-semibold">{new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                r.status === "present" ? "bg-[#A7E8D0] text-[#0F4C35]" : r.status === "absent" ? "bg-red-100 text-red-700" : "bg-[#FDF3B8]"
              }`}>{r.status}</span>
            </div>
          ))}
          {data.records.length === 0 && <p className="text-slate-500 text-center py-4">No records yet.</p>}
        </div>
      </div>
    </div>
  );
}

function Messages() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [content, setContent] = useState("");

  useEffect(() => { api.get("/messages/contacts").then((r) => { setContacts(r.data); if (r.data[0]) setActive(r.data[0]); }); }, []);
  useEffect(() => {
    if (!active) return;
    api.get(`/messages/${active.id}`).then((r) => setThread(r.data));
  }, [active]);

  const send = async () => {
    if (!content.trim() || !active) return;
    try {
      await api.post("/messages", { receiver_id: active.id, content });
      setContent("");
      const r = await api.get(`/messages/${active.id}`);
      setThread(r.data);
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <div className="card-soft overflow-hidden h-[70vh] grid md:grid-cols-3" data-testid="parent-messages">
      <div className="border-r border-slate-100 overflow-y-auto">
        <div className="p-4 font-heading font-semibold">Teachers</div>
        {contacts.map((c) => (
          <button key={c.id} onClick={() => setActive(c)} data-testid={`pcontact-${c.id}`}
            className={`w-full text-left p-4 border-t border-slate-100 hover:bg-[#FFFAF5] ${active?.id === c.id ? "bg-[#FFFAF5]" : ""}`}>
            <p className="font-semibold">{c.name}</p>
            <p className="text-xs text-slate-500">{c.email}</p>
            {c.unread_count > 0 && <span className="inline-block mt-1 bg-[#FF8C73] text-white text-xs font-bold rounded-full px-2 py-0.5">{c.unread_count}</span>}
          </button>
        ))}
        {contacts.length === 0 && <p className="p-4 text-sm text-slate-500">No teachers yet.</p>}
      </div>
      <div className="md:col-span-2 flex flex-col">
        {active ? (
          <>
            <div className="p-4 border-b border-slate-100 font-heading font-semibold">{active.name}</div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFFAF5]">
              {thread.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl ${m.sender_id === user.id ? "bg-[#FF8C73] text-white rounded-tr-sm" : "bg-white rounded-tl-sm"}`}>
                    <p className="text-sm">{m.content}</p>
                  </div>
                </div>
              ))}
              {thread.length === 0 && <p className="text-center text-slate-400 text-sm">Start the conversation!</p>}
            </div>
            <div className="p-4 flex gap-2 border-t border-slate-100">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message..."
                data-testid="parent-message-input"
                className="flex-1 rounded-full border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:ring-2 focus:ring-[#A7E8D0]"
              />
              <button data-testid="parent-message-send" onClick={send} className="btn-primary px-5 py-3"><Send size={18} /></button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">Select a teacher</div>
        )}
      </div>
    </div>
  );
}

function AnnouncementsList() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/announcements").then((r) => setItems(r.data)); }, []);
  return (
    <div className="grid md:grid-cols-2 gap-4" data-testid="parent-announcements-list">
      {items.map((a) => (
        <div key={a.id} className="card-soft p-6">
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2 mb-2">📢 {a.title}</h3>
          {a.description && <p className="text-sm text-slate-600 mb-3">{a.description}</p>}
          <div className="text-sm space-y-1 text-slate-500">
            {a.scheduled_at && <p>🗓 {new Date(a.scheduled_at).toLocaleString()}</p>}
            {a.location && <p>📍 {a.location}</p>}
            <p className="text-xs">By {a.created_by_name}</p>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="col-span-2 text-center text-slate-500 py-12">No announcements yet.</p>}
    </div>
  );
}

function TelegramSetup() {
  const [status, setStatus] = useState(null);
  const [chatId, setChatId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/auth/telegram-status").then((r) => {
    setStatus(r.data);
    setChatId(r.data.chat_id || "");
  });
  useEffect(() => { load(); }, []);

  const link = async () => {
    if (!chatId.trim()) { toast.error("Please enter your Telegram Chat ID"); return; }
    setSaving(true);
    try {
      const r = await api.post("/auth/link-telegram", { chat_id: chatId.trim() });
      if (r.data.test_message_sent) {
        toast.success("Linked! Check your Telegram for a test message ✅");
      } else {
        toast.success("Chat ID saved. (Test message failed - check bot token in .env)");
      }
      load();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setSaving(false); }
  };

  const unlink = async () => {
    if (!window.confirm("Stop receiving Telegram alerts?")) return;
    await api.post("/auth/unlink-telegram");
    setStatus({ ...status, linked: false, chat_id: null });
    setChatId("");
    toast.success("Unlinked");
    load();
  };

  if (!status) return <p>Loading...</p>;
  const botUsername = status.bot_username || "your_bot";

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="card-soft p-6" data-testid="telegram-status-card">
          <h3 className="font-heading text-xl font-semibold mb-2 flex items-center gap-2">
            🤖 Telegram Absence Alerts
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Get instant notifications on Telegram when your child is marked absent or late.
          </p>
          {status.linked ? (
            <div className="space-y-4">
              <div className="bg-[#A7E8D0] rounded-2xl p-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#0F4C35] animate-pulse" />
                <div>
                  <p className="font-bold text-[#0F4C35]">✅ Connected</p>
                  <p className="text-xs text-[#0F4C35]">Chat ID: {status.chat_id}</p>
                </div>
              </div>
              <button onClick={unlink} data-testid="telegram-unlink-btn"
                className="rounded-full px-6 py-2.5 bg-red-100 text-red-700 font-bold hover:bg-red-200">
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                  Your Telegram Chat ID
                </label>
                <input type="text" value={chatId} onChange={(e) => setChatId(e.target.value)}
                  placeholder="e.g. 123456789"
                  data-testid="telegram-chatid-input"
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7E8D0]" />
              </div>
              <button onClick={link} disabled={saving} data-testid="telegram-link-btn"
                className="btn-primary disabled:opacity-50">
                {saving ? "Linking..." : "🔗 Link Telegram"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card-soft p-6 bg-[#FDF3B8]">
        <h4 className="font-heading text-lg font-semibold mb-3">📋 How to set up</h4>
        <ol className="text-sm space-y-3 text-slate-700">
          <li><strong>1.</strong> Open Telegram and search for <code className="bg-white px-2 py-0.5 rounded">@{botUsername || "your_lumikids_bot"}</code></li>
          <li><strong>2.</strong> Tap <strong>Start</strong> to begin a chat</li>
          <li><strong>3.</strong> Send the bot any message (e.g. "hi")</li>
          <li><strong>4.</strong> Now message <code className="bg-white px-2 py-0.5 rounded">@userinfobot</code> to find <strong>your Chat ID</strong></li>
          <li><strong>5.</strong> Copy the number and paste it here</li>
          <li><strong>6.</strong> Click <strong>Link Telegram</strong> — you'll get a test message ✨</li>
        </ol>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: color }}>
      <p className="font-heading text-2xl font-semibold">{value}</p>
      <p className="text-xs text-slate-700">{label}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-[#FFFAF5] rounded-2xl p-4">
      <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-1">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
