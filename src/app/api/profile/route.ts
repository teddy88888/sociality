import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.SOCIALITY_API_URL ??
  "https://be-social-media-api-production.up.railway.app";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("sociality_token")?.value;
}

export async function GET() {
  try {
    const token = await getToken();

    if (!token) {
      return Response.json(
        { success: false, message: "Unauthorized", data: null },
        { status: 401 },
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json(
      { success: false, message: "Failed to fetch profile", data: null },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const token = await getToken();

    if (!token) {
      return Response.json(
        { success: false, message: "Unauthorized", data: null },
        { status: 401 },
      );
    }

    const formData = await request.formData();

    const response = await fetch(`${API_BASE_URL}/api/me`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json(
      { success: false, message: "Failed to update profile", data: null },
      { status: 500 },
    );
  }
}
