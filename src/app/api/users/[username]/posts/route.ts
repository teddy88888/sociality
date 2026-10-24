import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { username } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("sociality_token")?.value;
    const apiUrl = process.env.SOCIALITY_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { success: false, message: "Konfigurasi API belum tersedia." },
        { status: 500 },
      );
    }

    const baseUrl = apiUrl.replace(/\/+$/, "");
    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${baseUrl}/api/users/${encodeURIComponent(username)}/posts?page=1&limit=30`,
      {
        headers,
        cache: "no-store",
      },
    );

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil postingan pengguna." },
      { status: 502 },
    );
  }
}
