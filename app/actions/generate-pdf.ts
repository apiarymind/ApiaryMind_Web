'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { createPdfBuffer, getServerPdfFontName } from '@/utils/pdfmake-server';
// @ts-ignore - pdfmake types may not be available in all environments
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

/**
 * Generate Manifest PDF with QR code
 */
export async function generateManifestPDF(manifestId: string): Promise<{ 
  success: boolean; 
  manifestUrl?: string; 
  passportsUrl?: string; 
  error?: string 
}> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Get manifest with series and breeding mother data
    const { data: manifest, error: manifestError } = await supabase
      .from('breeding_manifests')
      .select(`
        *,
        series:breeding_series!series_id (
          id,
          name,
          start_date,
          mother_id,
          breeding_mother:breeding_mothers!mother_id (
            id,
            name,
            breed,
            line,
            year,
            insemination_method
          )
        )
      `)
      .eq('id', manifestId)
      .eq('user_id', uid)
      .single();

    if (manifestError || !manifest) {
      return { success: false, error: 'Manifest nie znaleziony' };
    }

    const seriesData = Array.isArray(manifest.series) ? manifest.series[0] : manifest.series;
    
    // Get breeding mother from series join
    let breedingMother = null;
    if (seriesData?.breeding_mother) {
      breedingMother = Array.isArray(seriesData.breeding_mother) 
        ? seriesData.breeding_mother[0] 
        : seriesData.breeding_mother;
    }

    const shortCode = manifest.id.substring(0, 6).toUpperCase();
    const manifestInfoRows = [
      ['Numer manifestu', manifest.id.substring(0, 8).toUpperCase()],
      ['Kod paszportu', shortCode],
      ['Ilość', String(manifest.quantity)],
    ];

    if (seriesData) {
      manifestInfoRows.push(['Seria', seriesData.name || seriesData.id.substring(0, 8)]);
    }

    if (manifest.destination_type) {
      manifestInfoRows.push(['Typ przeznaczenia', manifest.destination_type]);
    }

    const geneticsRows: [string, string][] = [];
    if (breedingMother?.name) geneticsRows.push(['Matka reprodukcyjna', breedingMother.name]);
    if (breedingMother?.year) geneticsRows.push(['Rok', String(breedingMother.year)]);
    if (breedingMother?.line) geneticsRows.push(['Linia', breedingMother.line]);
    if (breedingMother?.breed) geneticsRows.push(['Rasa', breedingMother.breed]);
    if (breedingMother?.insemination_method) geneticsRows.push(['Metoda unasienniania', breedingMother.insemination_method]);

    const fontName = await getServerPdfFontName();

    const manifestDocDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      defaultStyle: {
        font: fontName,
        fontSize: 10,
      },
      content: [
        { text: 'MANIFEST PRODUKCJI', style: 'title' },
        { text: 'ApiaryMind - Panel Hodowcy', style: 'subtitle' },
        { text: `Data wygenerowania: ${new Date(manifest.generated_at).toLocaleDateString('pl-PL')}`, style: 'meta' },
        { text: 'Dane Manifestu', style: 'sectionHeader' },
        {
          table: {
            widths: ['auto', '*'],
            body: manifestInfoRows,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 4, 0, 8],
        },
        ...(geneticsRows.length > 0
          ? [
              { text: 'Dane Genetyczne', style: 'sectionHeader' },
              {
                table: {
                  widths: ['auto', '*'],
                  body: geneticsRows,
                },
                layout: 'lightHorizontalLines',
                margin: [0, 4, 0, 8],
              },
            ]
          : []),
        ...(manifest.qr_code_payload
          ? [
              { text: 'QR Code', style: 'sectionHeader' },
              { text: manifest.qr_code_payload, style: 'smallText', margin: [0, 2, 0, 8] },
            ]
          : []),
        ...(manifest.notes
          ? [
              { text: 'Uwagi', style: 'sectionHeader' },
              { text: manifest.notes, style: 'notes' },
            ]
          : []),
      ],
      styles: {
        title: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 4],
        },
        subtitle: {
          fontSize: 11,
          alignment: 'center',
          margin: [0, 0, 0, 6],
        },
        meta: {
          fontSize: 9,
          alignment: 'left',
          color: '#444444',
          margin: [0, 0, 0, 8],
        },
        sectionHeader: {
          fontSize: 12,
          bold: true,
          margin: [0, 6, 0, 2],
        },
        notes: {
          fontSize: 9,
        },
        smallText: {
          fontSize: 8,
        },
      },
      footer: {
        text: '© ApiaryMind - Dokument wygenerowany automatycznie',
        alignment: 'center',
        fontSize: 8,
        margin: [0, 0, 0, 12],
        color: '#666666',
      },
    };

    const manifestBuffer = await createPdfBuffer(manifestDocDefinition);
    const manifestPdfBase64 = `data:application/pdf;base64,${manifestBuffer.toString('base64')}`;

    const passportCards: any[] = [];
    for (let i = 0; i < manifest.quantity; i++) {
      const cardBody = [
        { text: `Paszport #${i + 1}`, bold: true, fontSize: 10 },
        { text: `Kod paszportu: ${shortCode}`, fontSize: 9 },
        seriesData ? { text: `Seria: ${seriesData.name || seriesData.id.substring(0, 8)}`, fontSize: 9 } : null,
        breedingMother?.name ? { text: `Matka reprodukcyjna: ${breedingMother.name}`, fontSize: 9 } : null,
        breedingMother?.line ? { text: `Linia: ${breedingMother.line}`, fontSize: 9 } : null,
        breedingMother?.breed ? { text: `Rasa: ${breedingMother.breed}`, fontSize: 9 } : null,
        seriesData?.start_date
          ? { text: `Data urodzenia: ${new Date(seriesData.start_date).toLocaleDateString('pl-PL')}`, fontSize: 9 }
          : null,
        manifest.qr_code_payload
          ? { text: `QR: ${manifest.qr_code_payload.substring(0, 24)}...`, fontSize: 7, color: '#444444' }
          : null,
      ].filter(Boolean);

      passportCards.push({
        table: {
          widths: ['*'],
          body: [[{ stack: cardBody, margin: [6, 4, 6, 4] }]],
        },
        layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          hLineColor: () => '#444444',
          vLineColor: () => '#444444',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
        margin: [0, 0, 0, 8],
      });
    }

    const passportsPerPage = 5;
    const passportGroups: any[] = [];
    for (let i = 0; i < passportCards.length; i += passportsPerPage) {
      passportGroups.push(passportCards.slice(i, i + passportsPerPage));
    }

    const passportsDocDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      defaultStyle: {
        font: fontName,
        fontSize: 9,
      },
      content: [
        { text: 'PASZPORTY MATEK PSZCZELICH', style: 'title' },
        ...passportGroups.map((group, index) => ({
          stack: group,
          margin: [0, 8, 0, 0],
          pageBreak: index < passportGroups.length - 1 ? 'after' : undefined,
        })),
      ],
      styles: {
        title: {
          fontSize: 16,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 12],
        },
      },
      footer: {
        text: '© ApiaryMind - Dokument wygenerowany automatycznie',
        alignment: 'center',
        fontSize: 8,
        margin: [0, 0, 0, 12],
        color: '#666666',
      },
    };

    const passportsBuffer = await createPdfBuffer(passportsDocDefinition);
    const passportsPdfBase64 = `data:application/pdf;base64,${passportsBuffer.toString('base64')}`;
    
    // TODO: Upload to Supabase Storage and get URLs
    // For now, return base64 data URIs
    // In production, upload to storage and return URLs
    
    // Update manifest with PDF URLs (for now using data URIs)
    // In production, these would be actual storage URLs
    await supabase
      .from('breeding_manifests')
      .update({
        manifest_pdf_url: manifestPdfBase64.substring(0, 100) + '...', // Truncate for storage
        passports_pdf_url: passportsPdfBase64.substring(0, 100) + '...',
      })
      .eq('id', manifestId);
    
    return {
      success: true,
      manifestUrl: manifestPdfBase64,
      passportsUrl: passportsPdfBase64,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Wystąpił błąd podczas generowania PDF' };
  }
}

/**
 * Download PDF as blob (for client-side download)
 */
export async function downloadManifestPDF(manifestId: string): Promise<{ 
  success: boolean; 
  pdfBlob?: string; 
  error?: string 
}> {
  const result = await generateManifestPDF(manifestId);
  if (result.success && result.manifestUrl) {
    return {
      success: true,
      pdfBlob: result.manifestUrl,
    };
  }
  return { success: false, error: result.error };
}

