import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle2, Layers, Target, Users as UsersIcon, WandSparkles } from "lucide-react";

function CreateModulePage() {
  const { token } = useAuth();

  const [form, setForm] = useState({
    title: "",
    description: "",
  });
  const [creating, setCreating] = useState(false);

  const [stats, setStats] = useState({
    modules: 0,
    learners: 0,
    completion: 0,
  });

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const [analyticsRes, monitoringRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/admin/employee-monitoring`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const analyticsData = await analyticsRes.json();
      const monitoringData = await monitoringRes.json();

      if (!analyticsRes.ok) {
        throw new Error(analyticsData.message || "Failed to load analytics");
      }

      if (!monitoringRes.ok) {
        throw new Error(monitoringData.message || "Failed to load monitoring");
      }

      const employees = Array.isArray(monitoringData.employees)
        ? monitoringData.employees
        : [];
      const avgCompletion =
        employees.length === 0
          ? 0
          : Math.round(
              employees.reduce(
                (sum, emp) => sum + (emp.progressPercent || 0),
                0
              ) / employees.length
            );

      setStats({
        modules: analyticsData.totalModules ?? 0,
        learners: analyticsData.totalEmployees ?? employees.length,
        completion: avgCompletion,
      });
    } catch (err) {
      console.error("Stats fetch failed:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      alert("Module title is required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Module creation failed");

      alert("Module Created 🎉");
      setForm({ title: "", description: "" });
      fetchStats();
    } catch (err) {
      console.error("Create module error:", err);
      alert(err.message || "Unable to create module");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="admin-glow-card rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-400">
              Module builder
            </p>
            <h2 className="mt-2 text-4xl font-semibold text-slate-900">
              Launch a new learning adventure
            </h2>
            <p className="mt-2 max-w-3xl text-slate-500">
              Define the headline and context for the module. Add quests and bosses from
              the module detail view after creation.
            </p>
          </div>
          <div className="admin-glow-ring inline-flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
            <WandSparkles className="h-4 w-4" /> Ready to publish
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          <div>
            <label className="text-sm font-semibold text-slate-600">
              Module Title
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-50"
              placeholder="e.g. Async JavaScript Boss Battles"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600">
              Description
            </label>
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-50"
              placeholder="What skills will learners unlock?"
              rows="7"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Preflight checklist</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Clear module title</p>
              <p className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Outcome-based description</p>
              <p className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Trainer assignment plan</p>
              <p className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Boss challenge intent</p>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-200/80 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create Module"}
          </button>
        </div>
      </div>

      <aside className="admin-glow-card sticky top-4 flex h-fit flex-col gap-4 rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-6 shadow-lg">
        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">
          Live insights
        </h3>
        <InsightCard
          icon={<Layers className="h-5 w-5" />}
          label="Published Modules"
          value={stats.modules}
          helper="Ready for assignment"
        />
        <InsightCard
          icon={<UsersIcon className="h-5 w-5" />}
          label="Learners"
          value={stats.learners}
          helper="Employees enrolled"
        />
        <InsightCard
          icon={<Target className="h-5 w-5" />}
          label="Average Completion"
          value={`${stats.completion}%`}
          helper="Based on monitoring feed"
        />

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-500">Tip</p>
          <p className="mt-2 text-sm text-slate-700">
            After creation, open the module detail page to add topics, tasks, and boss rules.
          </p>
        </div>
      </aside>
    </div>
  );
}

function InsightCard({ icon, label, value, helper }) {
  return (
    <div className="admin-glow-card rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{label}</p>
        <span className="rounded-2xl bg-indigo-50 p-2 text-indigo-500">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{helper}</p>
    </div>
  );
}

export default CreateModulePage;
