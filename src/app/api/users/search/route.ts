import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({
      success: true,
      data: { users: [], pagination: null },
    });
  }

  const apiUrl = process.env.SOCIALITY_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { success: false, message: "API URL belum dikonfigurasi" },
      { status: 500 },
    );
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sociality_token")?.value;

    const params = new URLSearchParams({
      q: query,
      page: "1",
      limit: "5",
    });

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}/api/users/search?${params.toString()}`,
      {
        method: "GET",
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
      { success: false, message: "Gagal mencari pengguna" },
      { status: 502 },
    );
  }
}
