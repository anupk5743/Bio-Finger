
import { fingerprintService } from './fingerprint.service';
import { AIFingerprintEnhancer } from './aiFingerprintEnhancer.service';

/* =========================================================
   TYPES
========================================================= */

export interface MFS100CaptureResult {
  success: boolean;
  errorCode: number;
  errorDescription: string;
  qualityScore: number;

  // Original ISO / ANSI biometric template.
  templateData: string;

  // Enhanced image for UI display only.
  previewImage?: string;

  // Untouched original scanner image.
  originalPreviewImage?: string;

  deviceInfo?: string;
  rawBmp?: string;
}

export interface DeviceStatusResult {
  connected: boolean;
  status: 'READY' | 'NOT_READY' | 'NOT_RUNNING' | 'CERT_ERROR';
  url?: string;
  port?: number;
  message: string;
  deviceModel?: string;
  serialNumber?: string;
  width?: number;
  height?: number;
}

interface MFS100InfoResponse {
  ErrorCode?: number | string;
  ErrorDescription?: string;
  DeviceInfo?: {
    Model?: string;
    SerialNo?: string;
    Width?: number;
    Height?: number;
  };
}

interface MFS100CaptureResponse {
  ErrorCode?: number | string;
  ErrorDescription?: string;
  Quality?: number | string;
  BitmapData?: string;
  IsoTemplate?: string;
  AnsiTemplate?: string;
  RawData?: string;
}

/* =========================================================
   MFS100 SERVICE
========================================================= */

export class MFS100Service {
  private candidateUrls: string[] = [
    'https://localhost:8003/mfs100',
    'http://localhost:8003/mfs100',
    'https://127.0.0.1:8003/mfs100',
    'http://127.0.0.1:8003/mfs100',
    'https://localhost:8004/mfs100',
    'http://localhost:8004/mfs100',
    'http://127.0.0.1:8004',
  ];

  private activeBaseUrl = 'https://localhost:8003/mfs100';

  private getErrorCode(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : -1;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : -1;
    }

    return -1;
  }

  /* =======================================================
     IMAGE HELPERS
  ======================================================= */

  /**
   * Convert scanner BitmapData to a browser-readable image URL.
   * Does not modify original image bytes.
   */
  private normalizeBitmapData(
    bitmapData?: string
  ): string | undefined {
    if (!bitmapData || !bitmapData.trim()) {
      return undefined;
    }

    const value = bitmapData.trim();

    if (value.startsWith('data:image/')) {
      return value;
    }

    // Remove accidental whitespace from base64.
    const base64 = value.replace(/\s/g, '');

    return `data:image/bmp;base64,${base64}`;
  }

  /**
   * Keep original image and enhanced display image separate.
   *
   * Original image:
   * - Preserved without pixel modification.
   *
   * Enhanced image:
   * - Used only for visual presentation.
   */
  private async processFingerprintPreview(
    originalImage?: string
  ): Promise<{
    originalPreviewImage?: string;
    previewImage?: string;
  }> {
    if (!originalImage) {
      return {
        originalPreviewImage: undefined,
        previewImage: undefined,
      };
    }

    try {
      const enhancedImage =
        await AIFingerprintEnhancer.enhance(originalImage);

      return {
        originalPreviewImage: originalImage,
        previewImage: enhancedImage || originalImage,
      };
    } catch (error) {
      console.error(
        'Fingerprint preview enhancement failed:',
        error
      );

      // Preserve capture even if image enhancement fails.
      return {
        originalPreviewImage: originalImage,
        previewImage: originalImage,
      };
    }
  }

  /* =======================================================
     DIRECT HTTP REQUEST
  ======================================================= */

  private async directRequest<T>(
    baseUrl: string,
    endpoint: string,
    method: 'GET' | 'POST',
    body?: unknown,
    timeoutMs = 5000
  ): Promise<T> {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    try {
      const response = await fetch(
        `${baseUrl}/${endpoint}`,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          ...(body !== undefined
            ? { body: JSON.stringify(body) }
            : {}),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          `MFS100 HTTP ${response.status}: ${response.statusText}`
        );
      }

      return (await response.json()) as T;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  /* =======================================================
     DEVICE STATUS
  ======================================================= */

  async checkDevice(): Promise<DeviceStatusResult> {
    // First attempt: direct MFS100 connection.
    for (const url of this.candidateUrls) {
      try {
        let data: MFS100InfoResponse | null = null;

        try {
          data = await this.directRequest<MFS100InfoResponse>(
            url,
            'info',
            'POST',
            {},
            2000
          );
        } catch {
          data = await this.directRequest<MFS100InfoResponse>(
            url,
            'info',
            'GET',
            undefined,
            2000
          );
        }

        if (!data) {
          continue;
        }

        const errorCode = this.getErrorCode(data.ErrorCode);
        const port = url.includes('8004') ? 8004 : 8003;

        if (
          data.ErrorCode !== undefined &&
          errorCode !== 0
        ) {
          return {
            connected: false,
            status: 'NOT_READY',
            url,
            port,
            message:
              data.ErrorDescription ||
              `MFS100 returned error code ${errorCode}.`,
          };
        }

        this.activeBaseUrl = url;

        const deviceInfo = data.DeviceInfo;

        return {
          connected: true,
          status: 'READY',
          url,
          port,
          deviceModel:
            deviceInfo?.Model || 'Mantra MFS100',
          serialNumber: deviceInfo?.SerialNo || '',
          width: deviceInfo?.Width,
          height: deviceInfo?.Height,
          message: 'Mantra MFS100 connected and ready.',
        };
      } catch {
        // Try next candidate URL.
      }
    }

    // Second attempt: local backend bridge.
    try {
      const bridgeStatus =
        await fingerprintService.getDeviceStatus();

      if (bridgeStatus?.connected) {
        const bridgeUrl =
          bridgeStatus.url ||
          'https://localhost:8003/mfs100';

        this.activeBaseUrl = bridgeUrl;

        return {
          connected: true,
          status: 'READY',
          url: bridgeUrl,
          port: bridgeStatus.port || 8003,
          deviceModel:
            bridgeStatus.deviceName || 'Mantra MFS100',
          message:
            'Mantra MFS100 connected via local bridge.',
        };
      }
    } catch {
      // Bridge unavailable.
    }

    return {
      connected: false,
      status: 'NOT_RUNNING',
      url: this.activeBaseUrl,
      port: 8003,
      message:
        'MFS100 Client Service not responding. ' +
        'Please start Mantra MFS100 service in Windows Services.',
    };
  }

  /* =======================================================
     CAPTURE VALIDATION
  ======================================================= */

  private createCaptureError(
    errorCode: number,
    errorDescription: string
  ): MFS100CaptureResult {
    return {
      success: false,
      errorCode,
      errorDescription,
      qualityScore: 0,
      templateData: '',
    };
  }

  /**
   * Creates the final successful capture response.
   *
   * IMPORTANT:
   * templateData is never passed through image enhancement.
   */
  private async createCaptureResult(
    templateData: string,
    qualityScore: number,
    originalImage?: string,
    rawBmp?: string,
    deviceInfo = 'Mantra MFS100',
    errorDescription = 'Fingerprint captured successfully.'
  ): Promise<MFS100CaptureResult> {
    const images =
      await this.processFingerprintPreview(originalImage);

    return {
      success: true,
      errorCode: 0,
      errorDescription,
      qualityScore,
      templateData,

      // Enhanced UI image.
      previewImage: images.previewImage,

      // Original scanner image.
      originalPreviewImage:
        images.originalPreviewImage,

      rawBmp,
      deviceInfo,
    };
  }

  /* =======================================================
     DIRECT HARDWARE CAPTURE
  ======================================================= */

  async capture(
    qualityThreshold = 60,
    timeoutSeconds = 10
  ): Promise<MFS100CaptureResult> {
    const payload = {
      Quality: qualityThreshold,
      TimeOut: timeoutSeconds,
    };

    const urlsToTry = [
      this.activeBaseUrl,
      ...this.candidateUrls.filter(
        url => url !== this.activeBaseUrl
      ),
    ];

    let lastError = '';

    // 1. Try direct hardware connection.
    for (const url of urlsToTry) {
      try {
        const data =
          await this.directRequest<MFS100CaptureResponse>(
            url,
            'capture',
            'POST',
            payload,
            (timeoutSeconds + 4) * 1000
          );

        if (!data) {
          continue;
        }

        this.activeBaseUrl = url;

        const errorCode = this.getErrorCode(
          data.ErrorCode
        );

        if (errorCode !== 0) {
          return this.createCaptureError(
            errorCode,
            data.ErrorDescription ||
              `Capture failed with error ${errorCode}.`
          );
        }

        // Keep original biometric template unchanged.
        const templateData =
          data.IsoTemplate ||
          data.AnsiTemplate ||
          '';

        if (!templateData.trim()) {
          return this.createCaptureError(
            -2,
            'ISO/ANSI biometric template not returned by scanner.'
          );
        }

        // Original scanner image.
        const rawBmp = data.BitmapData || '';

        const originalImage =
          this.normalizeBitmapData(rawBmp);

        // Generate separate enhanced display preview.
        return await this.createCaptureResult(
          templateData,
          Number(data.Quality || 0),
          originalImage,
          rawBmp || undefined,
          'Mantra MFS100'
        );
      } catch (error: unknown) {
        lastError =
          error instanceof Error
            ? error.message
            : 'Direct MFS100 capture failed.';
      }
    }

    // 2. Direct browser connection failed.
    // Try local backend bridge.
    try {
      const bridgeResult =
        await fingerprintService.captureDevice(
          qualityThreshold,
          timeoutSeconds
        );

      if (bridgeResult?.success) {
        const templateData =
          bridgeResult.templateData || '';

        if (!templateData.trim()) {
          return this.createCaptureError(
            -2,
            'Biometric template not returned by backend bridge.'
          );
        }

        // Do not modify the original bridge image.
        const originalImage =
          bridgeResult.previewImage || undefined;

        return await this.createCaptureResult(
          templateData,
          Number(bridgeResult.qualityScore || 0),
          originalImage,
          bridgeResult.rawBmp,
          bridgeResult.deviceInfo || 'Mantra MFS100',
          bridgeResult.errorDescription ||
            'Fingerprint captured successfully.'
        );
      }

      if (bridgeResult?.errorDescription) {
        return this.createCaptureError(
          bridgeResult.errorCode || -1,
          bridgeResult.errorDescription
        );
      }
    } catch (error: unknown) {
      const bridgeError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      };

      lastError =
        bridgeError.response?.data?.message ||
        bridgeError.message ||
        lastError;
    }

    return this.createCaptureError(
      -1,
      `Mantra MFS100 scanner not connected: ${lastError}. ` +
        'Ensure MFS100 Client Service is running at ' +
        'https://localhost:8003/mfs100.'
    );
  }

  /* =======================================================
     UTILITY
  ======================================================= */

  getActiveUrl(): string {
    return this.activeBaseUrl;
  }
}

/* =========================================================
   SINGLETON INSTANCE
========================================================= */

export const mfs100Service = new MFS100Service();
