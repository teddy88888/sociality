import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const allowedTypes = ["followers", "following", "likes"];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await context.params;

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: "Endpoint tidak valid." },
        { status: 404 },
      );
    }

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

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ?? "1";
    const limit = searchParams.get("limit") ?? "20";

    const baseUrl = apiUrl.replace(/\/+$/, "");
    const endpoint = new URL(`${baseUrl}/api/me/${type}`);

    endpoint.searchParams.set("page", page);
    endpoint.searchParams.set("limit", limit);

    const response = await fetch(endpoint.toString(), {
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
        message: "Gagal mengambil data profil.",
      },
      { status: 502 },
    );
  }
}
