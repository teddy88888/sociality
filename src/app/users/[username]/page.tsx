"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";

type User = {
  id: number;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  counts: {
    post: number;
    followers: number;
    following: number;
    likes: number;
  };
  isFollowing: boolean;
  isMe: boolean;
};

type Post = {
  id: number;
  imageUrl: string | null;
  caption: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
};

type ProfileListUser = {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  isFollowedByMe: boolean;
};

type ProfileListResponse = {
  users: ProfileListUser[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiResult<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

function UserProfileContent() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [profileListType, setProfileListType] = useState<
    "followers" | "following" | null
  >(null);
  const [profileListUsers, setProfileListUsers] = useState<ProfileListUser[]>(
    [],
  );
  const [profileListLoading, setProfileListLoading] = useState(false);
  const [profileListError, setProfileListError] = useState("");
  const [likesLoading, setLikesLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUser = useCallback(async () => {
    const response = await fetch(`/api/users/${encodeURIComponent(username)}`, {
      cache: "no-store",
    });

    const result: ApiResult<User> = await response.json();

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || "Gagal memuat profil.");
    }

    setUser(result.data);
  }, [username]);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(username)}/posts`,
        { cache: "no-store" },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal memuat postingan.");
      }

      const data = result.data;
      const items = Array.isArray(data)
        ? data
        : (data?.posts ?? data?.items ?? []);

      setPosts(items);
    } catch (err) {
      setPosts([]);
      setNotice(
        err instanceof Error ? err.message : "Postingan belum dapat dimuat.",
      );
    } finally {
      setPostsLoading(false);
    }
  }, [username]);

  const loadLikes = useCallback(async () => {
    setLikesLoading(true);

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(username)}/likes`,
        { cache: "no-store" },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal memuat Likes.");
      }

      const data = result.data;

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.posts)
          ? data.posts
          : Array.isArray(data?.items)
            ? data.items
            : [];

      setLikedPosts(items);
    } catch (err) {
      setLikedPosts([]);

      setNotice(
        err instanceof Error ? err.message : "Daftar Likes belum dapat dimuat.",
      );
    } finally {
      setLikesLoading(false);
    }
  }, [username]);

  const loadProfileList = useCallback(
    async (type: "followers" | "following") => {
      setProfileListType(type);
      setProfileListLoading(true);
      setProfileListError("");
      setProfileListUsers([]);

      try {
        const response = await fetch(
          `/api/users/${encodeURIComponent(username)}/${type}?page=1&limit=20`,
          { cache: "no-store" },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Gagal memuat daftar akun.");
        }

        const users = result.data?.users;

        if (!Array.isArray(users)) {
          throw new Error("Format daftar akun dari API tidak sesuai.");
        }

        setProfileListUsers(users);
      } catch (err) {
        setProfileListError(
          err instanceof Error ? err.message : "Gagal memuat daftar akun.",
        );
      } finally {
        setProfileListLoading(false);
      }
    },
    [username],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/users/${encodeURIComponent(username)}`,
          { cache: "no-store" },
        );
        const result: ApiResult<User> = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "Pengguna tidak ditemukan.");
        }

        if (!cancelled) {
          setUser(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuat profil pengguna.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (username) loadProfile();

    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    if (!username || !user) return;

    if (activeTab === "posts") {
      loadPosts();
    } else {
      loadLikes();
    }
  }, [username, activeTab, user, loadPosts, loadLikes]);

  async function handleFollow() {
    if (!user || followingLoading) return;

    setFollowingLoading(true);
    setNotice("");

    try {
      const response = await fetch(
        `/api/follow/${encodeURIComponent(username)}`,
        { method: user.isFollowing ? "DELETE" : "POST" },
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Aksi Follow gagal.");
      }

      await loadUser();
      setNotice(
        user.isFollowing
          ? "Berhasil berhenti mengikuti pengguna."
          : "Berhasil mengikuti pengguna.",
      );
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Aksi Follow gagal.");
    } finally {
      setFollowingLoading(false);
    }
  }

  async function handleShare() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Profil ${user?.name ?? username}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setNotice("Link profil berhasil disalin.");
      }
    } catch {
      // Pengguna mungkin membatalkan dialog berbagi.
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        Memuat profil...
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <h1 className="text-xl font-bold">Profil tidak ditemukan</h1>
        <p className="mt-2 text-gray-400">
          {error || "Pengguna tidak ditemukan."}
        </p>
        <Link href="/" className="mt-5 inline-block text-violet-400">
          ← Kembali ke beranda
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-28 text-[#FDFDFD]">
      <Header />

      <div className="mx-auto mt-10 w-full max-w-[812px] px-4">
        <section>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-5">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={`Foto profil ${user.name}`}
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#181D27] text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h1 className="truncate text-base font-bold">{user.name}</h1>
                <p className="truncate text-sm text-[#A4A7AE]">
                  @{user.username}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {!user.isMe && (
                <button
                  type="button"
                  onClick={handleFollow}
                  disabled={followingLoading}
                  className={`rounded-full px-5 py-3 text-sm font-bold transition disabled:opacity-50 ${
                    user.isFollowing
                      ? "border border-[#181D27] bg-[#0A0D12] text-white"
                      : "bg-[#6936F2] text-white hover:bg-violet-700"
                  }`}
                >
                  {followingLoading
                    ? "Memproses..."
                    : user.isFollowing
                      ? "Following"
                      : "Follow"}
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                aria-label="Bagikan profil"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#181D27] hover:bg-[#0A0D12]"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M22 2 15 22l-4-9-9-4 20-7ZM22 2 11 13"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {user.bio && (
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7">
              {user.bio}
            </p>
          )}

          <div className="mt-6 grid grid-cols-4 items-center border-y border-[#181D27] py-4">
            {[
              { label: "Posts", value: user.counts.post },
              { label: "Followers", value: user.counts.followers },
              { label: "Following", value: user.counts.following },
              { label: "Likes", value: user.counts.likes },
            ].map((stat) => {
              const listType =
                stat.label === "Followers"
                  ? "followers"
                  : stat.label === "Following"
                    ? "following"
                    : null;

              return (
                <div key={stat.label} className="text-center">
                  {listType ? (
                    <button
                      type="button"
                      onClick={() => loadProfileList(listType)}
                      className="rounded-md px-2 py-1 transition hover:bg-[#181D27]"
                    >
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="mt-1 text-sm text-[#A4A7AE]">
                        {stat.label}
                      </p>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(
                          stat.label === "Posts" ? "posts" : "likes",
                        );
                        document
                          .getElementById("profile-posts")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="rounded-md px-2 py-1 transition hover:bg-[#181D27]"
                    >
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="mt-1 text-sm text-[#A4A7AE]">
                        {stat.label}
                      </p>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {profileListType && (
          <section
            className="mt-4 rounded-2xl border border-[#181D27] bg-[#0A0D12] p-4"
            aria-label={`Daftar ${profileListType}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">
                {profileListType === "followers" ? "Followers" : "Following"}
              </h2>
              <button
                type="button"
                onClick={() => setProfileListType(null)}
                aria-label="Tutup daftar akun"
                className="rounded-md px-3 py-1 text-sm text-[#A4A7AE] transition hover:bg-[#181D27] hover:text-white"
              >
                Tutup
              </button>
            </div>

            {profileListLoading ? (
              <p className="py-6 text-center text-sm text-[#A4A7AE]">
                Memuat daftar akun...
              </p>
            ) : profileListError ? (
              <p role="alert" className="py-6 text-center text-sm text-red-400">
                {profileListError}
              </p>
            ) : profileListUsers.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#A4A7AE]">
                Belum ada akun dalam daftar ini.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {profileListUsers.map((item) => (
                  <Link
                    key={item.id}
                    href={`/users/${encodeURIComponent(item.username)}`}
                    onClick={() => setProfileListType(null)}
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[#181D27]"
                  >
                    {item.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.avatarUrl}
                        alt=""
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#27212F] text-lg font-bold">
                        {(item.name || item.username).charAt(0).toUpperCase()}
                      </span>
                    )}

                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-bold text-white">
                        {item.name}
                      </span>
                      <span className="truncate text-sm text-[#A4A7AE]">
                        @{item.username}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {notice && (
          <p
            role="status"
            className="mt-4 rounded-lg border border-[#181D27] p-3 text-sm text-gray-300"
          >
            {notice}
          </p>
        )}

        <section>
          <div
            id="profile-posts"
            className="flex justify-center gap-70 border-[#181D27]"
          >
            <div className="flex items-center gap-2">
              <img src="/posts.png" alt="posts" className="h-5 w-5" />
              <button
                type="button"
                onClick={() => setActiveTab("posts")}
                className={`relative flex-1 py-4 text-sm font-semibold transition ${
                  activeTab === "posts"
                    ? "text-white"
                    : "text-[#94979C] hover:text-white"
                }`}
              >
                Gallery
                {activeTab === "posts" && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-[#7F51F9]" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <img src="/heart.png" alt="heart" className="h-5 w-5" />
              <button
                type="button"
                onClick={() => setActiveTab("likes")}
                className={`relative flex-1 py-4 text-sm font-semibold transition ${
                  activeTab === "likes"
                    ? "text-white"
                    : "text-[#94979C] hover:text-white"
                }`}
              >
                Likes
                {activeTab === "likes" && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-[#7F51F9]" />
                )}
              </button>
            </div>
          </div>

          {activeTab === "posts" ? (
            postsLoading ? (
              <p className="py-10 text-center text-sm text-gray-400">
                Memuat postingan...
              </p>
            ) : posts.length > 0 ? (
              <div className="mt-1 grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => {
                      console.log("Post pengguna lain diklik:", post.id);
                      window.location.assign(`/posts/${post.id}`);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        window.location.assign(`/posts/${post.id}`);
                      }
                    }}
                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-md bg-[#0A0D12]"
                  >
                    {post.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.imageUrl}
                        alt={post.caption || "Postingan pengguna"}
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-3 text-center text-sm text-gray-400">
                        {post.caption || "Postingan"}
                      </div>
                    )}

                    {post.imageUrl && post.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                        <p className="line-clamp-2 text-xs">{post.caption}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-[#A4A7AE]">
                Belum ada postingan.
              </p>
            )
          ) : likesLoading ? (
            <p className="py-10 text-center text-sm text-gray-400">
              Memuat Likes...
            </p>
          ) : likedPosts.length > 0 ? (
            <div className="mt-1 grid grid-cols-3 gap-1">
              {likedPosts.map((post) => (
                <article
                  key={post.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => window.location.assign(`/posts/${post.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      window.location.assign(`/posts/${post.id}`);
                    }
                  }}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-md bg-[#0A0D12]"
                >
                  {post.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.imageUrl}
                      alt={post.caption || "Postingan yang disukai"}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-3 text-center text-sm text-gray-400">
                      {post.caption || "Postingan"}
                    </div>
                  )}

                  {post.imageUrl && post.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                      <p className="line-clamp-2 text-xs">{post.caption}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-[#A4A7AE]">
              Belum ada postingan yang disukai.
            </p>
          )}
        </section>
      </div>

      <nav className="fixed bottom-4 left-1/2 z-30 flex h-16 w-[min(360px,calc(100%-32px))] -translate-x-1/2 items-center justify-around rounded-full border border-[#181D27] bg-[#0A0D12] px-5 shadow-lg">
        <Link href="/" className="text-sm font-semibold">
          Home
        </Link>
        <Link
          href="/"
          aria-label="Buat postingan"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6936F2] text-3xl"
        >
          +
        </Link>
        <Link href="/profile" className="text-sm">
          Profile
        </Link>
      </nav>
    </main>
  );
}
export default function UserProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black p-8 text-white">
          Memuat profil...
        </main>
      }
    >
      <UserProfileContent />
    </Suspense>
  );
}
