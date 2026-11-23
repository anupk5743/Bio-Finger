
/**
 * Biometric Fingerprint Image Enhancement
 *
 * Display-only enhancement:
 * - Preserves original scanner image.
 * - Automatic optical polarity detection.
 * - CLAHE-style adaptive local histogram equalization.
 * - Conservative noise suppression.
 * - Ridge-preserving unsharp masking.
 * - Lossless PNG output.
 *
 * IMPORTANT:
 * Enhanced image must never replace the original biometric template.
 */

export interface AIEnhancementResult {
  enhancedImage: string;
  originalImage: string;
  clarityScore: number;
  ridgeCountEstimate: number;
  processingTimeMs: number;
}

export class AIFingerprintEnhancer {
  private static clamp(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  private static getGray(data: Uint8ClampedArray): Float32Array {
    const gray = new Float32Array(data.length / 4);

    for (let i = 0; i < gray.length; i++) {
      const p = i * 4;
      gray[i] =
        data[p] * 0.299 +
        data[p + 1] * 0.587 +
        data[p + 2] * 0.114;
    }

    return gray;
  }

  private static median(values: number[]): number {
    if (!values.length) return 0;

    values.sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  }

  /**
   * Detect whether the scanner image has a light optical background.
   */
  private static detectPolarity(
    gray: Float32Array,
    width: number,
    height: number
  ): boolean {
    const border: number[] = [];
    const center: number[] = [];

    const step = Math.max(1, Math.floor(Math.min(width, height) / 100));

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const value = gray[y * width + x];

        if (
          x < width * 0.08 ||
          x > width * 0.92 ||
          y < height * 0.08 ||
          y > height * 0.92
        ) {
          border.push(value);
        } else {
          center.push(value);
        }
      }
    }

    return this.median(border) > this.median(center);
  }

  /**
   * Contrast-Limited Adaptive Histogram Equalization.
   * Uses interpolated tile LUTs to reduce visible tile boundaries.
   */
  private static applyCLAHE(
    input: Float32Array,
    width: number,
    height: number
  ): Float32Array {
    const tileSize = 32;
    const tilesX = Math.ceil(width / tileSize);
    const tilesY = Math.ceil(height / tileSize);

    const luts: Uint8Array[] = [];

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const histogram = new Uint32Array(256);

        const x0 = tx * tileSize;
        const y0 = ty * tileSize;
        const x1 = Math.min(width, x0 + tileSize);
        const y1 = Math.min(height, y0 + tileSize);

        const area = (x1 - x0) * (y1 - y0);

        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            histogram[this.clamp(input[y * width + x])]++;
          }
        }

        // Conservative clipping prevents excessive noise amplification.
        const clipLimit = Math.max(2, Math.floor(area / 32));
        let excess = 0;

        for (let i = 0; i < 256; i++) {
          if (histogram[i] > clipLimit) {
            excess += histogram[i] - clipLimit;
            histogram[i] = clipLimit;
          }
        }

        const share = Math.floor(excess / 256);
        const remainder = excess % 256;

        for (let i = 0; i < 256; i++) {
          histogram[i] += share + (i < remainder ? 1 : 0);
        }

        const lut = new Uint8Array(256);
        let cumulative = 0;

        const first = histogram.find(v => v > 0) || 1;

        for (let i = 0; i < 256; i++) {
          cumulative += histogram[i];

          lut[i] = this.clamp(
            ((cumulative - first) / Math.max(1, area - first)) * 255
          );
        }

        luts.push(lut);
      }
    }

    const output = new Float32Array(input.length);

    for (let y = 0; y < height; y++) {
      const gy = (y + 0.5) / tileSize - 0.5;
      const y0 = Math.max(0, Math.min(tilesY - 1, Math.floor(gy)));
      const y1 = Math.min(tilesY - 1, y0 + 1);
      const fy = Math.max(0, Math.min(1, gy - Math.floor(gy)));

      for (let x = 0; x < width; x++) {
        const gx = (x + 0.5) / tileSize - 0.5;
        const x0 = Math.max(0, Math.min(tilesX - 1, Math.floor(gx)));
        const x1 = Math.min(tilesX - 1, x0 + 1);
        const fx = Math.max(0, Math.min(1, gx - Math.floor(gx)));

        const value = this.clamp(input[y * width + x]);

        const a = luts[y0 * tilesX + x0][value];
        const b = luts[y0 * tilesX + x1][value];
        const c = luts[y1 * tilesX + x0][value];
        const d = luts[y1 * tilesX + x1][value];

        const top = a * (1 - fx) + b * fx;
        const bottom = c * (1 - fx) + d * fx;

        output[y * width + x] =
          top * (1 - fy) + bottom * fy;
      }
    }

    return output;
  }

  /**
   * Conservative 3x3 Gaussian smoothing.
   * Used only as the reference for unsharp masking.
   */
  private static gaussianBlur(
    input: Float32Array,
    width: number,
    height: number
  ): Float32Array {
    const output = new Float32Array(input.length);

    const kernel = [
      1, 2, 1,
      2, 4, 2,
      1, 2, 1
    ];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weight = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));

            const w = kernel[(ky + 1) * 3 + (kx + 1)];

            sum += input[py * width + px] * w;
            weight += w;
          }
        }

        output[y * width + x] = sum / weight;
      }
    }

    return output;
  }

  /**
   * Main enhancement function.
   * Original data is never modified.
   */
  static async enhance(dataUrl: string): Promise<string> {
    if (
      !dataUrl ||
      typeof window === 'undefined' ||
      !dataUrl.startsWith('data:image')
    ) {
      return dataUrl;
    }

    return new Promise(resolve => {
      const img = new Image();

      img.onload = () => {
        try {
          const width = img.naturalWidth;
          const height = img.naturalHeight;

          if (!width || !height) {
            resolve(dataUrl);
            return;
          }

          // Keep native resolution. Never upscale or downscale.
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d', {
            willReadFrequently: true
          });

          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(
            0, 0, width, height
          );

          const originalPixels = imageData.data;

          let gray = this.getGray(originalPixels);

          // 1. Automatic optical polarity correction.
          const invert = this.detectPolarity(
            gray, width, height
          );

          if (invert) {
            for (let i = 0; i < gray.length; i++) {
              gray[i] = 255 - gray[i];
            }
          }

          // 2. Adaptive local contrast enhancement.
          let enhanced = this.applyCLAHE(
            gray, width, height
          );

          // 3. Conservative black-level correction.
          // Preserve faint ridges rather than applying hard thresholds.
          for (let i = 0; i < enhanced.length; i++) {
            const value = enhanced[i];

            enhanced[i] =
              value < 8 ? 0 : Math.min(255, value);
          }

          // 4. Edge-preserving unsharp masking.
          const blurred = this.gaussianBlur(
            enhanced, width, height
          );

          const output = imageData.data;

          for (let i = 0; i < enhanced.length; i++) {
            const original = enhanced[i];
            const detail = original - blurred[i];

            // Conservative sharpening avoids artificial ridge creation.
            const sharpened = this.clamp(
              original + detail * 0.65
            );

            const value = sharpened < 7 ? 0 : sharpened;

            const p = i * 4;

            output[p] = value;
            output[p + 1] = value;
            output[p + 2] = value;
            output[p + 3] = 255;
          }

          ctx.putImageData(imageData, 0, 0);

          // Lossless PNG display output.
          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          console.error(
            'Fingerprint enhancement failed:',
            error
          );

          // Never lose the original image on processing failure.
          resolve(dataUrl);
        }
      };

      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  /**
   * Returns both original and enhanced images separately.
   */
  static async enhanceWithMetadata(
    dataUrl: string
  ): Promise<AIEnhancementResult> {
    const start = performance.now();

    const enhancedImage = await this.enhance(dataUrl);

    return {
      originalImage: dataUrl,
      enhancedImage,
      clarityScore: 0,
      ridgeCountEstimate: 0,
      processingTimeMs: performance.now() - start
    };
  }
}
