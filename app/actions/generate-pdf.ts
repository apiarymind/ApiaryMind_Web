'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';

// Dynamic import for jsPDF (server-side)
let jsPDF: any;
let autoTable: any;

async function loadPDFLibs() {
  if (!jsPDF) {
    const jsPDFModule = await import('jspdf');
    jsPDF = jsPDFModule.default;
    const autoTableModule = await import('jspdf-autotable');
    autoTable = autoTableModule.default;
  }
}

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
    await loadPDFLibs();

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

    // Generate Manifest PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('MANIFEST PRODUKCJI', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('ApiaryMind - Panel Hodowcy', 105, 30, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.text(`Data wygenerowania: ${new Date(manifest.generated_at).toLocaleDateString('pl-PL')}`, 20, 45);
    
    // Manifest Info
    doc.setFontSize(14);
    doc.text('Dane Manifestu:', 20, 60);
    
    doc.setFontSize(10);
    let yPos = 70;
    doc.text(`Numer manifestu: ${manifest.id.substring(0, 8).toUpperCase()}`, 20, yPos);
    yPos += 10;
    doc.text(`Ilość: ${manifest.quantity}`, 20, yPos);
    yPos += 10;
    if (seriesData) {
      doc.text(`Seria: ${seriesData.name || seriesData.id.substring(0, 8)}`, 20, yPos);
      yPos += 10;
    }
    if (manifest.destination_type) {
      doc.text(`Typ przeznaczenia: ${manifest.destination_type}`, 20, yPos);
      yPos += 10;
    }
    
    // Genetics Info
    if (breedingMother) {
      yPos += 5;
      doc.setFontSize(12);
      doc.text('Dane Genetyczne:', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      if (breedingMother.name) {
        doc.text(`Matka reprodukcyjna: ${breedingMother.name}`, 20, yPos);
        yPos += 10;
      }
      if (breedingMother.year) {
        doc.text(`Rok: ${breedingMother.year}`, 20, yPos);
        yPos += 10;
      }
      if (breedingMother.line) {
        doc.text(`Linia: ${breedingMother.line}`, 20, yPos);
        yPos += 10;
      }
      if (breedingMother.breed) {
        doc.text(`Rasa: ${breedingMother.breed}`, 20, yPos);
        yPos += 10;
      }
      if (breedingMother.insemination_method) {
        doc.text(`Metoda unasienniania: ${breedingMother.insemination_method}`, 20, yPos);
        yPos += 10;
      }
    }
    
    // QR Code placeholder (text representation)
    if (manifest.qr_code_payload) {
      yPos += 10;
      doc.setFontSize(10);
      doc.text('QR Code:', 20, yPos);
      yPos += 5;
      doc.setFontSize(8);
      doc.text(manifest.qr_code_payload, 20, yPos, { maxWidth: 100 });
    }
    
    // Notes
    if (manifest.notes) {
      yPos += 15;
      doc.setFontSize(10);
      doc.text('Uwagi:', 20, yPos);
      yPos += 5;
      doc.setFontSize(9);
      const notesLines = doc.splitTextToSize(manifest.notes, 170);
      doc.text(notesLines, 20, yPos);
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text('© ApiaryMind - Dokument wygenerowany automatycznie', 105, pageHeight - 10, { align: 'center' });
    
    // Convert to base64
    const manifestPdfBase64 = doc.output('datauristring');
    
    // Generate Passports PDF
    const passportsDoc = new jsPDF();
    passportsDoc.setFontSize(16);
    passportsDoc.text('PASZPORTY MATEK PSZCZELICH', 105, 20, { align: 'center' });
    
    // Generate individual passports
    const passportHeight = 50;
    for (let i = 0; i < manifest.quantity; i++) {
      if (i > 0 && i % 5 === 0) {
        passportsDoc.addPage();
      }
      
      const yStart = 30 + (i % 5) * passportHeight;
      
      // Border
      passportsDoc.rect(10, yStart, 190, passportHeight - 5);
      
      // Passport number
      passportsDoc.setFontSize(10);
      passportsDoc.text(`Paszport #${i + 1}`, 15, yStart + 8);
      
      // Series info
      if (seriesData) {
        passportsDoc.text(`Seria: ${seriesData.name || seriesData.id.substring(0, 8)}`, 15, yStart + 15);
      }
      
      // Genetics
      if (breedingMother) {
        if (breedingMother.name) {
          passportsDoc.text(`Matka reprodukcyjna: ${breedingMother.name}`, 15, yStart + 22);
        }
        if (breedingMother.line) {
          passportsDoc.text(`Linia: ${breedingMother.line}`, 15, yStart + 29);
        }
        if (breedingMother.breed) {
          passportsDoc.text(`Rasa: ${breedingMother.breed}`, 15, yStart + 36);
        }
      }
      
      // Date of birth (start_date)
      if (seriesData?.start_date) {
        passportsDoc.text(`Data urodzenia: ${new Date(seriesData.start_date).toLocaleDateString('pl-PL')}`, 15, yStart + 36);
      }
      
      // QR Code placeholder
      if (manifest.qr_code_payload) {
        passportsDoc.setFontSize(6);
        passportsDoc.text(`QR: ${manifest.qr_code_payload.substring(0, 20)}...`, 120, yStart + 15);
      }
    }
    
    const passportsPdfBase64 = passportsDoc.output('datauristring');
    
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
    console.error('Error generating PDF:', err);
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

