
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

  /**
   * GET request for device information.
   * Confirm this method against the installed Mantra SDK.
   */
  private async get<T>(
    endpoint: string,
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
          method: 'GET',
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
   * POST request for operations that require a JSON payload.
   */
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
   * Checks MFS100 service and device information.
   */
  async checkDevice(): Promise<DeviceStatusResult> {
    try {
      const data = await this.get<MFS100InfoResponse>(
        'info',
        5000
      );

      const errorCode = this.getErrorCode(data.ErrorCode);

      if (data.ErrorCode !== undefined && errorCode !== 0) {
        return {
          connected: true,
          status: 'NOT_READY',
          url: this.activeBaseUrl,
          port: 8003,
          message:
            data.ErrorDescription ||
            `MFS100 returned error code ${errorCode}.`,
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
            'Service responded, but device information was not returned.',
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
        message:
          'MFS100 service responded and returned device information. Capture is not yet verified.',
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown connection error';

      const isTimeout =
        error instanceof Error &&
        error.name === 'AbortError';

      const isCertificateError =
        /certificate|ssl|cert/i.test(message);

      return {
        connected: false,
        status: isCertificateError
          ? 'CERT_ERROR'
          : 'NOT_RUNNING',
        url: this.baseUrl,
        port: 8003,
        message: isTimeout
          ? 'MFS100 service connection timed out.'
          : isCertificateError
            ? `MFS100 HTTPS certificate error: ${message}`
            : `MFS100 service is not responding at ${this.baseUrl}. ${message}`,
      };
    }
  }

  /**
   * Fingerprint capture.
   *
   * IMPORTANT:
   * Verify endpoint, method, payload and response fields
   * against your installed Mantra SDK before production use.
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
        errorDescription:
          'Quality threshold must be between 1 and 100.',
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
        errorDescription:
          'Capture timeout must be between 1 and 60 seconds.',
        qualityScore: 0,
        templateData: '',
      };
    }

    try {
      const data =
        await this.post<MFS100CaptureResponse>(
          'capture',
          {
            Quality: qualityThreshold,
            TimeOut: timeoutSeconds,
          },
          (timeoutSeconds + 5) * 1000
        );

      const errorCode = this.getErrorCode(data.ErrorCode);

      if (errorCode !== 0) {
        return {
          success: false,
          errorCode,
          errorDescription:
            data.ErrorDescription ||
            `MFS100 capture failed with error code ${errorCode}.`,
          qualityScore: 0,
          templateData: '',
        };
      }

      // ISO template is preferred, but format must be
      // consistent with the backend's biometric matching system.
      const templateData =
        data.IsoTemplate || '';

      if (!templateData.trim()) {
        return {
          success: false,
          errorCode: -2,
          errorDescription:
            'ISO biometric template was not returned. Verify the SDK response format.',
          qualityScore: 0,
          templateData: '',
        };
      }

      const qualityScore = Number(data.Quality);

      if (
        !Number.isFinite(qualityScore) ||
        qualityScore < 0 ||
        qualityScore > 100
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
        errorDescription:
          'Fingerprint captured successfully.',
        qualityScore,
        templateData,
        previewImage,
        rawBmp: rawBmp || undefined,
        deviceInfo: 'Mantra MFS100',
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown capture error';

      const isTimeout =
        error instanceof Error &&
        error.name === 'AbortError';

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
