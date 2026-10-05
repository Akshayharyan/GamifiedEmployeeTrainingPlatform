import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Layers, Users as UsersIcon, Share2, Search, Sparkles } from "lucide-react";

function AssignModulePage() {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trainerSearch, setTrainerSearch] = useState("");

  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Users load failed:", err));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setModules(data.modules || []))
      .catch((err) => console.error("Modules load failed:", err));
  }, [token]);

  const trainers = useMemo(() => users.filter((u) => u.role === "trainer"), [users]);
  const selectedTrainerData = useMemo(
    () => trainers.find((t) => t._id === selectedTrainer) || null,
    [trainers, selectedTrainer]
  );
  const selectedModuleData = useMemo(
    () => modules.find((m) => m._id === selectedModule) || null,
    [modules, selectedModule]
  );
  const visibleTrainers = useMemo(() => {
    const query = trainerSearch.trim().toLowerCase();
    if (!query) return trainers;
    return trainers.filter(
      (t) =>
        (t.name || "").toLowerCase().includes(query) ||
        (t.email || "").toLowerCase().includes(query)
    );
  }, [trainers, trainerSearch]);

  const handleAssign = async () => {
    if (!selectedTrainer || !selectedModule) {
      alert("Select module and trainer first");
      return;
    }

    setLoading(true);

    const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/admin/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        trainerId: selectedTrainer,
        moduleId: selectedModule,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return alert(data.message || "Assignment failed");

    alert("🎉 Module assigned successfully");
    setSelectedTrainer(null);
    setSelectedModule(null);
  };

  const overviewStats = [
    {
      label: "Modules",
      value: modules.length,
      helper: "Ready for guidance",
      icon: <Layers className="h-4 w-4" />,
    },
    {
      label: "Trainers",
      value: trainers.length,
      helper: "Eligible mentors",
      icon: <UsersIcon className="h-4 w-4" />,
    },
    {
      label: "Selection",
      value: selectedModule && selectedTrainer ? "Locked" : "Pending",
      helper: "Choose module + trainer",
      icon: <Share2 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="admin-glow-card rounded-3xl border border-slate-100 bg-gradient-to-r from-white to-slate-50 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Pairing</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Assign Trainers</h1>
        <p className="text-slate-500">Connect trainers with modules that match their craft.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {overviewStats.map((stat) => (
          <div
            key={stat.label}
            className="admin-glow-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-500">
              <p className="text-xs uppercase tracking-[0.4em]">{stat.label}</p>
              <span className="rounded-xl bg-indigo-50 p-2 text-indigo-500">{stat.icon}</span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="admin-glow-card rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Select Module</h3>
          <p className="text-sm text-slate-500">Choose the experience that needs a trainer.</p>

          <div className="mt-4 max-h-[520px] space-y-3 overflow-auto pr-1">
            {modules.map((m) => (
              <button
                type="button"
                key={m._id}
                onClick={() => setSelectedModule(m._id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  selectedModule === m._id
                    ? "border-indigo-400 bg-indigo-50 shadow"
                    : "border-slate-100 bg-slate-50 hover:border-indigo-200"
                }`}
              >
                <p className="font-semibold text-slate-900">{m.title}</p>
                <p className="text-sm text-slate-500">
                  {m.description || "Awaiting description"}
                </p>
              </button>
            ))}
            {modules.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No modules available yet.
              </p>
            )}
          </div>
        </section>

        <section className="admin-glow-card rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Trainer Selection</h3>
              <p className="text-sm text-slate-500">Search and pick the best mentor for this module.</p>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={trainerSearch}
                onChange={(e) => setTrainerSearch(e.target.value)}
                placeholder="Search trainer"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-700 focus:border-indigo-300 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-500">Current Pair</p>
            <p className="mt-2 text-sm text-slate-700">
              {selectedModuleData && selectedTrainerData
                ? `${selectedTrainerData.name} -> ${selectedModuleData.title}`
                : "Select a module and trainer to lock the pair."}
            </p>
          </div>

          <div className="mt-4 max-h-[440px] space-y-3 overflow-auto pr-1">
            {visibleTrainers.map((u) => (
              <button
                type="button"
                key={u._id}
                onClick={() => setSelectedTrainer(u._id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  selectedTrainer === u._id
                    ? "border-indigo-400 bg-indigo-50 shadow"
                    : "border-slate-100 bg-slate-50 hover:border-indigo-200"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                  {u.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  <p className="truncate text-sm text-slate-500">{u.email}</p>
                </div>
                {selectedTrainer === u._id && (
                  <span className="rounded-full bg-indigo-600 px-2 py-1 text-xs font-semibold text-white">
                    Selected
                  </span>
                )}
              </button>
            ))}
            {trainers.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Promote a user to trainer to assign modules.
              </p>
            )}
            {trainers.length > 0 && visibleTrainers.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No trainer matches this search.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="admin-glow-card flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Summary</p>
          <p className="text-sm text-slate-600">
            {selectedModule && selectedTrainer
              ? "All set—deploy the assignment."
              : "Pick a module and trainer to continue."}
          </p>
          {selectedModuleData && selectedTrainerData && (
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-indigo-700">
              <Sparkles className="h-4 w-4" /> Ready: {selectedTrainerData.name} on {selectedModuleData.title}
            </p>
          )}
        </div>
        <button
          onClick={handleAssign}
          disabled={loading}
          className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Assigning…" : "Assign Trainer"}
        </button>
      </div>
    </div>
  );
}

export default AssignModulePage;