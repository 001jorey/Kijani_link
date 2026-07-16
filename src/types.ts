export type PackageId = 'kijani-eco' | 'kijani-turbo' | 'kijani-giga';

export interface InternetPackage {
  id: PackageId;
  name: string;
  speed: string;
  price: string;
  features: string[];
  color: string;
}

export type SubscriberStatus = 'pending_activation' | 'active' | 'rejected';

export interface BillingInvoice {
  invoiceId: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

export interface SpeedTestResult {
  download: number;
  upload: number;
  ping: number;
  timestamp: string;
}

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  password?: string;
  address: string;
  packageId: PackageId;
  status: SubscriberStatus;
  registeredAt: string;
  activatedAt?: string;
  monthlyUsageGB: number[]; // Last 6 months
  billingHistory: BillingInvoice[];
  currentSpeedTest?: SpeedTestResult;
}

export interface NetworkNode {
  id: string;
  name: string;
  status: 'active' | 'maintenance' | 'idle';
  load: number; // percentage
  connections: number;
  latLong: [number, number, number]; // 3D coordinates
  type: 'hub' | 'relay' | 'solar-powered';
}
