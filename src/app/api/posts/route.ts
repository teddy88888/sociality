
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: Request) {
  try {
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

    const incomingForm = await request.formData();
    const image = incomingForm.get("image");
    const caption = incomingForm.get("caption");

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json(
        { success: false, message: "Foto wajib dipilih." },
        { status: 400 },
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format foto harus JPG, PNG, atau WEBP.",
        },
        { status: 400 },
      );
    }

    if (image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Ukuran foto maksimal 5 MB.",
        },
        { status: 400 },
      );
    }

    if (caption !== null && typeof caption !== "string") {
      return NextResponse.json(
        { success: false, message: "Caption tidak valid." },
        { status: 400 },
      );
    }

    const outgoingForm = new FormData();
    outgoingForm.append("image", image, image.name);
    outgoingForm.append(
      "caption",
      typeof caption === "string" ? caption.trim() : "",
    );

    const baseUrl = apiUrl.replace(/\/+$/, "");

    const response = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: outgoingForm,
      cache: "no-store",
    });

    const responseText = await response.text();

    let result: unknown;
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = {
        success: false,
        message: "Server API mengembalikan respons yang tidak valid.",
      };
    }

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghubungi API untuk membuat postingan.",
      },
      { status: 502 },
    );
  }
}
