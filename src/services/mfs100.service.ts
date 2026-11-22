import { fingerprintService } from './fingerprint.service';

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
  private candidateUrls = [
    'https://localhost:8003/mfs100',
    'http://localhost:8003/mfs100',
    'https://127.0.0.1:8003/mfs100',
    'http://127.0.0.1:8003/mfs100',
    'https://localhost:8004/mfs100',
    'http://localhost:8004/mfs100',
    'http://127.0.0.1:8004',
  ];

  private activeBaseUrl: string = 'https://localhost:8003/mfs100';

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
   * Direct fetch wrapper with timeout
   */
  private async directRequest<T>(
    baseUrl: string,
    endpoint: string,
    method: 'GET' | 'POST',
    body?: any,
    timeoutMs: number = 5000
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`MFS100 HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Checks MFS100 device across candidate ports and backend proxy
   */
  async checkDevice(): Promise<DeviceStatusResult> {
    // 1. Try candidate direct URLs
    for (const url of this.candidateUrls) {
      try {
        let data: MFS100InfoResponse | null = null;
        try {
          data = await this.directRequest<MFS100InfoResponse>(url, 'info', 'POST', {}, 2000);
        } catch {
          data = await this.directRequest<MFS100InfoResponse>(url, 'info', 'GET', undefined, 2000);
        }

        if (data) {
          this.activeBaseUrl = url;
          const errorCode = this.getErrorCode(data.ErrorCode);
          const port = url.includes('8004') ? 8004 : 8003;

          if (data.ErrorCode !== undefined && errorCode !== 0) {
            return {
              connected: false,
              status: 'NOT_READY',
              url,
              port,
              message: data.ErrorDescription || `MFS100 returned error code ${errorCode}.`,
            };
          }

          const deviceInfo = data.DeviceInfo;
          return {
            connected: true,
            status: 'READY',
            url,
            port,
            deviceModel: deviceInfo?.Model || 'Mantra MFS100',
            serialNumber: deviceInfo?.SerialNo || '',
            width: deviceInfo?.Width,
            height: deviceInfo?.Height,
            message: 'Mantra MFS100 connected and ready.',
          };
        }
      } catch {
        // Continue to next candidate
      }
    }

    // 2. Fallback: Query backend device bridge (bypasses browser SSL cert restriction)
    try {
      const bridgeStatus = await fingerprintService.getDeviceStatus();
      if (bridgeStatus && bridgeStatus.connected) {
        this.activeBaseUrl = bridgeStatus.url || 'https://localhost:8003/mfs100';
        return {
          connected: true,
          status: 'READY',
          url: bridgeStatus.url || 'https://localhost:8003/mfs100',
          port: bridgeStatus.port || 8003,
          deviceModel: bridgeStatus.deviceName || 'Mantra MFS100',
          message: 'Mantra MFS100 connected via local bridge.',
        };
      }
    } catch {
      // Backend bridge also unreachable or failed
    }

    return {
      connected: false,
      status: 'NOT_RUNNING',
      url: this.activeBaseUrl,
      port: 8003,
      message:
        'MFS100 Client Service not responding at https://localhost:8003/mfs100. Please start Mantra MFS100 service in Windows Services.',
    };
  }

  /**
   * Fingerprint capture from physical hardware.
   * Direct hardware capture with automatic backend bridge fallback.
   */
  async capture(
    qualityThreshold: number = 60,
    timeoutSeconds: number = 10
  ): Promise<MFS100CaptureResult> {
    const payload = {
      Quality: qualityThreshold,
      TimeOut: timeoutSeconds,
    };

    // 1. Attempt direct capture on active and candidate URLs
    const urlsToTry = [
      this.activeBaseUrl,
      ...this.candidateUrls.filter((u) => u !== this.activeBaseUrl),
    ];

    let lastError = '';

    for (const url of urlsToTry) {
      try {
        const data = await this.directRequest<MFS100CaptureResponse>(
          url,
          'capture',
          'POST',
          payload,
          (timeoutSeconds + 4) * 1000
        );

        if (data) {
          this.activeBaseUrl = url;
          const errorCode = this.getErrorCode(data.ErrorCode);

          if (errorCode !== 0) {
            return {
              success: false,
              errorCode,
              errorDescription: data.ErrorDescription || `Capture failed with error ${errorCode}.`,
              qualityScore: 0,
              templateData: '',
            };
          }

          const templateData = data.IsoTemplate || data.AnsiTemplate || '';
          if (!templateData.trim()) {
            return {
              success: false,
              errorCode: -2,
              errorDescription: 'ISO biometric template not returned by scanner.',
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
            qualityScore: Number(data.Quality || 0),
            templateData,
            previewImage,
            rawBmp: rawBmp || undefined,
            deviceInfo: 'Mantra MFS100',
          };
        }
      } catch (err: any) {
        lastError = err.message || 'Capture failed';
      }
    }

    // 2. Direct browser fetch failed (often due to localhost self-signed SSL certificate).
    // Use local backend bridge proxy to trigger hardware scan:
    try {
      const bridgeResult = await fingerprintService.captureDevice(
        qualityThreshold,
        timeoutSeconds
      );

      if (bridgeResult && bridgeResult.success) {
        return {
          success: true,
          errorCode: 0,
          errorDescription: bridgeResult.errorDescription || 'Fingerprint captured successfully.',
          qualityScore: Number(bridgeResult.qualityScore || 0),
          templateData: bridgeResult.templateData,
          previewImage: bridgeResult.previewImage,
          rawBmp: bridgeResult.rawBmp,
          deviceInfo: bridgeResult.deviceInfo || 'Mantra MFS100',
        };
      } else if (bridgeResult && bridgeResult.errorDescription) {
        return {
          success: false,
          errorCode: bridgeResult.errorCode || -1,
          errorDescription: bridgeResult.errorDescription,
          qualityScore: 0,
          templateData: '',
        };
      }
    } catch (bridgeErr: any) {
      lastError = bridgeErr?.response?.data?.message || bridgeErr.message || lastError;
    }

    return {
      success: false,
      errorCode: -1,
      errorDescription: `Mantra MFS100 scanner not connected: ${lastError}. Ensure MFS100 Client Service is running at https://localhost:8003/mfs100.`,
      qualityScore: 0,
      templateData: '',
    };
  }

  getActiveUrl(): string {
    return this.activeBaseUrl;
  }
}

export const mfs100Service = new MFS100Service();
