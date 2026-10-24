"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";

type Post = {
  id: number;
  imageUrl: string;
  caption: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

type FeedResponse = {
  success: boolean;
  message: string;
  data: { items: Post[] } | null;
};

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="10.8"
        cy="10.8"
        r="6.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HomeIcon({ active = false }: { active?: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"
        fill={active ? "#7F51F9" : "none"}
        stroke={active ? "#7F51F9" : "#FDFDFD"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="#FDFDFD"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="4" fill="#FDFDFD" />
      <path d="M4 21a8 8 0 0 1 16 0z" fill="#FDFDFD" />
    </svg>
  );
}

function HeartIcon({ liked }: { liked: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.3 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
        fill={liked ? "#B41759" : "none"}
        stroke={liked ? "#B41759" : "#FDFDFD"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-9.5A7.5 7.5 0 0 1 10.5 4H12a8 8 0 0 1 8 7.5Z"
        stroke="#FDFDFD"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 11h.01M12 11h.01M16 11h.01"
        stroke="#FDFDFD"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21 3 14 21l-4-8-7-4 18-6Z"
        stroke="#FDFDFD"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M21 3 10 13"
        stroke="#FDFDFD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SaveIcon({ saved }: { saved: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21l-7-4-7 4V4.5Z"
        stroke={saved ? "#7F51F9" : "#FDFDFD"}
        fill={saved ? "#7F51F9" : "none"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedPosts, setExpandedPosts] = useState<number[]>([]);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [savedPosts, setSavedPosts] = useState<number[]>([]);
  const [copiedPostId, setCopiedPostId] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadFeed() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/feed", {
          cache: "no-store",
        });

        const result: FeedResponse = await response.json();

        if (response.status === 401) {
          setIsLoggedIn(false);
          setPosts([]);
          return;
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Gagal memuat postingan.");
        }

        setIsLoggedIn(true);
        setPosts(result.data?.items ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat feed.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadFeed();
  }, []);

  const keyword = search.trim().toLowerCase();

  const filteredPosts = posts.filter(
    (post) =>
      (post.author?.name ?? "").toLowerCase().includes(keyword) ||
      (post.author?.username ?? "").toLowerCase().includes(keyword) ||
      (post.caption ?? "").toLowerCase().includes(keyword),
  );

  const visiblePosts = filteredPosts;

  function toggleCaption(id: number) {
    setExpandedPosts((current) =>
      current.includes(id)
        ? current.filter((postId) => postId !== id)
        : [...current, id],
    );
  }

  async function sharePost(id: number) {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/posts/${id}`,
      );
      setCopiedPostId(id);
    } catch {
      setCopiedPostId(null);
    }
  }

  function formatDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout gagal.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Logout gagal.");
      setLoggingOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-black pb-28 text-[#FDFDFD]">
      {/* Header */}
      <Header isLoggedIn={isLoggedIn} search={search} onSearch={setSearch} />

      {/* Timeline */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-10 sm:px-6">
        <div className="mx-auto flex w-full max-w-[600px] flex-col gap-6">
          {loading && (
            <p className="py-10 text-center text-sm text-[#A4A7AE]">
              Memuat postingan...
            </p>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-[#181D27] p-5 text-sm text-[#FCA5A5]">
              {error}
            </div>
          )}

          {!loading && !error && visiblePosts.length === 0 && (
            <p className="py-10 text-center text-sm text-[#A4A7AE]">
              {search
                ? "Tidak ada postingan yang cocok dengan pencarian."
                : "Belum ada postingan untuk ditampilkan."}
            </p>
          )}

          {!loading &&
            !error &&
            visiblePosts.map((post) => {
              const expanded = expandedPosts.includes(post.id);
              const liked = likedPosts.includes(post.id) || post.likedByMe;
              const saved = savedPosts.includes(post.id);
              const caption = post.caption ?? "";
              const needsMore = caption.length > 120;
              return (
                <article
                  key={post.id}
                  className="flex w-full flex-col gap-3 border-b border-[#181D27] pb-6"
                >
                  {/* Author */}
                  <div className="flex h-16 items-center gap-3">
                    {post.author.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.author.avatarUrl}
                        alt={post.author.name}
                        className="size-16 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#27212F] text-lg font-semibold">
                        {post.author.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold leading-[30px] tracking-[-0.02em]">
                        {post.author.name}
                      </p>
                      <p className="text-sm leading-7 tracking-[-0.02em] text-[#A4A7AE]">
                        @{post.author.username} · {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Post image */}
                  {post.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.imageUrl}
                      alt={`Postingan dari ${post.author.name}`}
                      className="aspect-square w-full rounded-lg object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Post actions */}
                  <div className="flex h-[30px] w-full items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setLikedPosts((current) =>
                            current.includes(post.id)
                              ? current.filter((id) => id !== post.id)
                              : [...current, post.id],
                          )
                        }
                        className="flex h-[30px] items-center gap-1.5"
                        aria-label={liked ? "Batalkan suka" : "Sukai postingan"}
                      >
                        <HeartIcon liked={liked} />
                        <span className="text-base font-semibold leading-[30px]">
                          {post.likeCount + (liked && !post.likedByMe ? 1 : 0)}
                        </span>
                      </button>

                      <Link
                        href={`/posts/${post.id}#comments`}
                        className="flex h-[30px] items-center gap-1.5"
                        aria-label="Lihat komentar"
                      >
                        <CommentIcon />
                        <span className="text-base font-semibold leading-[30px]">
                          {post.commentCount}
                        </span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => sharePost(post.id)}
                        className="flex h-[30px] items-center gap-1.5"
                        aria-label="Bagikan postingan"
                        title={
                          copiedPostId === post.id
                            ? "Tautan disalin"
                            : "Bagikan"
                        }
                      >
                        <ShareIcon />
                        <span className="text-base font-semibold leading-[30px]">
                          {copiedPostId === post.id ? "OK" : ""}
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSavedPosts((current) =>
                          current.includes(post.id)
                            ? current.filter((id) => id !== post.id)
                            : [...current, post.id],
                        )
                      }
                      className="flex size-6 shrink-0 items-center justify-center"
                      aria-label={
                        saved ? "Hapus dari tersimpan" : "Simpan postingan"
                      }
                    >
                      <SaveIcon saved={saved} />
                    </button>
                  </div>

                  {/* Caption */}
                  <div className="flex w-full max-w-[526px] flex-col gap-1 text-base leading-[30px] tracking-[-0.02em]">
                    <p className="font-bold">{post.author.name}</p>

                    <p className="whitespace-pre-wrap break-words">
                      {expanded || !needsMore
                        ? caption
                        : `${caption.slice(0, 120).trimEnd()}...`}
                    </p>

                    {needsMore && (
                      <button
                        type="button"
                        onClick={() => toggleCaption(post.id)}
                        className="self-start font-semibold text-[#7F51F9]"
                      >
                        {expanded ? "Show Less" : "Show More"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      {/* Bottom navigation */}
      <nav
        aria-label="Navigasi utama"
        className="fixed bottom-8 left-1/2 z-40 flex h-20 w-[min(360px,calc(100%-32px))] -translate-x-1/2 items-center justify-center gap-5 rounded-full border border-[#181D27] bg-[#0A0D12] px-4"
      >
        <Link
          href="/"
          className="flex h-[58px] w-[94px] flex-col items-center justify-center gap-1 text-[#7F51F9]"
          aria-current="page"
        >
          <HomeIcon active />
          <span className="text-base font-bold leading-[30px]">Home</span>
        </Link>

        <Link
          href="/create"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#6936F2]"
          aria-label="Buat postingan"
        >
          <PlusIcon />
        </Link>

        <Link
          href="/profile"
          className="flex h-[58px] w-[94px] flex-col items-center justify-center gap-1 text-[#FDFDFD]"
        >
          <ProfileIcon />
          <span className="text-base font-normal leading-[30px]">Profile</span>
        </Link>
      </nav>
    </main>
  );
}
