export type RoleType = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
export type StatusType = 'ACTIVE' | 'INACTIVE';
export type FingerIndexType = 'FINGER_1' | 'FINGER_2' | 'FINGER_3';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  role: {
    id?: string;
    name: RoleType;
    description?: string;
  };
  status: StatusType;
  validUntil?: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    createdBatches?: number;
    createdStudents?: number;
  };
}

export interface Batch {
  id: string;
  name: string;
  status: StatusType;
  validUntil?: string | null;
  createdAt: string;
  updatedAt?: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
}

export interface FingerprintSlot {
  isEnrolled: boolean;
  qualityScore: number;
  createdAt?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  mobileNumber: string;
  email?: string | null;
  status: StatusType;
  batchId: string;
  batchName: string;
  createdAt: string;
  updatedAt?: string;
  finger1: FingerprintSlot | null;
  finger2: FingerprintSlot | null;
  finger3: FingerprintSlot | null;
}

export interface DeviceStatus {
  connected: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SERVICE_NOT_RUNNING' | 'DRIVER_NOT_WORKING' | 'DEVICE_NOT_DETECTED';
  deviceName: string;
  driverInstalled: boolean;
  serviceRunning: boolean;
  message: string;
  details?: any;
}

export interface DashboardSummary {
  totalBatches: number;
  batchesCreatedByUsers: number;
  remainingBatches: number;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalUsers: number;
  totalEnrolledFingers: number;
}
