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

    const baseUrl = apiUrl.replace(/\/+$/, "");

    const response = await fetch(
      `${baseUrl}/api/users/${encodeURIComponent(username)}`,
      {
        headers: { Accept: "application/json" },
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
        message: "Gagal mengambil profil pengguna.",
        data: null,
      },
      { status: 502 },
    );
  }
}
