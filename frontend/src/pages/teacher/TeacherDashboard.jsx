import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { LayoutDashboard, GraduationCap, ClipboardCheck, FileText, MessageCircle, Send, Megaphone } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import DashboardLayout from "../../components/DashboardLayout";
import api, { formatApiError } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

const NAV = [
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/students", label: "Students", icon: GraduationCap },
  { to: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/teacher/reports", label: "Reports", icon: FileText },
  { to: "/teacher/announcements", label: "Announcements", icon: Megaphone },
  { to: "/teacher/messages", label: "Messages", icon: MessageCircle },
];
const TITLES = {
  "/teacher": "Teacher Dashboard",
  "/teacher/students": "My Students",
  "/teacher/attendance": "Record Attendance",
  "/teacher/reports": "Attendance Reports",
  "/teacher/announcements": "Announcements",
  "/teacher/messages": "Parent Messages",
};

export default function TeacherDashboard() {
  const location = useLocation();
  return (
    <DashboardLayout navItems={NAV} title={TITLES[location.pathname] || "Teacher"}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="students" element={<StudentsList />} />
        <Route path="attendance" element={<AttendanceRecord />} />
        <Route path="reports" element={<TReports />} />
        <Route path="announcements" element={<AnnouncementsList />} />
        <Route path="messages" element={<Messages />} />
      </Routes>
    </DashboardLayout>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/teacher/dashboard").then((r) => setData(r.data)); }, []);
  if (!data) return <p className="text-slate-500">Loading...</p>;
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-4" data-testid="teacher-stats">
        <Stat label="My Classes" value={data.classes.length} color="#FFD4C7" />
        <Stat label="My Students" value={data.student_count} color="#A7E8D0" />
        <Stat label="Today's Records" value={data.today_attendance_count} color="#FDF3B8" />
      </div>
      <div className="card-soft p-6">
        <h3 className="font-heading text-xl font-semibold mb-4">7-day Attendance Trend</h3>
        {data.trend.length === 0 ? (
          <p className="text-slate-500 py-12 text-center">No attendance data yet. Start recording!</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.trend}>
              <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="present" stroke="#A7E8D0" strokeWidth={3} />
              <Line type="monotone" dataKey="absent" stroke="#FF8C73" strokeWidth={3} />
              <Line type="monotone" dataKey="late" stroke="#FDF3B8" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {data.classes.map((c) => (
          <div key={c.id} className="card-soft p-6">
            <h4 className="font-heading text-lg font-semibold">{c.name}</h4>
            <p className="text-sm text-slate-500">{c.age_group}</p>
            <p className="text-sm text-slate-600 mt-2">{c.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentsList() {
  const [students, setStudents] = useState([]);
  useEffect(() => { api.get("/teacher/students").then((r) => setStudents(r.data)); }, []);
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="teacher-students-grid">
      {students.map((s) => (
        <div key={s.id} className="card-soft p-6">
          <div className="flex items-center gap-3 mb-3">
            {s.photo_url ? (
              <img src={`${process.env.REACT_APP_BACKEND_URL}${s.photo_url}`} alt={s.name}
                className="w-12 h-12 rounded-2xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#A7E8D0] flex items-center justify-center font-heading font-bold text-lg text-[#0F4C35]">
                {s.name[0]}
              </div>
            )}
            <div>
              <p className="font-heading font-semibold">{s.name}</p>
              <p className="text-xs text-slate-500">Age {s.age} • {s.class_name}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">Parent: {s.parent_name || "—"}</p>
          <p className="text-xs text-slate-500">{s.parent_email || ""}</p>
        </div>
      ))}
      {students.length === 0 && <p className="col-span-3 text-center text-slate-500 py-12">No students assigned yet.</p>}
    </div>
  );
}

function AnnouncementsList() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/announcements").then((r) => setItems(r.data)); }, []);
  return (
    <div className="grid md:grid-cols-2 gap-4" data-testid="teacher-announcements-list">
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

function AttendanceRecord() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get("/teacher/dashboard").then((r) => {
      setClasses(r.data.classes);
      if (r.data.classes[0]) setClassId(r.data.classes[0].id);
    });
  }, []);

  useEffect(() => {
    if (!classId) return;
    api.get(`/lookup/students-by-class/${classId}`).then((r) => {
      setStudents(r.data);
      const initial = {};
      r.data.forEach((s) => (initial[s.id] = "present"));
      setRecords(initial);
    });
    api.get(`/teacher/attendance?class_id=${classId}`).then((r) => setHistory(r.data));
  }, [classId]);

  const submit = async () => {
    try {
      const payload = {
        class_id: Number(classId),
        date,
        records: students.map((s) => ({ student_id: s.id, date, status: records[s.id] || "present" })),
      };
      await api.post("/teacher/attendance/bulk", payload);
      toast.success("Attendance recorded!");
      api.get(`/teacher/attendance?class_id=${classId}`).then((r) => setHistory(r.data));
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <div className="space-y-6">
      <div className="card-soft p-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Class</label>
            <select data-testid="attendance-class-select" value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="attendance-date" className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
          </div>
        </div>
        <div className="space-y-2" data-testid="attendance-list">
          {students.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#FFFAF5]">
              <span className="font-semibold">{s.name}</span>
              <div className="flex gap-2">
                {["present", "absent", "late"].map((st) => (
                  <button
                    key={st}
                    data-testid={`attendance-${s.id}-${st}`}
                    onClick={() => setRecords({ ...records, [s.id]: st })}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition ${
                      records[s.id] === st
                        ? st === "present" ? "bg-[#A7E8D0] text-[#0F4C35]" : st === "absent" ? "bg-red-200 text-red-800" : "bg-[#FDF3B8] text-slate-700"
                        : "bg-white text-slate-500 hover:bg-slate-100"
                    }`}
                  >{st}</button>
                ))}
              </div>
            </div>
          ))}
          {students.length === 0 && <p className="text-slate-500 text-center py-8">No students in this class.</p>}
        </div>
        {students.length > 0 && (
          <button onClick={submit} className="btn-primary mt-6 w-full" data-testid="attendance-submit">Save Attendance</button>
        )}
      </div>

      <div className="card-soft p-6">
        <h3 className="font-heading text-xl font-semibold mb-4">Recent History</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.slice(0, 30).map((h) => (
            <div key={h.id} className="flex justify-between items-center p-3 rounded-2xl bg-[#FFFAF5] text-sm">
              <span className="font-semibold">{h.student_name}</span>
              <span className="text-slate-500">{h.date}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                h.status === "present" ? "bg-[#A7E8D0] text-[#0F4C35]" : h.status === "absent" ? "bg-red-100 text-red-700" : "bg-[#FDF3B8]"
              }`}>{h.status}</span>
            </div>
          ))}
          {history.length === 0 && <p className="text-slate-500 text-center py-4">No history yet.</p>}
        </div>
      </div>
    </div>
  );
}

function TReports() {
  const [r, setR] = useState(null);
  useEffect(() => { api.get("/teacher/reports").then((res) => setR(res.data)); }, []);
  if (!r) return <p>Loading...</p>;
  const data = [
    { name: "Present", value: r.present, color: "#A7E8D0" },
    { name: "Absent", value: r.absent, color: "#FF8C73" },
    { name: "Late", value: r.late, color: "#FDF3B8" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => window.print()} className="btn-secondary" data-testid="teacher-print-btn">🖨 Print</button>
      </div>
      <div className="card-soft p-6">
        <h3 className="font-heading text-xl font-semibold mb-4">Last 30 Days Summary</h3>
        {data.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No attendance data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={120} dataKey="value" label>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Stat label="Present" value={r.present} color="#A7E8D0" />
          <Stat label="Absent" value={r.absent} color="#FFD4C7" />
          <Stat label="Late" value={r.late} color="#FDF3B8" />
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
    <div className="card-soft overflow-hidden h-[70vh] grid md:grid-cols-3" data-testid="messages-panel">
      <div className="border-r border-slate-100 overflow-y-auto">
        <div className="p-4 font-heading font-semibold">Parents</div>
        {contacts.map((c) => (
          <button
            key={c.id}
            data-testid={`contact-${c.id}`}
            onClick={() => setActive(c)}
            className={`w-full text-left p-4 border-t border-slate-100 hover:bg-[#FFFAF5] ${active?.id === c.id ? "bg-[#FFFAF5]" : ""}`}
          >
            <p className="font-semibold">{c.name}</p>
            <p className="text-xs text-slate-500">{c.email}</p>
            {c.unread_count > 0 && <span className="inline-block mt-1 bg-[#FF8C73] text-white text-xs font-bold rounded-full px-2 py-0.5">{c.unread_count}</span>}
          </button>
        ))}
        {contacts.length === 0 && <p className="p-4 text-sm text-slate-500">No contacts yet.</p>}
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
              {thread.length === 0 && <p className="text-center text-slate-400 text-sm">No messages yet. Say hi!</p>}
            </div>
            <div className="p-4 flex gap-2 border-t border-slate-100">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message..."
                data-testid="message-input"
                className="flex-1 rounded-full border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:ring-2 focus:ring-[#A7E8D0]"
              />
              <button data-testid="message-send" onClick={send} className="btn-primary px-5 py-3"><Send size={18} /></button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">Select a contact</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="card-soft p-6">
      <div className="w-12 h-12 rounded-2xl mb-3" style={{ background: color }} />
      <p className="font-heading text-3xl font-semibold">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
