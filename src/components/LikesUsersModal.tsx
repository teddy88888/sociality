"use client";

import { useState } from "react";

export type LikedUser = {
  id: number;
  name: string;
  username: string;
  avatarUrl: string | null;
  followed: boolean;
};

type LikedUsersModalProps = {
  open: boolean;
  onClose: () => void;
  users: LikedUser[];
  postAuthorName?: string;
};

function CheckCircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m8 12 2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LikedUsersModal({
  open,
  onClose,
  users,
  postAuthorName = "People who liked this post",
}: LikedUsersModalProps) {
  const [followedUsers, setFollowedUsers] = useState<number[]>(() =>
    users.filter((user) => user.followed).map((user) => user.id),
  );

  if (!open) return null;

  function toggleFollow(userId: number) {
    setFollowedUsers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="liked-users-title"
        className="flex max-h-[calc(100dvh-48px)] w-full max-w-[548px] flex-col items-end gap-4"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup daftar pengguna"
          className="flex size-6 items-center justify-center text-[#FDFDFD] transition-opacity hover:opacity-70"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Users list */}
        <div className="box-border flex max-h-[530px] min-h-[300px] w-full flex-col gap-5 overflow-y-auto rounded-2xl border border-[#181D27] bg-[#0A0D12] p-5">
          <h2
            id="liked-users-title"
            className="text-xl font-bold leading-[34px] tracking-[-0.02em] text-[#FDFDFD]"
          >
            {postAuthorName}
          </h2>

          {users.length === 0 ? (
            <p className="text-sm text-[#A4A7AE]">
              Belum ada pengguna yang menyukai postingan ini.
            </p>
          ) : (
            users.map((user) => {
              const isFollowed = followedUsers.includes(user.id);

              return (
                <div
                  key={user.id}
                  className="flex min-h-14 w-full items-center justify-between gap-3"
                >
                  {/* Avatar and user details */}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#27212F] text-base font-semibold text-white">
                        {user.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className="flex min-w-0 flex-col justify-center">
                      <p className="truncate text-sm font-bold leading-7 tracking-[-0.01em] text-[#FDFDFD]">
                        {user.name}
                      </p>
                      <p className="truncate text-sm leading-7 tracking-[-0.02em] text-[#A4A7AE]">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  {/* Follow button */}
                  <button
                    type="button"
                    onClick={() => toggleFollow(user.id)}
                    className={
                      isFollowed
                        ? "flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#181D27] px-4 text-sm font-bold text-[#FDFDFD] transition-colors hover:bg-[#181D27]"
                        : "flex h-10 shrink-0 items-center justify-center rounded-full bg-[#6936F2] px-6 text-sm font-bold text-[#FDFDFD] transition-colors hover:bg-[#7F51F9]"
                    }
                  >
                    {isFollowed && <CheckCircleIcon />}
                    {isFollowed ? "Following" : "Follow"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
