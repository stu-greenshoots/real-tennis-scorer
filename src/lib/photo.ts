/**
 * Read an image File, downscale it to fit within `max` x `max` pixels, and
 * return a JPEG data URL. Keeps photos small enough to live in localStorage
 * alongside the rest of the match payload.
 */
export async function fileToDownscaledDataUrl(
  file: File,
  max = 320,
  quality = 0.82,
): Promise<string> {
  // Prefer createImageBitmap with EXIF orientation honored — phone photos
  // often store rotation in EXIF rather than the pixel buffer, and a raw
  // <img>/canvas pipeline would render them sideways.
  const source = await decode(file)
  try {
    const ratio = Math.min(1, max / Math.max(source.width, source.height))
    const w = Math.round(source.width * ratio)
    const h = Math.round(source.height * ratio)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas 2d context unavailable')
    ctx.drawImage(source.image, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    source.dispose()
  }
}

type DecodedImage = {
  image: CanvasImageSource
  width: number
  height: number
  dispose: () => void
}

async function decode(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      }
    } catch {
      // fall through to <img> path
    }
  }
  const objectUrl = URL.createObjectURL(file)
  const img = await loadImage(objectUrl)
  return {
    image: img,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    dispose: () => URL.revokeObjectURL(objectUrl),
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('failed to load image'))
    img.src = src
  })
}
