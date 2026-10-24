"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
  isLoggedIn?: boolean;
  search?: string;
  onSearch?: (value: string) => void;
};

type UserProfile = {
  name: string;
  avatarUrl: string | null;
};

type SearchUser = {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  isFollowedByMe: boolean;
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

export default function Header({
  isLoggedIn = true,
  search,
  onSearch,
}: HeaderProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchValue = search ?? internalSearch;

  useEffect(() => {
    if (!isLoggedIn) return;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = await response.json();
        const user = result.data?.profile;

        if (user) {
          setProfile({
            name: user.name,
            avatarUrl: user.avatarUrl ?? null,
          });
        }
      } catch (error) {
        console.error("Gagal memuat profil:", error);
      }
    }

    loadProfile();
  }, [isLoggedIn]);

  useEffect(() => {
    const query = searchValue.trim();

    if (!isLoggedIn || query.length === 0) {
      setUsers([]);
      setIsSearching(false);
      setSearchError("");
      setIsSearchOpen(false);
      return;
    }

    let isActive = true;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");
      setIsSearchOpen(true);

      try {
        const params = new URLSearchParams({
          q: query,
          page: "1",
          limit: "5",
        });

        const response = await fetch(`/api/users/search?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Pencarian gagal.");
        }

        if (isActive) {
          setUsers(result.data?.users ?? []);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (isActive) {
          setUsers([]);
          setSearchError("Pencarian gagal. Coba lagi.");
        }
      } finally {
        if (isActive) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchValue, isLoggedIn]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function handleSearchChange(value: string) {
    if (onSearch) {
      onSearch(value);
    } else {
      setInternalSearch(value);
    }

    if (value.trim()) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
      setUsers([]);
    }
  }

  return (
    <header className="sticky top-0 z-30 h-20 border-b border-[#181D27] bg-black text-[#FDFDFD]">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8 xl:px-[120px]">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-[11px]"
          aria-label="Sociality Home"
        >
          <Image
            src="/foody.png"
            alt="Sociality logo"
            width={30}
            height={30}
            className="size-[30px] object-contain"
            priority
          />
          <span className="text-2xl font-bold leading-9 tracking-tight">
            Sociality
          </span>
        </Link>

        <div
          ref={searchContainerRef}
          className="relative mx-0 min-w-0 max-w-[491px] flex-1 md:mx-6"
        >
          <label className="flex h-12 w-full items-center gap-2 rounded-full border border-[#181D27] bg-[#0A0D12] px-4 text-[#717680]">
            <SearchIcon />

            <input
              value={searchValue}
              onChange={(event) => handleSearchChange(event.target.value)}
              onFocus={() => {
                if (searchValue.trim() && isLoggedIn) {
                  setIsSearchOpen(true);
                }
              }}
              placeholder="Search"
              aria-label="Cari pengguna"
              aria-expanded={isSearchOpen}
              aria-controls="user-search-results"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#FDFDFD] outline-none placeholder:text-[#535862]"
            />

            {searchValue && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                aria-label="Hapus pencarian"
                className="text-lg leading-none text-[#A4A7AE] hover:text-white"
              >
                ×
              </button>
            )}
          </label>

          {isLoggedIn && isSearchOpen && searchValue.trim() && (
            <div
              id="user-search-results"
              className="absolute left-1/2 top-[60px] z-50 w-[min(491px,calc(100vw-32px))] -translate-x-1/2 rounded-[20px] border border-[#181D27] bg-[#0A0D12] p-5 shadow-2xl"
              role="listbox"
              aria-label="Hasil pencarian pengguna"
            >
              {isSearching ? (
                <p className="py-4 text-center text-sm text-[#A4A7AE]">
                  Mencari pengguna...
                </p>
              ) : searchError ? (
                <p className="py-4 text-center text-sm text-[#F97066]">
                  {searchError}
                </p>
              ) : users.length === 0 ? (
                <p className="py-4 text-center text-sm text-[#A4A7AE]">
                  Pengguna tidak ditemukan.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/users/${encodeURIComponent(user.username)}`}
                      role="option"
                      aria-selected={false}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex min-h-14 items-center gap-2 rounded-lg outline-none transition-colors hover:bg-[#181D27] focus-visible:ring-2 focus-visible:ring-[#7F51F9]"
                    >
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="size-12 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#27212F] text-lg font-semibold text-white">
                          {user.name?.charAt(0).toUpperCase() ||
                            user.username.charAt(0).toUpperCase()}
                        </span>
                      )}

                      <span className="flex min-w-0 flex-1 flex-col justify-center">
                        <span className="truncate text-sm font-bold leading-7 tracking-[-0.01em] text-[#FDFDFD]">
                          {user.name}
                        </span>
                        <span className="truncate text-sm leading-7 tracking-[-0.02em] text-[#A4A7AE]">
                          @{user.username}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isLoggedIn ? (
            <Link
              href="/profile"
              className="flex items-center gap-3"
              aria-label="Buka profil"
            >
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={`Foto profil ${profile.name}`}
                  className="size-12 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-12 items-center justify-center rounded-full bg-[#27212F] text-lg font-semibold text-white">
                  {profile?.name?.charAt(0).toUpperCase() ?? "?"}
                </span>
              )}

              <span className="hidden text-base font-bold sm:block">
                {profile?.name ?? "Memuat profil..."}
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-[#181D27] px-4 py-2 text-sm font-semibold hover:bg-[#181D27]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#6936F2] px-4 py-2 text-sm font-semibold hover:bg-[#7F51F9]"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
