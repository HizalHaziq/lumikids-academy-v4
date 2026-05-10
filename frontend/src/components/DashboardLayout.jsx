import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Sun, LogOut, Bell, Menu, X } from "lucide-react";
import api from "../lib/api";

export default function DashboardLayout({ navItems, title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    api.get("/notifications").then((r) => setNotifs(r.data)).catch(() => {});
  }, [location.pathname]);

  const unread = notifs.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    setNotifs(notifs.map((n) => ({ ...n, is_read: 1 })));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#FFFAF5] font-body">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/70 backdrop-blur-xl border-b border-white/40 sticky top-0 z-40">
        <button
          data-testid="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-2xl bg-[#FFD4C7]"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2">
          <Sun className="text-[#FF8C73]" strokeWidth={2.5} size={24} />
          <span className="font-heading font-semibold text-lg">LumiKids</span>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          data-testid="dashboard-sidebar"
          className={`${sidebarOpen ? "block" : "hidden"} lg:block fixed lg:sticky top-0 left-0 z-30 w-72 h-screen bg-white border-r border-slate-100 p-6 overflow-y-auto`}
        >
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-[#FF8C73] flex items-center justify-center">
              <Sun className="text-white" strokeWidth={2.5} size={22} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-xl text-slate-900 leading-none">LumiKids</h2>
              <p className="text-xs text-slate-500">Academy</p>
            </div>
          </Link>

          <div className="mb-8 p-4 rounded-2xl bg-gradient-to-br from-[#FFD4C7] to-[#FDF3B8]">
            <p className="text-xs uppercase tracking-wider text-slate-700 font-bold mb-1">{user?.role}</p>
            <p className="font-heading font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-600 truncate">{user?.email}</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${
                    active
                      ? "bg-[#FF8C73] text-white shadow-[0_8px_16px_-4px_rgba(255,140,115,0.4)]"
                      : "text-slate-700 hover:bg-[#FFFAF5]"
                  }`}
                >
                  <item.icon size={20} strokeWidth={2.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="mt-8 w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all font-semibold"
          >
            <LogOut size={20} strokeWidth={2.5} />
            Logout
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <header className="hidden lg:flex items-center justify-between p-6 bg-white/70 backdrop-blur-xl border-b border-white/40 sticky top-0 z-20">
            <h1 data-testid="page-title" className="font-heading text-2xl md:text-3xl font-semibold text-slate-900">
              {title}
            </h1>
            <div className="flex items-center gap-3 relative">
              <button
                data-testid="notifications-btn"
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-3 rounded-2xl bg-[#FFFAF5] hover:bg-[#FFD4C7] transition"
              >
                <Bell size={20} strokeWidth={2.5} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF8C73] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-heading font-semibold">Notifications</h3>
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-[#FF8C73] font-bold">
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifs.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No notifications yet</p>
                  ) : (
                    <div className="space-y-2">
                      {notifs.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl text-sm ${n.is_read ? "bg-slate-50" : "bg-[#FFD4C7]"}`}
                        >
                          <p className="font-semibold text-slate-900">{n.title}</p>
                          <p className="text-slate-600 text-xs mt-1">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
