// M6 · Preparación de archivos de soporte antes de subirlos.
// - Acepta JPG, PNG y PDF (RF-32).
// - Las fotos tomadas con el celular (RF-33) se reducen y convierten a JPEG
//   para que pesen poco y siempre tengan un formato válido.

export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB (igual al límite del bucket)
const TIPOS_OK = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_LADO = 2000;

function cargarImagen(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`No se pudo leer la imagen "${file.name}".`)); };
    img.src = url;
  });
}

async function comprimir(file) {
  const img = await cargarImagen(file);
  const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
  const nombre = file.name.replace(/\.[^.]+$/, '') || 'soporte';
  return new File([blob], `${nombre}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

/** Valida y optimiza un archivo. Lanza Error con mensaje legible si no sirve. */
export async function prepararArchivo(file) {
  if (file.type === 'application/pdf') {
    if (file.size > MAX_BYTES) throw new Error(`"${file.name}" supera los 10 MB.`);
    return file;
  }
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" no es válido. Usa una foto (JPG/PNG) o un PDF.`);
  }
  // Imágenes grandes o en otros formatos (HEIC, WEBP…) se convierten a JPEG
  const procesado = (TIPOS_OK.includes(file.type) && file.size <= 1.5 * 1024 * 1024) ? file : await comprimir(file);
  if (procesado.size > MAX_BYTES) throw new Error(`"${file.name}" supera los 10 MB.`);
  return procesado;
}

export const esImagen = (tipo) => tipo?.startsWith('image/');
