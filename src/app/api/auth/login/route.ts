import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi." },
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

    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result.success || !result.data?.token) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Login gagal.",
        },
        { status: response.status || 502 },
      );
    }

    const cookieStore = await cookies();

    cookieStore.set("sociality_token", result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      data: { user: result.data.user },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Tidak dapat menghubungi server API." },
      { status: 502 },
    );
  }
}
