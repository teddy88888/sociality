import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { username } = await params;
    const apiUrl = process.env.SOCIALITY_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { success: false, message: "Konfigurasi API belum tersedia." },
        { status: 500 },
      );
    }

    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/users/${encodeURIComponent(username)}/likes`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar Likes." },
      { status: 502 },
    );
  }
}
