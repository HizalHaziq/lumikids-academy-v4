import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap, BookOpen, FileText, Inbox, Megaphone, Camera } from "lucide-react"; 
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import DashboardLayout from "../../components/DashboardLayout";
import api, { formatApiError, API_BASE } from "../../lib/api";
import ActivityFeed from "../../components/ActivityFeed"; 

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/students", label: "Students", icon: GraduationCap },
  { to: "/admin/classes", label: "Classes", icon: BookOpen },
  { to: "/admin/enrollments", label: "Enrollments", icon: Inbox },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/feed", label: "Activity Feed", icon: Camera }, // <-- Added Activity Feed
];

const TITLES = {
  "/admin": "Dashboard Overview",
  "/admin/users": "Manage Users",
  "/admin/students": "Manage Students",
  "/admin/classes": "Manage Classes",
  "/admin/enrollments": "Enrollment Requests",
  "/admin/announcements": "Announcements & Meetings",
  "/admin/reports": "Reports & Analytics",
  "/admin/feed": "School Activity Feed", // <-- Added Title
};

const COLORS = ["#FF8C73", "#A7E8D0", "#FDF3B8", "#E6DDFA", "#C4E6FA"];

export default function AdminDashboard() {
  const location = useLocation();
  return (
    <DashboardLayout navItems={NAV} title={TITLES[location.pathname] || "Admin"}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="enrollments" element={<EnrollmentsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="feed" element={<ActivityFeed />} /> {/* <-- Added Route */}
      </Routes>
    </DashboardLayout>
  );
}

// ---------- Overview ----------
function Overview() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/admin/stats").then((r) => setStats(r.data)); }, []);
  if (!stats) return <Loading />;

  const cards = [
    { label: "Students", value: stats.total_students, color: "#FFD4C7" },
    { label: "Classes", value: stats.total_classes, color: "#A7E8D0" },
    { label: "Teachers", value: stats.total_teachers, color: "#FDF3B8" },
    { label: "Parents", value: stats.total_parents, color: "#E6DDFA" },
    { label: "Pending Enrollments", value: stats.pending_enrollments, color: "#C4E6FA" },
    { label: "Attendance %", value: `${stats.attendance_percentage}%`, color: "#FFD4C7" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="admin-stats-cards">
        {cards.map((c) => (
          <div key={c.label} className="card-soft p-6 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl mb-4" style={{ background: c.color }} />
            <p className="font-heading text-3xl font-semibold">{c.value}</p>
            <p className="text-sm text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-soft p-6">
          <h3 className="font-heading text-xl font-semibold mb-4">Students per Class</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.students_per_class}>
              <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #F1F5F9" }} />
              <Bar dataKey="count" fill="#FF8C73" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card-soft p-6">
          <h3 className="font-heading text-xl font-semibold mb-4">Monthly Enrollments</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.monthly_enrollments}>
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #F1F5F9" }} />
              <Line type="monotone" dataKey="count" stroke="#A7E8D0" strokeWidth={3} dot={{ fill: "#FF8C73", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---------- Users ----------
function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "teacher", phone: "" });

  const load = () => api.get("/admin/users").then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, phone: form.phone };
        if (form.password) payload.password = form.password;
        await api.put(`/admin/users/${editing.id}`, payload);
        toast.success("User updated");
      } else {
        await api.post("/admin/users", form);
        toast.success("User created");
      }
      setShowForm(false); setEditing(null);
      setForm({ name: "", email: "", password: "", role: "teacher", phone: "" });
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await api.delete(`/admin/users/${id}`);
    toast.success("User deleted");
    load();
  };

  const startEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, phone: u.phone || "" });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-500">{users.length} total users</p>
        <button data-testid="add-user-btn" onClick={() => { setEditing(null); setForm({ name: "", email: "", password: "", role: "teacher", phone: "" }); setShowForm(true); }} className="btn-primary">+ Add User</button>
      </div>
      <div className="card-soft overflow-hidden">
        <table className="w-full" data-testid="users-table">
          <thead className="bg-[#FFFAF5]">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Phone</th><th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-[#FFFAF5]">
                <td className="p-4 font-semibold">{u.name}</td>
                <td className="p-4 text-slate-600">{u.email}</td>
                <td className="p-4"><span className="px-3 py-1 rounded-full text-xs font-bold capitalize bg-[#FDF3B8]">{u.role}</span></td>
                <td className="p-4 text-slate-600">{u.phone || "—"}</td>
                <td className="p-4 text-right">
                  <button onClick={() => startEdit(u)} className="text-sm font-bold text-[#FF8C73] mr-3">Edit</button>
                  {u.role !== "admin" && <button onClick={() => handleDelete(u.id)} className="text-sm font-bold text-red-500">Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? "Edit User" : "Add User"}>
          <form onSubmit={handleSave} className="space-y-4" data-testid="user-form">
            <FormInput label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required testid="user-name" />
            <FormInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required testid="user-email" />
            <FormInput label={editing ? "New Password (leave blank to keep)" : "Password"} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required={!editing} testid="user-password" />
            {!editing && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Role</label>
                <select data-testid="user-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none">
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            <FormInput label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} testid="user-phone" />
            <button type="submit" className="btn-primary w-full" data-testid="user-save-btn">{editing ? "Update" : "Create"}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ---------- Students ----------
function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", age: "", gender: "", parent_id: "", class_id: "", notes: "" });
  
  const [photoFile, setPhotoFile] = useState(null);
  // 1. New state to track if we should delete the existing photo
  const [removePhoto, setRemovePhoto] = useState(false);

  const load = async () => {
    const [s, p, c] = await Promise.all([
      api.get("/admin/students"),
      api.get("/lookup/parents"),
      api.get("/lookup/classes"),
    ]);
    setStudents(s.data); setParents(p.data); setClasses(c.data);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, age: Number(form.age), parent_id: form.parent_id ? Number(form.parent_id) : null, class_id: form.class_id ? Number(form.class_id) : null };
      
      let targetId = editing?.id;

      // Save the text details first
      if (editing) {
        await api.put(`/admin/students/${editing.id}`, payload);
      } else {
        const res = await api.post("/admin/students", payload);
        targetId = res.data?.id; 
      }

      // 2. Handle Photo Removal
      if (editing && removePhoto && !photoFile) {
        await api.delete(`/admin/students/${targetId}/photo`);
      }

      // Handle New Photo Upload (this overrides removal if both happen)
      if (photoFile && targetId) {
        const fd = new FormData();
        fd.append("file", photoFile);
        await api.post(`/admin/students/${targetId}/photo`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success(editing ? "Student updated" : "Student added");
      setShowForm(false); 
      setEditing(null); 
      setPhotoFile(null); 
      setRemovePhoto(false); // Reset removal state
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    await api.delete(`/admin/students/${id}`);
    toast.success("Deleted"); load();
  };

  const startEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, age: s.age || "", gender: s.gender || "", parent_id: s.parent_id || "", class_id: s.class_id || "", notes: s.notes || "" });
    setPhotoFile(null); 
    setRemovePhoto(false); // Reset removal state when opening
    setShowForm(true);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", age: "", gender: "", parent_id: "", class_id: "", notes: "" });
    setPhotoFile(null); 
    setRemovePhoto(false); // Reset removal state when opening
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-500">{students.length} students</p>
        <button data-testid="add-student-btn" onClick={openAdd} className="btn-primary">+ Add Student</button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="students-grid">
        {students.map((s) => (
          <div key={s.id} className="card-soft p-6">
            <div className="flex items-center gap-3 mb-3">
              {s.photo_url ? (
                <img
                  src={`${process.env.REACT_APP_BACKEND_URL}${s.photo_url}`}
                  alt={s.name}
                  className="w-12 h-12 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-[#FFD4C7] flex items-center justify-center font-heading font-bold text-lg">
                  {s.name[0]}
                </div>
              )}
              <div>
                <p className="font-heading font-semibold">{s.name}</p>
                <p className="text-xs text-slate-500">Age {s.age} {s.gender && `• ${s.gender}`}</p>
              </div>
            </div>
            <div className="text-sm space-y-1 text-slate-600">
              <p><span className="text-slate-400">Class:</span> {s.class_name || "—"}</p>
              <p><span className="text-slate-400">Parent:</span> {s.parent_name || "—"}</p>
            </div>
            <div className="flex gap-2 mt-4 items-center flex-wrap">
              <button onClick={() => startEdit(s)} className="text-sm font-bold text-[#FF8C73]">Edit</button>
              <button onClick={() => handleDelete(s.id)} className="text-sm font-bold text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? "Edit Student" : "Add Student"}>
          <form onSubmit={handleSave} className="space-y-4" data-testid="student-form">
            <FormInput label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required testid="student-name" />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Age" type="number" value={form.age} onChange={(v) => setForm({ ...form, age: v })} required testid="student-age" />
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} data-testid="student-gender" className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none">
                  <option value="">—</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Parent</label>
              <select data-testid="student-parent" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none">
                <option value="">—</option>
                {parents.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Class</label>
              <select data-testid="student-class" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none">
                <option value="">—</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* 3. Upgraded Photo Input Field with Remove Logic */}
            <div className="bg-[#FFFAF5] p-4 rounded-2xl border border-[#FFD4C7]">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Profile Photo
              </label>

              {/* Show "Remove" button if the student already has a photo */}
              {editing?.photo_url && !removePhoto && !photoFile && (
                <div className="mb-3 flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-sm font-semibold text-slate-600 pl-2">✅ Current photo active</span>
                  <button type="button" onClick={() => setRemovePhoto(true)} className="text-xs font-bold text-red-500 px-3 py-1 hover:bg-red-50 rounded-lg">
                    Remove
                  </button>
                </div>
              )}

              {/* Show "Undo" button if they clicked remove */}
              {removePhoto && (
                <div className="mb-3 flex items-center justify-between bg-red-50 p-2 rounded-xl border border-red-100">
                  <span className="text-sm font-semibold text-red-600 pl-2">🗑 Photo will be deleted on save</span>
                  <button type="button" onClick={() => setRemovePhoto(false)} className="text-xs font-bold text-slate-500 px-3 py-1 hover:bg-slate-200 rounded-lg">
                    Undo
                  </button>
                </div>
              )}

              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  setPhotoFile(e.target.files?.[0]);
                  if (e.target.files?.[0]) setRemovePhoto(false); // Cancel removal if they pick a new file
                }}
                className="w-full rounded-xl bg-white px-3 py-2 outline-none text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#FF8C73] file:text-white hover:file:bg-[#ff7a5c]" 
              />
            </div>

            <button type="submit" className="btn-primary w-full" data-testid="student-save-btn">
              {editing ? "Update Student" : "Create Student"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ---------- Classes ----------
function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", age_group: "", description: "", teacher_id: "", capacity: 20 });

  const load = async () => {
    const [c, t] = await Promise.all([api.get("/admin/classes"), api.get("/lookup/teachers")]);
    setClasses(c.data); setTeachers(t.data);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, capacity: Number(form.capacity), teacher_id: form.teacher_id ? Number(form.teacher_id) : null };
      if (editing) await api.put(`/admin/classes/${editing.id}`, payload);
      else await api.post("/admin/classes", payload);
      toast.success("Saved"); setShowForm(false); setEditing(null); load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-500">{classes.length} classes</p>
        <button data-testid="add-class-btn" onClick={() => { setEditing(null); setForm({ name: "", age_group: "", description: "", teacher_id: "", capacity: 20 }); setShowForm(true); }} className="btn-primary">+ Add Class</button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c, i) => (
          <div key={c.id} className="card-soft p-6">
            <div className="w-full h-3 rounded-full mb-4" style={{ background: COLORS[i % COLORS.length] }} />
            <h3 className="font-heading text-xl font-semibold">{c.name}</h3>
            <p className="text-sm text-slate-500">{c.age_group}</p>
            <p className="text-sm text-slate-600 mt-3 line-clamp-2">{c.description}</p>
            <div className="mt-4 flex justify-between items-center text-sm">
              <span className="text-slate-500">Teacher: <span className="font-semibold text-slate-700">{c.teacher_name || "—"}</span></span>
              <span className="px-3 py-1 rounded-full bg-[#FFD4C7] font-bold">{c.student_count}/{c.capacity}</span>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setEditing(c); setForm({ name: c.name, age_group: c.age_group || "", description: c.description || "", teacher_id: c.teacher_id || "", capacity: c.capacity || 20 }); setShowForm(true); }} className="text-sm font-bold text-[#FF8C73]">Edit</button>
              <button onClick={async () => { if (window.confirm("Delete?")) { await api.delete(`/admin/classes/${c.id}`); load(); } }} className="text-sm font-bold text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? "Edit Class" : "Add Class"}>
          <form onSubmit={handleSave} className="space-y-4" data-testid="class-form">
            <FormInput label="Class Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required testid="class-name" />
            <FormInput label="Age Group" value={form.age_group} onChange={(v) => setForm({ ...form, age_group: v })} placeholder="e.g. 3-4 years" testid="class-age-group" />
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none resize-none" data-testid="class-description" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Teacher</label>
              <select value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none" data-testid="class-teacher">
                <option value="">—</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <FormInput label="Capacity" type="number" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} testid="class-capacity" />
            <button type="submit" className="btn-primary w-full" data-testid="class-save-btn">{editing ? "Update" : "Create"}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ---------- Enrollments ----------
function EnrollmentsPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = () => {
    const url = filter === "all" ? "/admin/enrollments" : `/admin/enrollments?status=${filter}`;
    api.get(url).then((r) => setItems(r.data));
  };
  useEffect(() => { load(); }, [filter]);

  const decide = async (id, decision) => {
    try {
      const res = await api.post(`/admin/enrollments/${id}/decision`, { decision });
      if (decision === "approved") {
        toast.success(`Approved! Temp password: ${res.data.temp_password} (also emailed)`);
      } else {
        toast.success("Rejected");
      }
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2" data-testid="enrollment-filters">
        {["all", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            data-testid={`filter-${s}`}
            onClick={() => setFilter(s)}
            className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition ${filter === s ? "bg-[#FF8C73] text-white" : "bg-white text-slate-700 hover:bg-[#FFFAF5]"}`}
          >{s}</button>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {items.map((e) => (
          <div key={e.id} className="card-soft p-6" data-testid={`enrollment-${e.id}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-heading text-lg font-semibold">{e.child_name} <span className="text-sm font-normal text-slate-500">({e.child_age} yrs)</span></h3>
                <p className="text-sm text-slate-500">Parent: {e.parent_name}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                e.status === "pending" ? "bg-[#FDF3B8]" :
                e.status === "approved" ? "bg-[#A7E8D0] text-[#0F4C35]" : "bg-red-100 text-red-700"
              }`}>{e.status}</span>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p>📧 {e.parent_email}</p>
              <p>📞 {e.phone}</p>
              <p>🎓 Preferred: {e.preferred_class || "Any"}</p>
              {e.notes && <p className="italic mt-2">"{e.notes}"</p>}
            </div>
            {e.status === "pending" && (
              <div className="mt-4 flex gap-2">
                <button data-testid={`approve-${e.id}`} onClick={() => decide(e.id, "approved")} className="btn-secondary flex-1 text-sm py-2">Approve</button>
                <button data-testid={`reject-${e.id}`} onClick={() => decide(e.id, "rejected")} className="flex-1 rounded-full bg-red-100 text-red-700 font-bold py-2 hover:bg-red-200 transition">Reject</button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-500 col-span-2 text-center py-12">No enrollments found</p>}
      </div>
    </div>
  );
}

// ---------- Reports ----------
function ReportsPage() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/admin/stats").then((r) => setStats(r.data)); }, []);
  if (!stats) return <Loading />;

  const pieData = stats.students_per_class.map((c) => ({ name: c.name, value: c.count }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => window.print()} className="btn-secondary" data-testid="print-btn">🖨 Print Report</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-soft p-6">
          <h3 className="font-heading text-xl font-semibold mb-4">Class Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card-soft p-6">
          <h3 className="font-heading text-xl font-semibold mb-4">Monthly Enrollments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthly_enrollments}>
              <XAxis dataKey="month" /><YAxis />
              <Tooltip /><Bar dataKey="count" fill="#A7E8D0" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card-soft p-6">
        <h3 className="font-heading text-xl font-semibold mb-4">Summary</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <SummaryCard label="Total Students" value={stats.total_students} color="#FFD4C7" />
          <SummaryCard label="Avg Attendance" value={`${stats.attendance_percentage}%`} color="#A7E8D0" />
          <SummaryCard label="Pending Enrollments" value={stats.pending_enrollments} color="#FDF3B8" />
        </div>
      </div>
    </div>
  );
}

// ---------- Helpers ----------
function SummaryCard({ label, value, color }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: color }}>
      <p className="font-heading text-3xl font-semibold">{value}</p>
      <p className="text-sm text-slate-700 mt-1">{label}</p>
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text", required, placeholder, testid }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">{label}</label>
      <input type={type} required={required} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7E8D0]" />
    </div>
  );
}

function Modal({ children, title, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 relative">
        <button onClick={onClose} data-testid="modal-close" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200">×</button>
        <h3 className="font-heading text-2xl font-semibold mb-6">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Loading() {
  return <div className="py-20 text-center text-slate-500">Loading...</div>;
}

function PhotoUploader({ studentId, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/admin/students/${studentId}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Photo uploaded!");
      onUploaded && onUploaded();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  return (
    <label className="text-sm font-bold text-[#0F4C35] cursor-pointer hover:underline" data-testid={`upload-photo-${studentId}`}>
      {uploading ? "Uploading..." : "📷 Photo"}
      <input type="file" accept="image/*" onChange={onFile} className="hidden" disabled={uploading} />
    </label>
  );
}

function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", location: "", scheduled_at: "", target_role: "all" });

  const load = () => api.get("/admin/announcements").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        scheduled_at: form.scheduled_at || null,
      };
      await api.post("/admin/announcements", payload);
      toast.success("Announcement sent!");
      setShowForm(false);
      setForm({ title: "", description: "", location: "", scheduled_at: "", target_role: "all" });
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    await api.delete(`/admin/announcements/${id}`);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-500">{items.length} announcements</p>
        <button data-testid="add-announcement-btn" onClick={() => setShowForm(true)} className="btn-primary">+ New Announcement</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4" data-testid="announcements-list">
        {items.map((a) => (
          <div key={a.id} className="card-soft p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-heading text-lg font-semibold flex items-center gap-2">📢 {a.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                a.target_role === "all" ? "bg-[#FDF3B8]" :
                a.target_role === "teacher" ? "bg-[#C4E6FA]" : "bg-[#E6DDFA]"
              }`}>
                {a.target_role === "all" ? "Everyone" : a.target_role + "s"}
              </span>
            </div>
            {a.description && <p className="text-sm text-slate-600 mb-3">{a.description}</p>}
            <div className="text-sm space-y-1 text-slate-500">
              {a.scheduled_at && <p>🗓 {new Date(a.scheduled_at).toLocaleString()}</p>}
              {a.location && <p>📍 {a.location}</p>}
              <p className="text-xs">By {a.created_by_name} • {new Date(a.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => handleDelete(a.id)} className="text-sm font-bold text-red-500 mt-3">Delete</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-500 col-span-2 text-center py-12">No announcements yet.</p>}
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="New Announcement / Meeting">
          <form onSubmit={handleSave} className="space-y-4" data-testid="announcement-form">
            <FormInput label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required testid="ann-title" />
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3} className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none resize-none" data-testid="ann-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Scheduled At</label>
                <input type="datetime-local" value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  data-testid="ann-scheduled"
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              </div>
              <FormInput label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="e.g. Main Hall" testid="ann-location" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Notify</label>
              <select value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                data-testid="ann-target"
                className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 outline-none">
                <option value="all">Everyone (Teachers + Parents)</option>
                <option value="teacher">Teachers only</option>
                <option value="parent">Parents only</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full" data-testid="ann-save-btn">Send Announcement</button>
          </form>
        </Modal>
      )}
    </div>
  );
}