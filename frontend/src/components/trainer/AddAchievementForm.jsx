import { useState } from "react";

const AddAchievementForm = ({ moduleId, onCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🏆");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const accessToken = localStorage.getItem("accessToken");

    const res = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/achievements`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          description,
          icon,
          type: "MODULE_COMPLETE",
          moduleId,
        }),
      }
    );

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      onCreated(data.achievement);
      setTitle("");
      setDescription("");
    }
  };

  return (
    <div className="rounded-2xl border p-4 bg-white">
      <h4 className="font-bold mb-3">Add Achievement</h4>

      <input
        className="w-full mb-2 p-2 border rounded"
        placeholder="Achievement title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        className="w-full mb-2 p-2 border rounded"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        className="w-full mb-3 p-2 border rounded"
        placeholder="Icon (emoji)"
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
      />

      <button
        onClick={submit}
        disabled={loading}
        className="px-4 py-2 rounded bg-indigo-600 text-white font-semibold"
      >
        {loading ? "Creating..." : "Create Achievement"}
      </button>
    </div>
  );
};

export default AddAchievementForm;
