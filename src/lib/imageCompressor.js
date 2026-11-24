/**
 * Client-side automatic image resizer & compressor using HTML5 Canvas.
 *
 * Option A targets:
 *  - 'passport' | 'logo' | 'avatar' | 'photo' -> <= 20 KB
 *  - 'document' (birth certificates, transcripts, etc.) -> <= 100 KB
 * Non-image files (e.g. PDFs) are returned untouched.
 */

const PHOTO_PURPOSES = new Set(["passport", "logo", "avatar", "photo"]);

export function getTargetBudget(purpose = "document") {
  const isSmallPhoto = PHOTO_PURPOSES.has(String(purpose || "").toLowerCase());
  return {
    maxBytes: isSmallPhoto ? 20 * 1024 : 100 * 1024,
    initialMaxDim: isSmallPhoto ? 420 : 1400,
    minDim: isSmallPhoto ? 120 : 480,
  };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

export async function compressImageFile(file, options = {}) {
  if (!file || typeof file.type !== "string") return file;
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  const purpose = options.purpose || "document";
  const { maxBytes, initialMaxDim, minDim } = getTargetBudget(purpose);
  const limitBytes = options.maxBytes || maxBytes;

  if (file.size <= limitBytes) {
    return file;
  }

  try {
    const img = await loadImage(file);
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;
    if (!origW || !origH) return file;

    const scale0 = Math.min(1, initialMaxDim / Math.max(origW, origH));
    let width = Math.max(1, Math.round(origW * scale0));
    let height = Math.max(1, Math.round(origH * scale0));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    const qualities = [0.82, 0.68, 0.54, 0.42, 0.32, 0.24];
    let bestBlob = null;

    for (let pass = 0; pass < 7; pass++) {
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      for (const q of qualities) {
        const blob = await canvasToBlob(canvas, q);
        if (!blob) continue;
        if (!bestBlob || blob.size < bestBlob.size) {
          bestBlob = blob;
        }
        if (blob.size <= limitBytes) {
          const baseName = (file.name || "image").replace(/\.[^.]+$/, "");
          return new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
        }
      }

      // Reduce dimensions further for the next pass
      if (Math.max(width, height) <= minDim) break;
      width = Math.max(minDim, Math.round(width * 0.78));
      height = Math.max(minDim, Math.round(height * 0.78));
    }

    if (bestBlob && bestBlob.size < file.size) {
      const baseName = (file.name || "image").replace(/\.[^.]+$/, "");
      return new File([bestBlob], `${baseName}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }

    return file;
  } catch (_e) {
    return file;
  }
}
