import fs from 'fs';
import path from 'path';
import PdfPrinter from 'pdfmake';
// @ts-ignore - pdfmake types may not be available in all environments
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

type PdfMakeFontDictionary = {
  [fontName: string]: {
    normal: Buffer;
    bold: Buffer;
    italics: Buffer;
    bolditalics: Buffer;
  };
};

let printerPromise: Promise<PdfPrinter> | null = null;
let defaultFontName: 'NotoSans' | 'Roboto' = 'Roboto';

function getNotoFontPath(fileName: string) {
  return path.join(process.cwd(), 'public', 'fonts', 'noto-sans', fileName);
}

function loadFontFile(filePath: string): Buffer | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

function loadNotoSansFonts(): PdfMakeFontDictionary | null {
  const regular = loadFontFile(getNotoFontPath('NotoSans-Regular.ttf'));
  const bold = loadFontFile(getNotoFontPath('NotoSans-Bold.ttf'));
  const italics = loadFontFile(getNotoFontPath('NotoSans-Italic.ttf'));
  const bolditalics = loadFontFile(getNotoFontPath('NotoSans-BoldItalic.ttf'));

  if (!regular || !bold || !italics || !bolditalics) {
    return null;
  }

  return {
    NotoSans: {
      normal: regular,
      bold,
      italics,
      bolditalics,
    },
  };
}

async function loadRobotoFonts(): Promise<PdfMakeFontDictionary> {
  const vfsModule: any = await import('pdfmake/build/vfs_fonts');
  const vfs =
    vfsModule?.pdfMake?.vfs ||
    vfsModule?.default?.pdfMake?.vfs ||
    vfsModule?.vfs ||
    {};

  return {
    Roboto: {
      normal: Buffer.from(vfs['Roboto-Regular.ttf'], 'base64'),
      bold: Buffer.from(vfs['Roboto-Medium.ttf'], 'base64'),
      italics: Buffer.from(vfs['Roboto-Italic.ttf'], 'base64'),
      bolditalics: Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64'),
    },
  };
}

async function getPdfPrinter(): Promise<PdfPrinter> {
  if (!printerPromise) {
    printerPromise = (async () => {
      const notoFonts = loadNotoSansFonts();
      const fonts = notoFonts ?? (await loadRobotoFonts());
      defaultFontName = notoFonts ? 'NotoSans' : 'Roboto';
      return new PdfPrinter(fonts);
    })();
  }
  return printerPromise;
}

export async function createPdfBuffer(docDefinition: TDocumentDefinitions): Promise<Buffer> {
  const printer = await getPdfPrinter();
  return new Promise((resolve, reject) => {
    const doc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', err => reject(err));
    doc.end();
  });
}

export async function getServerPdfFontName(): Promise<'NotoSans' | 'Roboto'> {
  await getPdfPrinter();
  return defaultFontName;
}
