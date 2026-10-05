import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Layers,
  LogOut,
  ShieldCheck,
  Share2,
  Users,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./adminTheme.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const isOverviewPage = location.pathname === "/admin" || location.pathname === "/admin/";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  // Fetch dashboard stats for right sidebar
  useEffect(() => {
    if (!token) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    };
    fetchStats();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { to: "/admin/users", label: "People", icon: Users },
    { to: "/admin/create-module", label: "Create Module", icon: Layers },
    { to: "/admin/assign", label: "Assign Trainer", icon: Share2 },
    {
      to: "/admin/employee-monitoring",
      label: "Employee Monitoring",
      icon: Activity,
    },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="admin-shell h-screen w-full overflow-hidden bg-gradient-to-b from-slate-50 via-white to-indigo-50/70 text-slate-900">
      {/* Background Orbs */}
      <div className="admin-soft-orb one" />
      <div className="admin-soft-orb two" />
      <div className="admin-soft-orb three" />

      {/* Main Layout Container */}
      <div className="h-screen w-full">
        {/* LEFT SIDEBAR - Fixed */}
        <aside className="admin-sidebar-left admin-glow-container fixed left-3 top-3 z-30 hidden h-[calc(100vh-24px)] w-72 flex-col rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl backdrop-blur-md lg:flex">
          {/* Header */}
          <div className="flex items-center gap-3 text-slate-700">
            <div className="admin-icon-glow rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 p-3 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Control</p>
              <h2 className="text-xl font-semibold">SkillQuest HQ</h2>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 space-y-2 overflow-y-auto pr-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `admin-nav-item group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "admin-nav-active border-indigo-300 text-indigo-700"
                      : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                  }`
                }
              >
                <Icon className="h-4 w-4 text-indigo-500 transition-transform duration-300 group-hover:-translate-y-1" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Info Box */}
          {isOverviewPage && (
            <div className="admin-info-box mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-3 text-xs text-slate-600">
              Command center widgets are on this page only.
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="admin-btn-logout mt-auto inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-gradient-to-r from-rose-500 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-300/50"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </aside>

        {/* CENTER CONTENT - Scrollable Only */}
        <main className="admin-content-main overflow-y-auto overflow-x-hidden">
          <div className="space-y-6 p-6 pb-12">
            <Outlet />
          </div>
        </main>

        {/* RIGHT SIDEBAR - Fixed */}
        <aside className="admin-sidebar-right admin-glow-container fixed right-3 top-3 z-30 hidden h-[calc(100vh-24px)] w-72 flex-col rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl backdrop-blur-md overflow-y-auto lg:flex">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <h3 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-xs uppercase tracking-[0.35em] font-bold text-transparent">
                Dashboard Stats
              </h3>
            </div>

            {/* Quick Stats */}
            {stats ? (
              <>
                <div className="admin-stat-box rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Total Users</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                    </div>
                    <div className="admin-stat-icon rounded-xl bg-indigo-100 p-3 text-indigo-600">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="admin-stat-box rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Modules</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalModules}</p>
                    </div>
                    <div className="admin-stat-icon rounded-xl bg-purple-100 p-3 text-purple-600">
                      <Layers className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="admin-stat-box rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Trainers</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalTrainers}</p>
                    </div>
                    <div className="admin-stat-icon rounded-xl bg-amber-100 p-3 text-amber-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="admin-stat-box rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Assignments</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalAssignments}</p>
                    </div>
                    <div className="admin-stat-icon rounded-xl bg-emerald-100 p-3 text-emerald-600">
                      <Zap className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl bg-slate-100 p-4 text-center text-sm text-slate-500">
                Loading stats...
              </div>
            )}

            {/* Info */}
            <div className="admin-info-tip rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-xs text-slate-700">
              Updates every page load. Check analytics for detailed insights.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminDashboard;
