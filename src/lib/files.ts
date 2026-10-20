export interface PickedFile {
  name: string;
  type: string;
  /** base64 data URL — uploaded to storage by the submit workflow */
  dataUrl: string;
  size: number;
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 4;
const MAX_IMAGE_SIDE = 1800;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    img.src = src;
  });
}

/** Phone photos are 3–8 MB; shrink them to a readable JPEG (~300 KB) before sending. */
async function compressImage(file: File): Promise<PickedFile> {
  const original = await readAsDataUrl(file);
  try {
    const img = await loadImage(original);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return { name, type: 'image/jpeg', dataUrl, size: Math.round((dataUrl.length * 3) / 4) };
  } catch {
    return { name: file.name, type: file.type, dataUrl: original, size: file.size };
  }
}

export async function pickFiles(files: FileList | File[]): Promise<{ files: PickedFile[]; error?: string }> {
  const out: PickedFile[] = [];
  for (const file of Array.from(files)) {
    if (file.size > MAX_FILE_BYTES) return { files: out, error: `"${file.name}" supera los 10 MB.` };
    const isImage = file.type.startsWith('image/') && file.type !== 'image/gif';
    if (!isImage && file.type !== 'application/pdf')
      return { files: out, error: `"${file.name}": solo se aceptan fotos o PDF.` };
    out.push(isImage ? await compressImage(file) : { name: file.name, type: file.type, dataUrl: await readAsDataUrl(file), size: file.size });
  }
  return { files: out };
}

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
