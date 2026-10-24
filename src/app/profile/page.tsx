"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getMyProfile } from "@/lib/api/profile";
import type { UserProfile, ProfileStats } from "@/types/profile";
import Header from "@/components/Header";

type ProfilePost = {
  id: number;
  imageUrl: string;
  caption: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

type PostsResponse = {
  success: boolean;
  message: string;
  data: {
    items: ProfilePost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [savedPosts, setSavedPosts] = useState<ProfilePost[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState("");
  const [totalPosts, setTotalPosts] = useState(0);
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "likes">(
    "posts",
  );
  const [loading, setLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [profileListType, setProfileListType] = useState<
    "followers" | "following" | null
  >(null);

  const [profileListUsers, setProfileListUsers] = useState<
    {
      id: number;
      username: string;
      name: string;
      avatarUrl: string | null;
      isFollowedByMe?: boolean;
    }[]
  >([]);

  const [profileListLoading, setProfileListLoading] = useState(false);
  const [profileListError, setProfileListError] = useState("");

  const [likedPosts, setLikedPosts] = useState<ProfilePost[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesError, setLikesError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const result = await getMyProfile();
        setProfile(result.data.profile);
        setStats(result.data.stats);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal memuat profil.");
      } finally {
        setLoading(false);
      }
    }

    
async function loadPosts(username: string) {
  try {
    setPostsError("");

    const response = await fetch(
      `/api/users/${encodeURIComponent(username)}/posts`,
      { cache: "no-store" },
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Gagal memuat postingan.");
    }

    const data = result.data;
    const items = Array.isArray(data?.posts) ? data.posts : [];

    setPosts(items);
    setTotalPosts(data?.pagination?.total ?? items.length);
  } catch (err: unknown) {
    setPosts([]);
    setTotalPosts(0);
    setPostsError(
      err instanceof Error ? err.message : "Gagal memuat postingan.",
    );
  }
}


   loadProfile();

   async function loadMyProfileAndPosts() {
     try {
       const result = await getMyProfile();
       const username = result.data.profile.username;

       setProfile(result.data.profile);
       setStats(result.data.stats);

       await loadPosts(username);
     } catch (err: unknown) {
       setError(err instanceof Error ? err.message : "Gagal memuat profil.");
     } finally {
       setLoading(false);
     }
   }

   loadMyProfileAndPosts();
  }, []);

  async function loadProfileList(type: "followers" | "following") {
    setProfileListType(type);
    setProfileListLoading(true);
    setProfileListError("");
    setProfileListUsers([]);

    try {
      const response = await fetch(`/api/me/${type}?page=1&limit=20`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal memuat daftar akun.");
      }

      const users = result.data?.users;

      if (!Array.isArray(users)) {
        throw new Error("Format daftar akun dari API tidak sesuai.");
      }

      setProfileListUsers(users);
    } catch (err: unknown) {
      setProfileListError(
        err instanceof Error ? err.message : "Gagal memuat daftar akun.",
      );
    } finally {
      setProfileListLoading(false);
    }
  }

  async function loadLikedPosts() {
    setLikesLoading(true);
    setLikesError("");

    try {
      const response = await fetch("/api/me/likes?page=1&limit=20", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal memuat Likes.");
      }

      const items = result.data?.posts;

      if (!Array.isArray(items)) {
        throw new Error("Format respons Likes dari API tidak sesuai.");
      }

      const normalizedPosts: ProfilePost[] = items.map(
        (post: Record<string, unknown>) => ({
          id: Number(post.id),
          imageUrl: String(post.imageUrl ?? ""),
          caption: String(post.caption ?? ""),
          createdAt: String(post.createdAt ?? ""),
          likeCount: Number(post.likeCount ?? 0),
          commentCount: Number(post.commentCount ?? 0),
          likedByMe: Boolean(post.likedByMe),
        }),
      );

      setLikedPosts(normalizedPosts);
    } catch (err: unknown) {
      setLikedPosts([]);
      setLikesError(err instanceof Error ? err.message : "Gagal memuat Likes.");
    } finally {
      setLikesLoading(false);
    }
  }
  useEffect(() => {
    if (activeTab !== "saved") return;

    async function loadSavedPosts() {
      try {
        setSavedLoading(true);
        setSavedError("");

        const response = await fetch("/api/me/saved?page=1&limit=20", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Gagal memuat Saved Posts.");
        }

        const data = result.data;

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.posts)
              ? data.posts
              : Array.isArray(data?.savedPosts)
                ? data.savedPosts
                : null;

        if (!items) {
          throw new Error("Format respons Saved Posts belum dikenali.");
        }

        // API mungkin mengembalikan postingan langsung,
        // atau membungkusnya dalam properti "post".
        const normalizedPosts = items
          .map((item: Record<string, unknown>) => {
            const post = (
              item.post && typeof item.post === "object" ? item.post : item
            ) as Record<string, unknown>;

            return {
              id: Number(post.id),
              imageUrl: String(post.imageUrl ?? post.image_url ?? ""),
              caption: String(post.caption ?? ""),
              createdAt: String(post.createdAt ?? post.created_at ?? ""),
              likeCount: Number(post.likeCount ?? post.like_count ?? 0),
              commentCount: Number(
                post.commentCount ?? post.comment_count ?? 0,
              ),
              likedByMe: Boolean(post.likedByMe ?? post.liked_by_me),
            };
          })
          .filter(
            (post: ProfilePost) => Number.isFinite(post.id) && post.id > 0,
          );

        setSavedPosts(normalizedPosts);
      } catch (err: unknown) {
        setSavedPosts([]);
        setSavedError(
          err instanceof Error ? err.message : "Gagal memuat Saved Posts.",
        );
      } finally {
        setSavedLoading(false);
      }
    }

    loadSavedPosts();
  }, [activeTab]);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        Memuat profil...
      </main>
    );
  }

  if (error || !profile || !stats) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <p>{error || "Profil tidak tersedia."}</p>
        <Link href="/login" className="mt-4 inline-block underline">
          Kembali ke Login
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-32 text-white">
      <Header />
      <section className="mx-auto w-full max-w-[812px] px-5 pt-10 sm:px-0 sm:pt-12">
        {/* Informasi profil */}
        <div className="flex items-start gap-4 sm:gap-5">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={`Foto profil ${profile.name}`}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-full bg-[#181D27]" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-122">
              <h1 className="break-words text-xl font-bold">{profile.name}</h1>
              <div className="flex gap-2">
                <Link
                  href="/profile/edit"
                  className="rounded-full border border-[#181D27] px-4 py-2 text-sm font-semibold transition hover:bg-[#181D27]"
                >
                  Edit Profile
                </Link>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Salin tautan profil"
                  title="Salin tautan profil"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#181D27] transition hover:bg-[#181D27]"
                >
                  {/* <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="m8.7 10.6 6.6-4.2M8.7 13.4l6.6 4.2" />
                  </svg> */}
                  <Image src="/share.png" alt="share" width={20} height={20} />
                </button>
              </div>
            </div>

            <p className="mt-1 text-sm text-[#94979C]">@{profile.username}</p>
            {profile.email && (
              <p className="mt-1 break-all text-sm text-[#94979C]">
                {profile.email}
              </p>
            )}
          </div>
        </div>

        {copied && (
          <p className="mt-3 text-sm text-[#A78BFA]">
            Tautan profil berhasil disalin.
          </p>
        )}

        {profile.bio && (
          <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-[#E9EAEB]">
            {profile.bio}
          </p>
        )}

       
        {/* Statistik */}
        <div className="my-7 grid grid-cols-4 border-y border-[#181D27] py-5">
          {[
            { label: "Posts", value: stats?.posts ?? 0 },
            { label: "Followers", value: stats?.followers ?? 0 },
            { label: "Following", value: stats?.following ?? 0 },
            { label: "Likes", value: stats?.likes ?? 0 },
          ].map((item, index) => (
            <div
              key={item.label}
              className={`text-center ${
                index > 0 ? "border-l border-[#181D27]" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (item.label === "Posts") {
                    setProfileListType(null);
                    setActiveTab("posts");
                    document
                      .getElementById("profile-content")
                      ?.scrollIntoView({ behavior: "smooth" });
                  } else if (item.label === "Followers") {
                    void loadProfileList("followers");
                  } else if (item.label === "Following") {
                    void loadProfileList("following");
                  } else {
                    setProfileListType(null);
                    setActiveTab("likes");
                    void loadLikedPosts();
                    document
                      .getElementById("profile-content")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="cursor-pointer rounded px-2 py-1 transition hover:bg-white/5"
              >
                <p className="text-lg font-bold">{item.value}</p>
                <p className="mt-1 text-xs text-[#94979C] sm:text-sm">
                  {item.label}
                </p>
              </button>
            </div>
          ))}
        </div>

        {/* Tab Posts dan Saved */}
        <div
          id="profile-content"
          className="flex justify-center gap-70 border-[#181D27]"
          >
          <div className="flex items-center gap-2">
            <Image
              src="/posts.png"
              alt="posts"
              width={20}
              height={20}
              className="h-5 w-5"
            />
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
              onClick={() => setActiveTab("saved")}
              className={`relative flex-1 py-4 text-sm font-semibold transition ${
                activeTab === "saved"
                  ? "text-white"
                  : "text-[#94979C] hover:text-white"
              }`}
            >
              Saved
              {activeTab === "saved" && (
                <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-[#7F51F9]" />
              )}
            </button>
          </div>
        </div>

        
{/* Daftar Followers dan Following */}
{profileListType !== null ? (
  <div id="profile-content" className="py-4">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-semibold text-white">
        {profileListType === "followers" ? "Followers" : "Following"}
      </h2>

      <button
        type="button"
        onClick={() => setProfileListType(null)}
        className="text-sm text-[#94979C] hover:text-white"
      >
        Tutup
      </button>
    </div>

    {profileListLoading ? (
      <p className="py-10 text-center text-sm text-[#94979C]">
        Memuat daftar akun...
      </p>
    ) : profileListError ? (
      <p className="py-10 text-center text-sm text-red-400">
        {profileListError}
      </p>
    ) : profileListUsers.length === 0 ? (
      <p className="py-10 text-center text-sm text-[#94979C]">
        Belum ada akun.
      </p>
    ) : (
      <div className="divide-y divide-[#181D27]">
        {profileListUsers.map((user) => (
          <Link
            key={user.id}
            href={`/users/${encodeURIComponent(user.username)}`}
            className="flex items-center gap-3 py-3 hover:bg-white/5"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#252832] text-white">
                {user.name?.charAt(0) || user.username.charAt(0)}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user.name || user.username}
              </p>
              <p className="truncate text-sm text-[#94979C]">
                @{user.username}
              </p>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
) : activeTab === "likes" ? (
  <div id="profile-content" className="py-4">
    <h2 className="mb-4 font-semibold text-white">Likes</h2>

    {likesLoading ? (
      <p className="py-10 text-center text-sm text-[#94979C]">
        Memuat Likes...
      </p>
    ) : likesError ? (
      <p className="py-10 text-center text-sm text-red-400">
        {likesError}
      </p>
    ) : likedPosts.length === 0 ? (
      <p className="py-10 text-center text-sm text-[#94979C]">
        Belum ada postingan yang disukai.
      </p>
    ) : (
      <div className="grid grid-cols-3 gap-1">
        {likedPosts.map((post) => (
          <button
            key={post.id}
            type="button"
            title={post.caption || "Lihat postingan"}
            onClick={() => window.location.assign(`/posts/${post.id}`)}
            className="group relative aspect-square w-full overflow-hidden rounded-md bg-[#0A0D12] text-left"
          >
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.caption || "Postingan yang disukai"}
                loading="lazy"
                className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-2 text-xs text-[#94979C]">
                {post.caption || "Postingan"}
              </div>
            )}

            <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 bg-black/60 text-sm font-semibold opacity-0 transition group-hover:opacity-100">
              <span>♥ {post.likeCount}</span>
              <span>▢ {post.commentCount}</span>
            </span>
          </button>
        ))}
      </div>
    )}
  </div>
) : (
  <>


        {/* Galeri */}
        {activeTab === "posts" ? (
          postsError ? (
            <p className="py-12 text-center text-sm text-red-400">
              {postsError}
            </p>
          ) : posts.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#94979C]">
              Belum ada postingan.
            </p>
          ) : (
            <>
              <div className="mt-1 grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    title={post.caption || "Lihat postingan"}
                    onClick={() => {
                      console.log("Post pengguna lain diklik:", post.id);
                      window.location.assign(`/posts/${post.id}`);
                    }}
                    className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-md bg-[#0A0D12] text-left"
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.caption || "Foto postingan"}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    />

                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-4 bg-black/60 text-sm font-semibold opacity-0 transition group-hover:opacity-100">
                      <span>♥ {post.likeCount}</span>
                      <span>▢ {post.commentCount}</span>
                    </span>
                  </button>
                ))}
              </div>

              <p className="py-5 text-center text-xs text-[#94979C]">
                Menampilkan {posts.length} dari {totalPosts} postingan
              </p>
            </>
          )
        ) : savedLoading ? (
          <p className="py-12 text-center text-sm text-[#94979C]">
            Memuat Saved Posts...
          </p>
        ) : savedError ? (
          <p className="py-12 text-center text-sm text-red-400">{savedError}</p>
        ) : savedPosts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#343741] text-2xl">
              ♡
            </div>
            <h2 className="mt-4 font-semibold">Saved posts</h2>
            <p className="mt-2 text-sm text-[#94979C]">
              Belum ada postingan yang disimpan.
            </p>
          </div>
        ) : (
          <div className="mt-1 grid grid-cols-3 gap-1">
            {savedPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                title={post.caption || "Lihat postingan"}
                onClick={() => {
                  window.location.assign(`/posts/${post.id}`);
                }}
                className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-md bg-[#0A0D12] text-left"
              >
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.caption || "Foto postingan tersimpan"}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-3 text-sm text-[#94979C]">
                    {post.caption || "Postingan tersimpan"}
                  </div>
                )}

                <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-4 bg-black/60 text-sm font-semibold opacity-0 transition group-hover:opacity-100">
                  <span>♥ {post.likeCount}</span>
                  <span>▢ {post.commentCount}</span>
                </span>
              </button>
            ))}
          </div>
        )}
          </>
)}
      </section>
      {/* Navigasi bawah */}
      <nav className="fixed bottom-5 left-1/2 z-10 flex h-16 w-[min(360px,calc(100%-32px))] -translate-x-1/2 items-center justify-around rounded-2xl border border-[#252832] bg-[#0A0D12] px-5 shadow-2xl">
        <Link
          href="/"
          aria-label="Home"
          className="flex flex-col items-center gap-1 text-[#94979C] transition hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
          </svg>
          <span className="text-[10px]">Home</span>
        </Link>

        <Link
          href="/posts/create"
          title="Buat postingan"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6936F2] text-3xl font-light transition hover:bg-[#7F51F9]"
        >
          +
        </Link>

        <Link
          href="/profile"
          aria-label="Profile"
          className="flex flex-col items-center gap-1 text-[#A78BFA]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
          <span className="text-[10px]">Profile</span>
        </Link>
      </nav>
    </main>
  );
}
