import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#0ea5e9", "#f97316"];

function AnalyticsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Analytics fetch failed:", err);
        setLoading(false);
      });
  }, [token]);

  if (loading || !stats) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-sm text-slate-500 shadow-sm">
        Loading analytics…
      </div>
    );
  }

  const roleData = [
    { name: "Admins", value: stats.totalAdmins },
    { name: "Trainers", value: stats.totalTrainers },
    { name: "Employees", value: stats.totalEmployees },
  ];

  const moduleData = [
    { name: "Modules", value: stats.totalModules },
    { name: "Assignments", value: stats.totalAssignments },
  ];

  return (
    <div className="space-y-6">
      <section className="admin-glow-card rounded-3xl border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-indigo-50 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Analytics</p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Platform Intelligence</h1>
            <p className="mt-2 text-slate-500">
              Live counts from your production database: users, modules, and assignments.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-right">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Total Users</p>
            <p className="text-3xl font-semibold text-slate-900">{stats.totalUsers}</p>
            <p className="text-sm text-slate-500">Across all roles</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Admins" value={stats.totalAdmins} helper="Program owners" />
        <StatCard title="Trainers" value={stats.totalTrainers} helper="Mentors active" />
        <StatCard title="Employees" value={stats.totalEmployees} helper="Learners onboard" />
        <StatCard title="Modules" value={stats.totalModules} helper="Published experiences" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="admin-glow-card rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Modules vs Assignments</h2>
          <p className="text-sm text-slate-500">How many programs are currently staffed.</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={moduleData}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip cursor={{ fill: "rgba(99,102,241,0.08)" }} />
              <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-glow-card rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">User Role Distribution</h2>
          <p className="text-sm text-slate-500">Visualize how talent is spread across roles.</p>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={roleData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {roleData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, helper }) => (
  <div className="admin-glow-card rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm">
    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{title}</p>
    <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    <p className="text-sm text-slate-500">{helper}</p>
  </div>
);

export default AnalyticsPage;
