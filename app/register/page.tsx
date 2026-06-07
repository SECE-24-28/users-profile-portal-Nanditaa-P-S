"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `mutation { register(name: "${name}", email: "${email}", password: "${password}") }` }),
    });

    const json = await res.json();
    setLoading(false);
    if (json.errors) { setError(json.errors[0].message); return; }
    localStorage.setItem("token", json.data.register);
    router.push("/students");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 text-2xl mb-3">✏️</div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 text-sm mt-1">Register to get started</p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 font-semibold disabled:opacity-60">
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
