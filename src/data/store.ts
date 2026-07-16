import { Subscriber, SubscriberStatus, PackageId, SpeedTestResult } from '../types';
import { SEED_SUBSCRIBERS } from './seedSubscribers';

const STORAGE_KEY = 'kijani_link_subscribers';

// Initialize localStorage with seed data if empty
export function getSubscribers(): Subscriber[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SUBSCRIBERS));
    return SEED_SUBSCRIBERS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return SEED_SUBSCRIBERS;
  }
}

export function saveSubscribers(subscribers: Subscriber[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscribers));
}

export function addSubscriber(newSub: Omit<Subscriber, 'id' | 'status' | 'registeredAt' | 'monthlyUsageGB' | 'billingHistory'>): Subscriber {
  const subs = getSubscribers();
  const created: Subscriber = {
    ...newSub,
    id: `sub-${Date.now()}`,
    status: 'pending_activation',
    registeredAt: new Date().toISOString(),
    monthlyUsageGB: [0, 0, 0, 0, 0, 0],
    billingHistory: [
      {
        invoiceId: `INV-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        amount: newSub.packageId === 'kijani-eco' ? 3000 : newSub.packageId === 'kijani-turbo' ? 5000 : 9000,
        status: 'pending'
      }
    ]
  };
  subs.push(created);
  saveSubscribers(subs);
  return created;
}

export function updateSubscriberStatus(id: string, status: SubscriberStatus): Subscriber[] {
  const subs = getSubscribers();
  const updated = subs.map(sub => {
    if (sub.id === id) {
      return {
        ...sub,
        status,
        activatedAt: status === 'active' ? new Date().toISOString() : undefined,
        // Fill initial mock usage for active users
        monthlyUsageGB: status === 'active' ? [45, 80, 95, 110, 105, 120] : sub.monthlyUsageGB
      };
    }
    return sub;
  });
  saveSubscribers(updated);
  return updated;
}

export function saveSpeedTest(id: string, result: SpeedTestResult): Subscriber[] {
  const subs = getSubscribers();
  const updated = subs.map(sub => {
    if (sub.id === id) {
      return {
        ...sub,
        currentSpeedTest: result
      };
    }
    return sub;
  });
  saveSubscribers(updated);
  return updated;
}

export function payInvoice(subscriberId: string, invoiceId: string): Subscriber[] {
  const subs = getSubscribers();
  const updated = subs.map(sub => {
    if (sub.id === subscriberId) {
      const updatedHistory = sub.billingHistory.map(inv => {
        if (inv.invoiceId === invoiceId) {
          return { ...inv, status: 'paid' as const };
        }
        return inv;
      });
      return {
        ...sub,
        billingHistory: updatedHistory
      };
    }
    return sub;
  });
  saveSubscribers(updated);
  return updated;
}
