"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Registrasi gagal.");
      }

      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-2xl border border-[#181D27] bg-[#0A0D12] p-8">
        <h1 className="text-center text-3xl font-bold">Sociality</h1>
        <p className="mt-2 text-center text-sm text-[#A4A7AE]">
          Buat akun baru
        </p>

        <form onSubmit={handleRegister} className="mt-8 space-y-4">
          {(
            [
              ["name", "Nama lengkap", "text"],
              ["username", "Username", "text"],
              ["email", "Email", "email"],
              ["phone", "Nomor telepon", "tel"],
              ["password", "Password", "password"],
            ] as const
          ).map(([field, label, type]) => (
            <div key={field}>
              <label htmlFor={field} className="mb-2 block text-sm">
                {label}
              </label>
              <input
                id={field}
                type={type}
                value={form[field]}
                onChange={(e) => updateField(field, e.target.value)}
                required
                autoComplete={
                  field === "password"
                    ? "new-password"
                    : field === "email"
                      ? "email"
                      : "off"
                }
                placeholder={`Masukkan ${label.toLowerCase()}`}
                className="w-full rounded-xl border border-[#181D27] bg-black px-4 py-3 outline-none focus:border-[#6936F2]"
              />
            </div>
          ))}

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#6936F2] py-3 font-semibold hover:bg-[#7F51F9] disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#A4A7AE]">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-[#A78BFA]">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
