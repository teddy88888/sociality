import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getPostId(params: RouteContext["params"]) {
  const { id } = await params;
  return /^\d+$/.test(id) ? id : null;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const id = await getPostId(params);
    const apiUrl = process.env.SOCIALITY_API_URL;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID postingan tidak valid." },
        { status: 400 },
      );
    }

    if (!apiUrl) {
      return NextResponse.json(
        { success: false, message: "Konfigurasi API belum tersedia." },
        { status: 500 },
      );
    }

    const query = request.nextUrl.searchParams;
    const page = query.get("page") ?? "1";
    const limit = query.get("limit") ?? "10";

    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/posts/${id}/comments?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`,
      { cache: "no-store" },
    );

    const result = await response.json();

    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil komentar." },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const id = await getPostId(params);
    const apiUrl = process.env.SOCIALITY_API_URL;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID postingan tidak valid." },
        { status: 400 },
      );
    }

    if (!apiUrl) {
      return NextResponse.json(
        { success: false, message: "Konfigurasi API belum tersedia." },
        { status: 500 },
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("text" in body) ||
      typeof body.text !== "string" ||
      !body.text.trim()
    ) {
      return NextResponse.json(
        { success: false, message: "Komentar tidak boleh kosong." },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("sociality_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Silakan login kembali untuk memberi komentar.",
        },
        { status: 401 },
      );
    }

    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/posts/${id}/comments`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: body.text.trim() }),
        cache: "no-store",
      },
    );

    const result = await response.json();

    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengirim komentar." },
      { status: 502 },
    );
  }
}
