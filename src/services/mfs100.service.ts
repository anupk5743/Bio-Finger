
const MFS100_BASE_URL = 'https://localhost:8003/mfs100';

export interface MFS100CaptureResult {
  success: boolean;
  errorCode: number;
  errorDescription: string;
  qualityScore: number;
  templateData: string;
  previewImage?: string;
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

export class MFS100Service {
  private readonly baseUrl = MFS100_BASE_URL;
  private activeBaseUrl = MFS100_BASE_URL;

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

  private async post<T>(
    endpoint: string,
    payload: Record<string, unknown>,
    timeoutMs: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    try {
      const response = await fetch(
        `${this.activeBaseUrl}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          `MFS100 HTTP error: ${response.status} ${response.statusText}`
        );
      }

      const contentType =
        response.headers.get('content-type') || '';

      if (!contentType.toLowerCase().includes('json')) {
        throw new Error(
          'MFS100 service returned a non-JSON response.'
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Checks whether the MFS100 client service responds.
   * A successful /info response does not independently
   * prove that a physical fingerprint capture will work.
   */
  async checkDevice(): Promise<DeviceStatusResult> {
    try {
      const data = await this.post<MFS100InfoResponse>(
        'info',
        {},
        3000
      );

      const hasErrorCode = data.ErrorCode !== undefined;
      const errorCode = this.getErrorCode(data.ErrorCode);

      if (hasErrorCode && errorCode !== 0) {
        return {
          connected: true,
          status: 'NOT_READY',
          url: this.activeBaseUrl,
          port: 8003,
          message:
            data.ErrorDescription ||
            `MFS100 service responded with error code ${errorCode}.`,
        };
      }

      const deviceInfo = data.DeviceInfo;

      if (!deviceInfo) {
        return {
          connected: true,
          status: 'NOT_READY',
          url: this.activeBaseUrl,
          port: 8003,
          message:
            'MFS100 service is responding, but device information was not returned. Physical scanner readiness is not confirmed.',
        };
      }

      return {
        connected: true,
        status: 'READY',
        url: this.activeBaseUrl,
        port: 8003,
        deviceModel: deviceInfo.Model || 'Mantra MFS100',
        serialNumber: deviceInfo.SerialNo || '',
        width: deviceInfo.Width,
        height: deviceInfo.Height,
        message: 'MFS100 service responded and returned device information.',
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown connection error';

      const isCertificateError =
        message.toLowerCase().includes('certificate') ||
        message.toLowerCase().includes('ssl') ||
        message.toLowerCase().includes('cert');

      return {
        connected: false,
        status: isCertificateError ? 'CERT_ERROR' : 'NOT_RUNNING',
        url: this.baseUrl,
        port: 8003,
        message: isCertificateError
          ? `MFS100 HTTPS certificate error: ${message}`
          : `MFS100 service is not responding at ${this.baseUrl}. ${message}`,
      };
    }
  }

  /**
   * Requests a physical fingerprint capture.
   * No generated template, fake image or assumed quality score.
   */
  async capture(
    qualityThreshold: number = 60,
    timeoutSeconds: number = 10
  ): Promise<MFS100CaptureResult> {
    if (
      !Number.isFinite(qualityThreshold) ||
      qualityThreshold < 1 ||
      qualityThreshold > 100
    ) {
      return {
        success: false,
        errorCode: -1,
        errorDescription: 'Quality threshold must be between 1 and 100.',
        qualityScore: 0,
        templateData: '',
      };
    }

    if (
      !Number.isFinite(timeoutSeconds) ||
      timeoutSeconds < 1 ||
      timeoutSeconds > 60
    ) {
      return {
        success: false,
        errorCode: -1,
        errorDescription: 'Capture timeout must be between 1 and 60 seconds.',
        qualityScore: 0,
        templateData: '',
      };
    }

    try {
      const data = await this.post<MFS100CaptureResponse>(
        'capture',
        {
          Quality: qualityThreshold,
          TimeOut: timeoutSeconds,
        },
        (timeoutSeconds + 5) * 1000
      );

      const errorCode = this.getErrorCode(data.ErrorCode);
      const errorDescription =
        data.ErrorDescription || '';

      if (errorCode !== 0) {
        return {
          success: false,
          errorCode,
          errorDescription:
            errorDescription ||
            `MFS100 capture failed with error code ${errorCode}.`,
          qualityScore: 0,
          templateData: '',
        };
      }

      // Only accept actual biometric template fields.
      // Never use BitmapData as a biometric template.
      const templateData =
        data.IsoTemplate ||
        data.AnsiTemplate ||
        data.RawData ||
        '';

      if (
        typeof templateData !== 'string' ||
        templateData.trim().length === 0
      ) {
        return {
          success: false,
          errorCode: -2,
          errorDescription:
            'Capture response did not contain a valid biometric template.',
          qualityScore: 0,
          templateData: '',
        };
      }

      const parsedQuality = Number(data.Quality);

      if (
        !Number.isFinite(parsedQuality) ||
        parsedQuality < 0 ||
        parsedQuality > 100
      ) {
        return {
          success: false,
          errorCode: -3,
          errorDescription:
            'Capture response did not contain a valid quality score.',
          qualityScore: 0,
          templateData: '',
        };
      }

      const rawBmp = data.BitmapData || '';

      const previewImage = rawBmp
        ? rawBmp.startsWith('data:')
          ? rawBmp
          : `data:image/bmp;base64,${rawBmp}`
        : undefined;

      return {
        success: true,
        errorCode: 0,
        errorDescription: 'Fingerprint captured successfully.',
        qualityScore: parsedQuality,
        templateData,
        previewImage,
        rawBmp: rawBmp || undefined,
        deviceInfo: 'Mantra MFS100',
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown capture error';

      const isTimeout =
        error instanceof Error && error.name === 'AbortError';

      return {
        success: false,
        errorCode: -1,
        errorDescription: isTimeout
          ? 'Fingerprint capture timed out. Please try again.'
          : `MFS100 capture failed: ${message}`,
        qualityScore: 0,
        templateData: '',
      };
    }
  }

  getActiveUrl(): string {
    return this.activeBaseUrl;
  }
}

export const mfs100Service = new MFS100Service();
