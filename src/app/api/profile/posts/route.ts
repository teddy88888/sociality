import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sociality_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    const apiUrl = process.env.SOCIALITY_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Konfigurasi API belum tersedia.",
        },
        { status: 500 },
      );
    }

    const baseUrl = apiUrl.replace(/\/+$/, "");

    const response = await fetch(`${baseUrl}/api/me/posts?page=1&limit=20`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil postingan profil.",
      },
      { status: 502 },
    );
  }
}
