
"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Post = {
  id: number;
  imageUrl: string;
  caption: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatarUrl?: string | null;
  };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

type Comment = {
  id: number;
  text: string;
  createdAt?: string;
  author?: {
    username?: string;
    name?: string;
    avatarUrl?: string | null;
  };
};

function PostDetailContent() {
  const params = useParams<{ id: string }>();
  const postId = params.id;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");

  const loadPost = useCallback(async () => {
    const response = await fetch(`/api/posts/${postId}`, {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Gagal memuat postingan.");
    }

    setPost(result.data);
  }, [postId]);

  const loadComments = useCallback(async () => {
    const response = await fetch(
      `/api/posts/${postId}/comments?page=1&limit=10`,
      { cache: "no-store" }
    );
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Gagal memuat komentar.");
    }

    setComments(result.data?.comments ?? []);
  }, [postId]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [postResponse, commentsResponse] = await Promise.all([
          fetch(`/api/posts/${postId}`, { cache: "no-store" }),
          fetch(`/api/posts/${postId}/comments?page=1&limit=10`, {
            cache: "no-store",
          }),
        ]);

        const postResult = await postResponse.json();
        const commentsResult = await commentsResponse.json();

        if (!postResponse.ok || !postResult.success) {
          throw new Error(
            postResult.message || "Gagal memuat postingan."
          );
        }

        if (!commentsResponse.ok || !commentsResult.success) {
          throw new Error(
            commentsResult.message || "Gagal memuat komentar."
          );
        }

        if (active) {
          setPost(postResult.data);
          setComments(commentsResult.data?.comments ?? []);
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat memuat postingan."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (postId) loadData();

    return () => {
      active = false;
    };
  }, [postId]);

  async function handleCommentSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const text = commentText.trim();
    if (!text || sending) return;

    setSending(true);
    setCommentError("");

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengirim komentar.");
      }

      setCommentText("");
      await Promise.all([loadComments(), loadPost()]);
    } catch (err: unknown) {
      setCommentError(
        err instanceof Error ? err.message : "Gagal mengirim komentar."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        Memuat postingan...
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <Link href="/profile" className="text-purple-400 hover:underline">
          ← Kembali ke profil
        </Link>
        <p className="mt-6 text-red-400">
          {error || "Postingan tidak ditemukan."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/profile"
          className="mb-6 inline-block text-sm text-purple-400 hover:underline"
        >
          ← Kembali ke profil
        </Link>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex items-center justify-center overflow-hidden rounded-xl bg-[#181D27]">
            <img
              src={post.imageUrl}
              alt={post.caption || "Foto postingan"}
              className="max-h-[75vh] w-full object-contain"
            />
          </div>

          <section className="rounded-xl border border-white/10 bg-[#101010] p-5">
            <Link
              href={`/users/${post.author.username}`}
              className="font-semibold hover:text-purple-400"
            >
              {post.author.name}
            </Link>

            <p className="text-sm text-gray-400">
              @{post.author.username}
            </p>

            <p className="mt-4 whitespace-pre-wrap">{post.caption}</p>

            <div className="mt-4 border-b border-white/10 pb-4 text-sm text-gray-400">
              ♥ {post.likeCount} suka
              <span className="mx-3">·</span>
              {post.commentCount} komentar
            </div>

            <h2 className="mb-4 mt-5 text-lg font-semibold">
              Komentar
            </h2>

            <div className="max-h-72 space-y-4 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Belum ada komentar.
                </p>
              ) : (
                comments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-lg bg-white/5 p-3"
                  >
                    <p className="text-sm font-semibold">
                      {comment.author?.name ||
                        comment.author?.username ||
                        "Pengguna"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-200">
                      {comment.text}
                    </p>
                  </article>
                ))
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="mt-5">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Tulis komentar..."
                rows={3}
                maxLength={1000}
                className="w-full resize-y rounded-lg border border-white/10 bg-[#181D27] p-3 text-sm outline-none focus:border-purple-500"
              />

              {commentError && (
                <p className="mt-2 text-sm text-red-400">
                  {commentError}
                </p>
              )}

              <button
                type="submit"
                disabled={sending || !commentText.trim()}
                className="mt-3 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Mengirim..." : "Kirim komentar"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function PostDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black p-8 text-white">
          Memuat postingan...
        </main>
      }
    >
      <PostDetailContent />
    </Suspense>
  );
}
