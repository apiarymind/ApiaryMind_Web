import { NextResponse } from 'next/server';
import { getThemeSettings } from '@/app/actions/admin/theme-settings';

/**
 * API Route do pobierania ustawień motywu
 * Publiczny endpoint - każdy może odczytać ustawienia motywu
 * 
 * Wymusza dynamiczne renderowanie, ponieważ używa cookies do autoryzacji
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getThemeSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme settings' },
      { status: 500 }
    );
  }
}


