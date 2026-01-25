// @ts-ignore - pdfmake types may not be available in all environments
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

type PdfMakeInstance = typeof import('pdfmake/build/pdfmake').default;

const NOTO_BASE_PATH = '/fonts/noto-sans';

let pdfMakePromise: Promise<PdfMakeInstance> | null = null;
let fontSetupPromise: Promise<void> | null = null;
let defaultFontName: 'NotoSans' | 'Roboto' = 'Roboto';

function getVfsFromModule(module: any): Record<string, string> | undefined {
  return module?.pdfMake?.vfs || module?.default?.pdfMake?.vfs || module?.vfs;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function fetchFontAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return arrayBufferToBase64(buffer);
  } catch {
    return null;
  }
}

async function loadNotoSansVfs(): Promise<Record<string, string> | null> {
  const fontFiles = {
    'NotoSans-Regular.ttf': `${NOTO_BASE_PATH}/NotoSans-Regular.ttf`,
    'NotoSans-Bold.ttf': `${NOTO_BASE_PATH}/NotoSans-Bold.ttf`,
    'NotoSans-Italic.ttf': `${NOTO_BASE_PATH}/NotoSans-Italic.ttf`,
    'NotoSans-BoldItalic.ttf': `${NOTO_BASE_PATH}/NotoSans-BoldItalic.ttf`,
  };

  const entries = await Promise.all(
    Object.entries(fontFiles).map(async ([fileName, url]) => {
      const base64 = await fetchFontAsBase64(url);
      return base64 ? [fileName, base64] : null;
    })
  );

  if (entries.some(entry => entry === null)) {
    return null;
  }

  return Object.fromEntries(entries as [string, string][]);
}

async function ensureFonts(pdfMake: PdfMakeInstance) {
  if (fontSetupPromise) {
    await fontSetupPromise;
    return;
  }

  fontSetupPromise = (async () => {
    const vfsModule = await import('pdfmake/build/vfs_fonts');
    const vfs = getVfsFromModule(vfsModule);
    if (vfs && !pdfMake.vfs) {
      pdfMake.vfs = vfs;
    }

    const notoVfs = await loadNotoSansVfs();
    if (notoVfs) {
      pdfMake.vfs = { ...(pdfMake.vfs || {}), ...notoVfs };
      pdfMake.fonts = {
        ...(pdfMake.fonts || {}),
        NotoSans: {
          normal: 'NotoSans-Regular.ttf',
          bold: 'NotoSans-Bold.ttf',
          italics: 'NotoSans-Italic.ttf',
          bolditalics: 'NotoSans-BoldItalic.ttf',
        },
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf',
        },
      };
      defaultFontName = 'NotoSans';
      return;
    }

    pdfMake.fonts = {
      ...(pdfMake.fonts || {}),
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf',
      },
    };
    defaultFontName = 'Roboto';
  })();

  await fontSetupPromise;
}

export async function getPdfMake(): Promise<PdfMakeInstance> {
  if (!pdfMakePromise) {
    pdfMakePromise = (async () => {
      const module = await import('pdfmake/build/pdfmake');
      return module.default;
    })();
  }

  const pdfMake = await pdfMakePromise;
  await ensureFonts(pdfMake);
  return pdfMake;
}

export async function getPdfMakeConfig(): Promise<{
  pdfMake: PdfMakeInstance;
  fontName: 'NotoSans' | 'Roboto';
}> {
  const pdfMake = await getPdfMake();
  return { pdfMake, fontName: defaultFontName };
}

export type { TDocumentDefinitions };
