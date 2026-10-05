import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Trophy, TrendingUp, Activity } from "lucide-react";

const EmployeeMonitoringPage = () => {
  const { token } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/admin/employee-monitoring`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        setEmployees(data.employees || []);
      } catch (err) {
        console.error("Failed to load employee monitoring", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [token]);

  const totalEmployees = employees.length;
  const avgProgress =
    employees.reduce((a, e) => a + (e.progressPercent || 0), 0) /
      (employees.length || 1);

  const totalXp = employees.reduce((a, e) => a + (e.totalXp || 0), 0);
  const totalCompleted = employees.reduce(
    (a, e) => a + (e.completedModules || 0),
    0
  );

  const insights = useMemo(
    () => [
      {
        label: "Average Progress",
        value: `${avgProgress.toFixed(0)}%`,
        icon: <TrendingUp className="h-4 w-4" />,
        helper: "Across all active learners",
      },
      {
        label: "Total XP Earned",
        value: totalXp.toLocaleString(),
        icon: <Trophy className="h-4 w-4" />,
        helper: "Lifetime experience points",
      },
      {
        label: "Modules Completed",
        value: totalCompleted,
        icon: <Activity className="h-4 w-4" />,
        helper: "Summed per learner",
      },
    ],
    [avgProgress, totalXp, totalCompleted]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading employee progress…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="admin-glow-card rounded-3xl border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-indigo-50/60 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Pulse</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Employee Monitoring</h1>
            <p className="mt-2 text-slate-500">
              Watch real-time module completion, XP velocity, and engagement health.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-right">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Active</p>
            <p className="text-3xl font-semibold text-slate-900">{totalEmployees}</p>
            <p className="text-sm text-slate-500">Learners reporting</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {insights.map((insight) => (
          <div
            key={insight.label}
            className="admin-glow-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-500">
              <p className="text-xs uppercase tracking-[0.4em]">{insight.label}</p>
              <span className="rounded-xl bg-indigo-50 p-2 text-indigo-500">
                {insight.icon}
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{insight.value}</p>
            <p className="text-sm text-slate-500">{insight.helper}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="admin-glow-card overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Employee</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">XP</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Modules</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Progress</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Status</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((e) => {
              const status =
                e.progressPercent === 100
                  ? "Completed"
                  : e.progressPercent >= 60
                  ? "On Track"
                  : "Behind";

              return (
                <tr key={e.userId} className="border-b border-slate-100 bg-white/70 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                        {e.name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{e.name || "Unknown"}</p>
                        <p className="text-sm text-slate-500">{e.email || "No email"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-semibold text-indigo-600">⚡ {e.totalXp}</td>

                  <td className="px-6 py-4 text-slate-700">
                    {e.completedModules} / {e.totalModules}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${e.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600">{e.progressPercent}%</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        status === "Completed"
                          ? "rounded-full bg-indigo-50 text-indigo-600"
                          : status === "On Track"
                          ? "rounded-full bg-emerald-50 text-emerald-600"
                          : "rounded-full bg-rose-50 text-rose-600"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};


export default EmployeeMonitoringPage;
