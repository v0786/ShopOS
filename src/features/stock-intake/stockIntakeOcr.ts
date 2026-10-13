import { MAX_INTAKE_FILE_SIZE } from './stockIntake';

const MAX_PDF_PAGES = 4;

export async function extractInvoiceText(file: File, onProgress: (progress: number) => void): Promise<string> {
  if (file.size > MAX_INTAKE_FILE_SIZE) throw new Error('Choose a document smaller than 15 MB.');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(file.name);
  if (!isPdf && !isImage) throw new Error('Choose an invoice photo or PDF file.');

  const [{ createWorker }, pages] = await Promise.all([
    import('tesseract.js'),
    isPdf ? renderPdfPages(file) : Promise.resolve([file] as (File | HTMLCanvasElement)[]),
  ]);
  if (pages.length > MAX_PDF_PAGES) throw new Error(`This PDF has more than ${MAX_PDF_PAGES} pages. Upload a shorter invoice.`);

  let progress = 0;
  const worker = await createWorker('eng', 1, {
    logger: event => {
      if (event.status === 'recognizing text') {
        progress = Math.max(progress, event.progress / pages.length);
        onProgress(Math.min(0.95, progress));
      }
    },
  });
  try {
    const result: string[] = [];
    for (const page of pages) {
      const recognized = await worker.recognize(page);
      result.push(recognized.data.text);
    }
    onProgress(1);
    return result.join('\n');
  } finally {
    await worker.terminate();
  }
}

async function renderPdfPages(file: File): Promise<HTMLCanvasElement[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES + 1);
  const canvases: HTMLCanvasElement[] = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot prepare the PDF for local text recognition.');
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    canvases.push(canvas);
  }
  return canvases;
}
