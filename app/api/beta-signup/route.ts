import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 🔸 TU PODŁĄCZYSZ STRAPI LUB FIRESTORE
    // Przykład: wysłanie do Strapi:
    // await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/beta-signups`, {...})

    console.log("Nowe zgłoszenie beta:", body);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Błąd beta-signup:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}