import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{ username: string }>;
};

async function followRequest(
  request: Request,
  context: RouteContext,
  method: "POST" | "DELETE",
) {
  try {
    const { username } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("sociality_token")?.value;
    const apiUrl = process.env.SOCIALITY_API_URL;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    if (!apiUrl) {
      return NextResponse.json(
        { success: false, message: "Konfigurasi API belum tersedia." },
        { status: 500 },
      );
    }

    const baseUrl = apiUrl.replace(/\/+$/, "");
    const response = await fetch(
      `${baseUrl}/api/follow/${encodeURIComponent(username)}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
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
      { success: false, message: "Permintaan Follow gagal." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  return followRequest(request, context, "POST");
}

export async function DELETE(request: Request, context: RouteContext) {
  return followRequest(request, context, "DELETE");
}
