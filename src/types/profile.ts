export interface UserProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  avatarUrl: string | null;
}

export interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
  likes: number;
}

export interface MyProfileResponse {
  success: boolean;
  message: string;
  data: {
    profile: UserProfile;
    stats: ProfileStats;
  };
}
