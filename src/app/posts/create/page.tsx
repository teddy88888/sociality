
"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function CreatePostPage() {
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Pilih file gambar yang valid.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 5 MB.");
      return;
    }

    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!image) {
      setError("Silakan pilih foto terlebih dahulu.");
      return;
    }

    
    setSubmitting(true);

    try {
      // Endpoint create post akan disambungkan setelah format API
      // dikonfirmasi dari dokumentasi backend.
      const formData = new FormData();
      formData.append("caption", caption.trim());
      formData.append("image", image);

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Gagal membuat postingan.");
      }

      router.push("/profile");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal membuat postingan. Silakan coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-[#FDFDFD]">
        <Header />

      <section className="mx-auto w-full max-w-[452px] px-5 pb-16 pt-10 sm:pt-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/profile"
            aria-label="Kembali ke profil"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#181D27]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Add Post</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="post-image"
              className="mb-2 block text-sm font-bold"
            >
              Photo
            </label>

            <label
              htmlFor="post-image"
              className="flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#B41759] bg-[#0A0D12] p-4 text-center transition hover:bg-[#11151D]"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Pratinjau foto postingan"
                  className="max-h-64 w-full rounded-lg object-contain"
                />
              ) : (
                <>
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#181D27]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M12 16V4m-4 4 4-4 4 4" />
                      <path d="M20 16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3" />
                    </svg>
                  </span>
                  <span className="text-sm">
                    <span className="font-bold text-[#7F51F9]">
                      Click to upload
                    </span>{" "}
                    <span className="text-[#94979C]">or drag and drop</span>
                  </span>
                  <span className="mt-2 text-xs text-[#535862]">
                    JPG, PNG, atau WEBP. Maksimal 5 MB.
                  </span>
                </>
              )}
            </label>

            <input
              id="post-image"
              type="file"
              accept="JPG, PNG, atau WEBP. Maksimal 5 MB."
              onChange={handleImageChange}
              className="sr-only"
            />

            {image && (
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#94979C]">
                <span className="truncate">{image.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setPreview("");
                    setError("");
                  }}
                  className="shrink-0 text-[#A78BFA] hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            <p className="mt-2 text-xs text-[#B41759]">
              Maksimal ukuran file 10 MB.
            </p>
          </div>

          <div>
            <label
              htmlFor="caption"
              className="mb-2 block text-sm font-bold"
            >
              Caption
            </label>

            <textarea
              id="caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Create your caption"
              rows={4}
              maxLength={2000}
              className="w-full resize-y rounded-xl border border-[#B41759] bg-[#0A0D12] px-4 py-3 text-base outline-none placeholder:text-[#535862] focus:border-[#7F51F9]"
            />

            <p className="mt-2 text-xs text-[#94979C]">
              {caption.length}/2000 karakter
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#6936F2] px-4 font-bold transition hover:bg-[#7F51F9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Post"}
          </button>
        </form>
      </section>
    </main>
  );
}
