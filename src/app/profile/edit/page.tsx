"use client";

import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "@/lib/api/profile";
import type { UserProfile } from "@/types/profile";
import Header from "@/components/Header";

export default function EditProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | undefined>();
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    getMyProfile()
      .then((result) => {
        if (!active) return;

        const user = result.data.profile;
        setProfile(user);
        setName(user.name);
        setUsername(user.username);
        setPhone(user.phone);
        setBio(user.bio ?? "");
        setAvatarPreview(user.avatarUrl ?? "");
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Gagal memuat profil.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Foto harus berformat JPG, PNG, atau WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5 MB.");
      return;
    }

    setError("");
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateMyProfile({
        name,
        username,
        phone,
        bio,
        avatar,
      });

      setProfile((current) =>
        current ? { ...current, ...result.data } : current,
      );

      setAvatar(undefined);
      setAvatarPreview(result.data.avatarUrl || avatarPreview);
      setSuccess("Profil berhasil diperbarui.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memperbarui profil.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        Memuat profil...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <p>{error || "Profil tidak tersedia."}</p>
        <a className="mt-4 inline-block underline" href="/login">
          Kembali ke Login
        </a>
      </main>
    );
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-[#181D27] bg-[#0A0D12] px-4 py-3 text-white outline-none focus:border-[#6936F2]";

  return (
    <main className="min-h-screen bg-black px-5 py-12 text-white sm:px-8">
      <Header />
      <section className="mx-auto max-w-[800px]">
        <a href="/profile" className="text-sm text-gray-400">
          ← Kembali ke profil
        </a>

        <h1 className="mb-8 mt-5 text-2xl font-semibold">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Foto profil</label>

            <div className="mt-3 flex flex-wrap items-center gap-5">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview foto profil"
                  className="h-28 w-28 rounded-full object-cover"
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-[#181D27]" />
              )}

              <label className="cursor-pointer rounded-full border border-[#181D27] px-5 py-3 text-sm">
                Change photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={30}
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              className={`${inputClass} cursor-not-allowed opacity-60`}
              value={profile.email}
              readOnly
            />
            <p className="mt-2 text-xs text-gray-500">
              Email tidak dapat diubah melalui endpoint ini.
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="text-sm font-medium">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
            />
          </div>

          <div>
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <textarea
              id="bio"
              className={`${inputClass} min-h-28 resize-y`}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-[#F0447A]">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="text-sm text-green-400">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#6936F2] px-5 py-3 font-semibold transition hover:bg-[#5728D8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>
    </main>
  );
}
