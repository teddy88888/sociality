import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { success: false, message: "ID postingan tidak valid." },
        { status: 400 },
      );
    }

    const apiUrl = process.env.SOCIALITY_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { success: false, message: "Konfigurasi API belum tersedia." },
        { status: 500 },
      );
    }

    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/posts/${id}`,
      { cache: "no-store" },
    );

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil detail postingan." },
      { status: 502 },
    );
  }
}
