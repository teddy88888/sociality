import type { MyProfileResponse } from "@/types/profile";

const API_URL = "/api/profile";

export async function getMyProfile(): Promise<MyProfileResponse> {
  const response = await fetch(API_URL, {
    method: "GET",
    cache: "no-store",
  });

  const result = (await response.json()) as MyProfileResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Gagal mengambil profil");
  }

  return result;
}

export interface UpdateProfileInput {
  name: string;
  username: string;
  phone: string;
  bio: string;
  avatar?: File;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string;
    bio: string;
    avatarUrl: string;
    updatedAt: string;
  };
}

export async function updateMyProfile(
  values: UpdateProfileInput,
): Promise<UpdateProfileResponse> {
  const formData = new FormData();

  formData.append("name", values.name);
  formData.append("username", values.username);
  formData.append("phone", values.phone);
  formData.append("bio", values.bio);

  if (values.avatar) {
    formData.append("avatar", values.avatar);
  }

  const response = await fetch(API_URL, {
    method: "PATCH",
    body: formData,
  });

  const result = (await response.json()) as UpdateProfileResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Gagal memperbarui profil");
  }

  return result;
}
