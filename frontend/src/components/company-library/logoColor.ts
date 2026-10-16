const FALLBACK_COLOR = "#0758b5";

export const readLogo = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error("Could not read logo"));
  reader.readAsDataURL(file);
});

/** Removes transparent or plain white padding so logos fill the report header. */
export const trimLogo = (dataUrl: string): Promise<string> => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    const sourceScale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * sourceScale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * sourceScale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return reject(new Error("Could not prepare logo"));
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (pixels[i + 3] < 60 || (pixels[i] > 245 && pixels[i + 1] > 245 && pixels[i + 2] > 245)) continue;
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
    if (right < left) return resolve(dataUrl);
    const padding = Math.max(6, Math.round(Math.max(right - left, bottom - top) * 0.04));
    left = Math.max(0, left - padding); top = Math.max(0, top - padding);
    right = Math.min(canvas.width - 1, right + padding); bottom = Math.min(canvas.height - 1, bottom + padding);
    const width = right - left + 1, height = bottom - top + 1;
    const scale = Math.min(1, 800 / Math.max(width, height));
    const cropped = document.createElement("canvas");
    cropped.width = Math.max(1, Math.round(width * scale));
    cropped.height = Math.max(1, Math.round(height * scale));
    cropped.getContext("2d")!.drawImage(canvas, left, top, width, height, 0, 0, cropped.width, cropped.height);
    resolve(cropped.toDataURL("image/png"));
  };
  image.onerror = () => reject(new Error("Could not open logo"));
  image.src = dataUrl;
});

/** Finds the largest saturated color family, ignoring transparent, black, white and grey pixels. */
export const dominantBrandColor = (dataUrl: string): Promise<string> => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    const scale = Math.min(1, 240 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return reject(new Error("Could not inspect logo colors"));
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const families = Array.from({ length: 36 }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 150) continue;
      const r = pixels[i] / 255, g = pixels[i + 1] / 255, b = pixels[i + 2] / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
      const lightness = (max + min) / 2;
      const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
      if (saturation < 0.25 || lightness < 0.13 || lightness > 0.86 || delta < 0.12) continue;
      let hue = 0;
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
      hue = (hue * 60 + 360) % 360;
      const bucket = families[Math.floor(hue / 10) % 36];
      const weight = 0.6 + saturation * 0.4;
      bucket.weight += weight;
      bucket.r += pixels[i] * weight;
      bucket.g += pixels[i + 1] * weight;
      bucket.b += pixels[i + 2] * weight;
    }
    const strongest = families.reduce((a, b) => b.weight > a.weight ? b : a);
    if (!strongest.weight) return resolve(FALLBACK_COLOR);
    const brightness = (family: typeof strongest) => (family.r * 0.2126 + family.g * 0.7152 + family.b * 0.0722) / family.weight;
    // Similar-sized brand colors: use the darker one, which works better as a report heading.
    const best = families.filter(family => family.weight >= strongest.weight * 0.85)
      .reduce((a, b) => brightness(b) < brightness(a) ? b : a, strongest);
    const channels = [best.r, best.g, best.b].map(channel => Math.round(channel / best.weight));
    resolve(`#${channels.map(channel => channel.toString(16).padStart(2, "0")).join("")}`);
  };
  image.onerror = () => reject(new Error("Could not open logo"));
  image.src = dataUrl;
});
