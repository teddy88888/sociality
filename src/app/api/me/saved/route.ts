import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sociality_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Silakan login untuk melihat Saved Posts.",
          data: null,
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
          data: null,
        },
        { status: 500 },
      );
    }

    const requestUrl = new URL(request.url);
    const page = requestUrl.searchParams.get("page") || "1";
    const limit = requestUrl.searchParams.get("limit") || "20";

    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/me/saved?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil Saved Posts.",
        data: null,
      },
      { status: 502 },
    );
  }
}
