import { Subscriber } from '../types';

export const SEED_SUBSCRIBERS: Subscriber[] = [
  {
    id: 'sub-1',
    name: 'John Kamau',
    email: 'john@kamau.me',
    password: 'password123',
    address: '12 State House Road, Nairobi',
    packageId: 'kijani-turbo',
    status: 'active',
    registeredAt: '2026-01-10T14:22:00Z',
    activatedAt: '2026-01-11T09:00:00Z',
    monthlyUsageGB: [120, 145, 132, 168, 155, 182],
    billingHistory: [
      { invoiceId: 'INV-401', date: '2026-07-01', amount: 5000, status: 'paid' },
      { invoiceId: 'INV-302', date: '2026-06-01', amount: 5000, status: 'paid' },
      { invoiceId: 'INV-205', date: '2026-05-01', amount: 5000, status: 'paid' }
    ],
    currentSpeedTest: {
      download: 198.4,
      upload: 185.1,
      ping: 8,
      timestamp: '2026-07-13T18:30:00Z'
    }
  },
  {
    id: 'sub-2',
    name: 'Sarah Connor',
    email: 'sarah@connor.io',
    password: 'password123',
    address: 'Suite 44, Nyali Arcade, Mombasa',
    packageId: 'kijani-giga',
    status: 'active',
    registeredAt: '2026-02-15T08:11:00Z',
    activatedAt: '2026-02-15T11:30:00Z',
    monthlyUsageGB: [650, 780, 810, 720, 890, 954],
    billingHistory: [
      { invoiceId: 'INV-402', date: '2026-07-01', amount: 9000, status: 'paid' },
      { invoiceId: 'INV-303', date: '2026-06-01', amount: 9000, status: 'paid' },
      { invoiceId: 'INV-206', date: '2026-05-01', amount: 9000, status: 'paid' }
    ],
    currentSpeedTest: {
      download: 984.7,
      upload: 962.3,
      ping: 4,
      timestamp: '2026-07-14T02:15:00Z'
    }
  },
  {
    id: 'sub-3',
    name: 'Michael Scott',
    email: 'michael@dundermifflin.com',
    password: 'password123',
    address: 'Dunder Mifflin Inc, Scranton Park, Nairobi West',
    packageId: 'kijani-eco',
    status: 'pending_activation',
    registeredAt: '2026-07-12T10:14:00Z',
    monthlyUsageGB: [0, 0, 0, 0, 0, 0],
    billingHistory: [
      { invoiceId: 'INV-FIRST', date: '2026-07-12', amount: 3000, status: 'pending' }
    ]
  },
  {
    id: 'sub-4',
    name: 'Ada Lovelace',
    email: 'ada@computing.org',
    password: 'password123',
    address: 'Analytical Engine Sector 5, Kisumu',
    packageId: 'kijani-giga',
    status: 'pending_activation',
    registeredAt: '2026-07-14T01:45:00Z',
    monthlyUsageGB: [0, 0, 0, 0, 0, 0],
    billingHistory: [
      { invoiceId: 'INV-FIRST2', date: '2026-07-14', amount: 9000, status: 'pending' }
    ]
  }
];
