"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Student = { id: string; name: string; email: string; department: string; imageUrl?: string };

async function gql(query: string, token: string) {
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

const DEPT_COLORS: Record<string, string> = {
  CSE: "bg-violet-100 text-violet-700",
  ECE: "bg-blue-100 text-blue-700",
  MECH: "bg-orange-100 text-orange-700",
  CIVIL: "bg-green-100 text-green-700",
  IT: "bg-pink-100 text-pink-700",
};
function deptBadge(d: string) {
  return DEPT_COLORS[d.toUpperCase()] ?? "bg-slate-100 text-slate-600";
}

export default function StudentsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/login"); return; }
    setToken(t);
    load(t);
  }, []);

  async function load(t: string) {
    const json = await gql(`query { students { id name email department imageUrl } }`, t);
    if (json.errors) { localStorage.removeItem("token"); router.push("/login"); return; }
    setStudents(json.data.students);
  }

  async function uploadImage(): Promise<string> {
    if (!imageFile) return imageUrl;
    setUploading(true);
    const form = new FormData();
    form.append("file", imageFile);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json();
    setUploading(false);
    return json.url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = await uploadImage();

    const mutation = editingId
      ? `mutation { updateStudent(id:"${editingId}", name:"${name}", email:"${email}", department:"${department}", imageUrl:"${url}") { id } }`
      : `mutation { addStudent(name:"${name}", email:"${email}", department:"${department}", imageUrl:"${url}") { id } }`;

    const json = await gql(mutation, token);
    if (json.errors) { setError(json.errors[0].message); return; }
    closeModal();
    load(token);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await gql(`mutation { deleteStudent(id:"${deleteId}") }`, token);
    setDeleteId(null);
    load(token);
  }

  function openAdd() { closeModal(); setShowModal(true); }
  function openEdit(s: Student) {
    setEditingId(s.id); setName(s.name); setEmail(s.email);
    setDepartment(s.department); setImageUrl(s.imageUrl || "");
    setPreview(s.imageUrl || ""); setImageFile(null); setShowModal(true);
  }
  function closeModal() {
    setShowModal(false); setEditingId(null);
    setName(""); setEmail(""); setDepartment(""); setImageUrl(""); setImageFile(null); setPreview("");
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <span className="font-bold text-slate-800 text-lg">Student Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{students.length} students</span>
          <button
            onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}
            className="text-slate-600 hover:text-red-500 border border-slate-200 hover:border-red-300 px-3 py-1.5 text-sm">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <input
            type="text" placeholder="🔍  Search by name or department…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="sm:w-72"
          />
          <div className="sm:ml-auto">
            <button onClick={openAdd}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 font-semibold flex items-center gap-2">
              <span className="text-lg leading-none">+</span> Add Student
            </button>
          </div>
        </div>

        {error && <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-3">🎒</div>
            <p className="text-lg font-medium">{search ? "No matches found" : "No students yet"}</p>
            {!search && <p className="text-sm mt-1">Click <strong>Add Student</strong> to get started</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(s => (
              <div key={s.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                {/* Avatar */}
                {s.imageUrl ? (
                  <Image src={s.imageUrl} alt={s.name} width={72} height={72} unoptimized
                    className="w-18 h-18 rounded-full object-cover ring-2 ring-indigo-100 mb-3" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold mb-3 ring-2 ring-indigo-50">
                    {s.name[0].toUpperCase()}
                  </div>
                )}

                <p className="font-semibold text-slate-800 text-base leading-tight">{s.name}</p>
                <p className="text-slate-400 text-xs mt-0.5 truncate w-full">{s.email}</p>
                <span className={`mt-2 text-xs px-2.5 py-0.5 rounded-full font-medium ${deptBadge(s.department)}`}>
                  {s.department}
                </span>

                <div className="flex gap-2 mt-4 w-full">
                  <button onClick={() => openEdit(s)}
                    className="flex-1 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-1.5 text-xs font-semibold">
                    Edit
                  </button>
                  <button onClick={() => setDeleteId(s.id)}
                    className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 py-1.5 text-xs font-semibold">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">{editingId ? "Edit Student" : "Add Student"}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Image preview */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-2xl font-bold text-slate-400 shrink-0">
                  {preview ? (
                    <Image src={preview} alt="preview" width={64} height={64} unoptimized className="object-cover w-full h-full" />
                  ) : (
                    name ? name[0].toUpperCase() : "?"
                  )}
                </div>
                <label className="flex-1 cursor-pointer border border-dashed border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                  📷 {imageFile ? imageFile.name : "Upload photo"}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0] || null;
                      setImageFile(f);
                      if (f) setPreview(URL.createObjectURL(f));
                    }} />
                </label>
              </div>

              <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="text" placeholder="Department (e.g. CSE, ECE)" value={department} onChange={e => setDepartment(e.target.value)} required />

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={uploading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60">
                  {uploading ? "Uploading…" : editingId ? "Save Changes" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="font-bold text-slate-800 text-lg">Delete Student?</h3>
            <p className="text-slate-500 text-sm mt-1 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
