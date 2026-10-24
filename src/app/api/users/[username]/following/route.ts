import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { username } = await params;
    const apiUrl = process.env.SOCIALITY_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { success: false, message: "Konfigurasi API belum tersedia." },
        { status: 500 },
      );
    }

    const incomingUrl = new URL(request.url);
    const page = incomingUrl.searchParams.get("page") || "1";
    const limit = incomingUrl.searchParams.get("limit") || "20";

    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/users/${encodeURIComponent(username)}/following?page=${page}&limit=${limit}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar Following." },
      { status: 502 },
    );
  }
}