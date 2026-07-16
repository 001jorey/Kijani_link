import { PackageId } from '../types';

export interface RouterConfig {
  ip: string;
  apiPort: number;
  webfigPort: number;
  user: string;
  pass: string;
  name: string;
  connected: boolean;
  lastSync: string;
  useSsl?: boolean;
  cpuLoad?: number;
  freeMemory?: number;
  uptime?: string;
}

export interface PppoeProfile {
  id: string;
  name: string;
  speedLimit: string;
  price: number;
  pool: string;
}

export interface PppoeSecret {
  username: string;
  pass: string;
  profileId: string;
  remoteAddress: string;
  status: 'active' | 'suspended';
  subscriberId?: string;
  uptime?: string;
  rxBytes?: number;
  txBytes?: number;
}

export interface HotspotProfile {
  id: string;
  name: string;
  speedLimit: string;
  timeLimit: string; // duration in text e.g. "1h", "1d", "7d", "30d"
  dataLimitMB: number; // 0 for unlimited
  price: number;
  validity: string;
  sharedUsers?: number; // Shared users limit, default 1
}

export interface HotspotVoucher {
  pin: string;
  profileId: string;
  status: 'unused' | 'active' | 'expired';
  macAddress?: string;
  usedAt?: string;
  timeUsedSeconds: number;
  dataUsedMB: number;
  price: number;
}

export interface HotspotActiveSession {
  id: string;
  pin: string;
  macAddress: string;
  ipAddress: string;
  uptime: string;
  rxBytes: number;
  txBytes: number;
  speedDown: number;
  speedUp: number;
  signal: number; // dBm
}

export interface MikrotikLog {
  timestamp: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
}

// Keys for LocalStorage
const ROUTER_CONFIG_KEY = 'mikrotik_router_config';
const PPPOE_PROFILES_KEY = 'mikrotik_pppoe_profiles';
const PPPOE_SECRETS_KEY = 'mikrotik_pppoe_secrets';
const HOTSPOT_PROFILES_KEY = 'mikrotik_hotspot_profiles';
const HOTSPOT_VOUCHERS_KEY = 'mikrotik_hotspot_vouchers';
const MIKROTIK_LOGS_KEY = 'mikrotik_logs';

const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  ip: '192.168.88.1',
  apiPort: 8728,
  webfigPort: 80,
  user: 'admin',
  pass: 'kijani_spine_2026',
  name: 'Kijani-Spine-CCR2004',
  connected: true,
  lastSync: new Date().toISOString()
};

const DEFAULT_PPPOE_PROFILES: PppoeProfile[] = [
  { id: 'profile-eco', name: 'Kijani Eco - 15M', speedLimit: '15M/15M', price: 3000, pool: 'pppoe-pool-1' },
  { id: 'profile-turbo', name: 'Kijani Turbo - 50M', speedLimit: '50M/50M', price: 5000, pool: 'pppoe-pool-1' },
  { id: 'profile-giga', name: 'Kijani Giga - 200M', speedLimit: '200M/200M', price: 9000, pool: 'pppoe-pool-2' },
  { id: 'profile-suspended', name: 'PPPoE Suspended', speedLimit: '64k/64k', price: 0, pool: 'suspended-pool' }
];

const DEFAULT_PPPOE_SECRETS: PppoeSecret[] = [
  { username: 'jane.doe@kijani.net', pass: 'secret993', profileId: 'profile-eco', remoteAddress: '10.100.1.12', status: 'active', subscriberId: 'sub-1', uptime: '12d 04h 32m', rxBytes: 45000000000, txBytes: 80000000000 },
  { username: 'john.smith@kijani.net', pass: 'secure884', profileId: 'profile-turbo', remoteAddress: '10.100.1.15', status: 'active', subscriberId: 'sub-2', uptime: '05d 18h 12m', rxBytes: 120000000000, txBytes: 190000000000 },
  { username: 'acme.corp@kijani.net', pass: 'enterprise777', profileId: 'profile-giga', remoteAddress: '10.100.2.5', status: 'active', subscriberId: 'sub-3', uptime: '22d 11h 05m', rxBytes: 940000000000, txBytes: 1540000000000 },
  { username: 'bob.marley@kijani.net', pass: 'onelove444', profileId: 'profile-eco', remoteAddress: '10.100.1.44', status: 'suspended', subscriberId: 'sub-4', uptime: '00d 00h 02m', rxBytes: 150000, txBytes: 85000 }
];

const DEFAULT_HOTSPOT_PROFILES: HotspotProfile[] = [
  { id: 'hs-1h', name: '1 Hour Express', speedLimit: '5M/5M', timeLimit: '1h', dataLimitMB: 500, price: 50, validity: '24h' },
  { id: 'hs-1d', name: '24 Hour Pass', speedLimit: '8M/8M', timeLimit: '1d', dataLimitMB: 5000, price: 150, validity: '2d' },
  { id: 'hs-7d', name: '7 Day Premium', speedLimit: '10M/10M', timeLimit: '7d', dataLimitMB: 25000, price: 600, validity: '14d' },
  { id: 'hs-30d', name: '30 Day Unlimited', speedLimit: '15M/15M', timeLimit: '30d', dataLimitMB: 0, price: 2000, validity: '30d' }
];

const DEFAULT_HOTSPOT_VOUCHERS: HotspotVoucher[] = [
  { pin: '448123', profileId: 'hs-1d', status: 'active', macAddress: '00:1E:64:99:A2:BC', usedAt: new Date(Date.now() - 3600000).toISOString(), timeUsedSeconds: 3600, dataUsedMB: 480, price: 150 },
  { pin: '982734', profileId: 'hs-1h', status: 'active', macAddress: '8C:11:F2:B4:77:E1', usedAt: new Date(Date.now() - 600000).toISOString(), timeUsedSeconds: 600, dataUsedMB: 120, price: 50 },
  { pin: '115482', profileId: 'hs-7d', status: 'unused', timeUsedSeconds: 0, dataUsedMB: 0, price: 600 },
  { pin: '883921', profileId: 'hs-30d', status: 'unused', timeUsedSeconds: 0, dataUsedMB: 0, price: 2000 },
  { pin: '554032', profileId: 'hs-1h', status: 'expired', macAddress: '44:D8:19:AA:CC:EF', usedAt: new Date(Date.now() - 86400000).toISOString(), timeUsedSeconds: 3600, dataUsedMB: 500, price: 50 }
];

const DEFAULT_LOGS: MikrotikLog[] = [
  { timestamp: new Date(Date.now() - 300000).toISOString(), level: 'info', message: 'MikroTik RouterOS API socket connected to 192.168.88.1:8728' },
  { timestamp: new Date(Date.now() - 280000).toISOString(), level: 'info', message: 'PPPoE server active on interface <ether2-lan>' },
  { timestamp: new Date(Date.now() - 240000).toISOString(), level: 'info', message: 'Hotspot service configured on bridge-hotspot' },
  { timestamp: new Date(Date.now() - 200000).toISOString(), level: 'info', message: 'PPPoE secret auth success: john.smith@kijani.net' },
  { timestamp: new Date(Date.now() - 150000).toISOString(), level: 'info', message: 'Hotspot MAC 00:1E:64:99:A2:BC authenticated using PIN 448123' },
  { timestamp: new Date(Date.now() - 100000).toISOString(), level: 'warning', message: 'Subscriber bob.marley@kijani.net profile changed to Suspended (Billing Overdue)' },
  { timestamp: new Date(Date.now() - 50000).toISOString(), level: 'info', message: 'Sync handshake: 4 active PPPoE secrets and 5 hotspot vouchers updated' }
];

export function getRouterConfig(): RouterConfig {
  const data = localStorage.getItem(ROUTER_CONFIG_KEY);
  if (!data) {
    localStorage.setItem(ROUTER_CONFIG_KEY, JSON.stringify(DEFAULT_ROUTER_CONFIG));
    return DEFAULT_ROUTER_CONFIG;
  }
  return JSON.parse(data);
}

export function saveRouterConfig(config: RouterConfig): void {
  localStorage.setItem(ROUTER_CONFIG_KEY, JSON.stringify(config));
}

export function getPppoeProfiles(): PppoeProfile[] {
  const data = localStorage.getItem(PPPOE_PROFILES_KEY);
  if (!data) {
    localStorage.setItem(PPPOE_PROFILES_KEY, JSON.stringify(DEFAULT_PPPOE_PROFILES));
    return DEFAULT_PPPOE_PROFILES;
  }
  return JSON.parse(data);
}

export function getPppoeSecrets(): PppoeSecret[] {
  const data = localStorage.getItem(PPPOE_SECRETS_KEY);
  if (!data) {
    localStorage.setItem(PPPOE_SECRETS_KEY, JSON.stringify(DEFAULT_PPPOE_SECRETS));
    return DEFAULT_PPPOE_SECRETS;
  }
  return JSON.parse(data);
}

export function savePppoeSecrets(secrets: PppoeSecret[]): void {
  localStorage.setItem(PPPOE_SECRETS_KEY, JSON.stringify(secrets));
}

export function getHotspotProfiles(): HotspotProfile[] {
  const data = localStorage.getItem(HOTSPOT_PROFILES_KEY);
  if (!data) {
    localStorage.setItem(HOTSPOT_PROFILES_KEY, JSON.stringify(DEFAULT_HOTSPOT_PROFILES));
    return DEFAULT_HOTSPOT_PROFILES;
  }
  return JSON.parse(data);
}

export function getHotspotVouchers(): HotspotVoucher[] {
  const data = localStorage.getItem(HOTSPOT_VOUCHERS_KEY);
  if (!data) {
    localStorage.setItem(HOTSPOT_VOUCHERS_KEY, JSON.stringify(DEFAULT_HOTSPOT_VOUCHERS));
    return DEFAULT_HOTSPOT_VOUCHERS;
  }
  return JSON.parse(data);
}

export function saveHotspotVouchers(vouchers: HotspotVoucher[]): void {
  localStorage.setItem(HOTSPOT_VOUCHERS_KEY, JSON.stringify(vouchers));
}

export function getMikrotikLogs(): MikrotikLog[] {
  const data = localStorage.getItem(MIKROTIK_LOGS_KEY);
  if (!data) {
    localStorage.setItem(MIKROTIK_LOGS_KEY, JSON.stringify(DEFAULT_LOGS));
    return DEFAULT_LOGS;
  }
  return JSON.parse(data);
}

export function addMikrotikLog(level: 'info' | 'warning' | 'critical', message: string): void {
  const logs = getMikrotikLogs();
  logs.unshift({ timestamp: new Date().toISOString(), level, message });
  localStorage.setItem(MIKROTIK_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
}

// PPPoE Actions
export function addPppoeSecret(secret: PppoeSecret): void {
  const secrets = getPppoeSecrets();
  secrets.push(secret);
  savePppoeSecrets(secrets);
  addMikrotikLog('info', `Added PPPoE secret for account: ${secret.username}`);
}

export function togglePppoeStatus(username: string): void {
  const secrets = getPppoeSecrets();
  const updated = secrets.map(sec => {
    if (sec.username === username) {
      const newStatus: 'active' | 'suspended' = sec.status === 'active' ? 'suspended' : 'active';
      const newProfile = newStatus === 'active' 
        ? (sec.profileId === 'profile-suspended' ? 'profile-eco' : sec.profileId) 
        : 'profile-suspended';
      
      addMikrotikLog('warning', `PPPoE secret [${username}] status changed to ${newStatus.toUpperCase()}. Applied profile speed limits.`);
      return { 
        ...sec, 
        status: newStatus,
        profileId: newProfile,
        uptime: newStatus === 'active' ? '00d 00h 01m' : undefined 
      } as PppoeSecret;
    }
    return sec;
  });
  savePppoeSecrets(updated);
}

export function deletePppoeSecret(username: string): void {
  const secrets = getPppoeSecrets();
  const filtered = secrets.filter(sec => sec.username !== username);
  savePppoeSecrets(filtered);
  addMikrotikLog('info', `Deleted PPPoE secret for account: ${username}`);
}

// Hotspot Actions
export function saveHotspotProfiles(profiles: HotspotProfile[]): void {
  localStorage.setItem(HOTSPOT_PROFILES_KEY, JSON.stringify(profiles));
}

export function addHotspotProfile(profile: HotspotProfile): void {
  const profiles = getHotspotProfiles();
  profiles.push(profile);
  saveHotspotProfiles(profiles);
  addMikrotikLog('info', `Created Hotspot profile: ${profile.name} [Speed: ${profile.speedLimit}, Shared: ${profile.sharedUsers || 1}]`);
}

export function updateHotspotProfile(profile: HotspotProfile): void {
  const profiles = getHotspotProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx !== -1) {
    profiles[idx] = profile;
    saveHotspotProfiles(profiles);
    addMikrotikLog('info', `Updated Hotspot profile: ${profile.name}`);
  }
}

export function deleteHotspotProfile(id: string): void {
  const profiles = getHotspotProfiles();
  const filtered = profiles.filter(p => p.id !== id);
  saveHotspotProfiles(filtered);
  addMikrotikLog('warning', `Deleted Hotspot profile ID: ${id}`);
}

export function generateHotspotVouchers(
  profileId: string, 
  quantity: number, 
  prefix: string, 
  pinLength: number = 6, 
  alphanumeric: boolean = true
): HotspotVoucher[] {
  const vouchers = getHotspotVouchers();
  const profile = getHotspotProfiles().find(p => p.id === profileId) || DEFAULT_HOTSPOT_PROFILES[0];
  const newVouchers: HotspotVoucher[] = [];

  const chars = alphanumeric 
    ? 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // high contrast, non-confusing chars
    : '0123456789';

  for (let i = 0; i < quantity; i++) {
    let pin = prefix;
    const remainingLength = Math.max(1, pinLength - prefix.length);
    do {
      let randomPart = '';
      for (let j = 0; j < remainingLength; j++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      pin = prefix + randomPart;
    } while (vouchers.some(v => v.pin === pin) || newVouchers.some(v => v.pin === pin));

    const voucher: HotspotVoucher = {
      pin,
      profileId,
      status: 'unused',
      timeUsedSeconds: 0,
      dataUsedMB: 0,
      price: profile.price
    };
    newVouchers.push(voucher);
    vouchers.unshift(voucher);
  }

  saveHotspotVouchers(vouchers);
  addMikrotikLog('info', `Bulk Generated ${quantity} Hotspot vouchers for profile [${profile.name}] with prefix "${prefix}"`);
  return newVouchers;
}

export function ejectHotspotSession(pin: string): void {
  const vouchers = getHotspotVouchers();
  const idx = vouchers.findIndex(v => v.pin === pin);
  if (idx !== -1) {
    const v = vouchers[idx];
    vouchers[idx] = {
      ...v,
      status: 'expired'
    };
    saveHotspotVouchers(vouchers);
    addMikrotikLog('warning', `Ejected active Hotspot session for MAC: ${v.macAddress || 'unknown'} (PIN: ${v.pin})`);
  }
}

export function activateHotspotVoucher(pin: string, mac: string): HotspotVoucher | null {
  const vouchers = getHotspotVouchers();
  const index = vouchers.findIndex(v => v.pin === pin);
  if (index === -1) return null;
  
  const voucher = vouchers[index];
  if (voucher.status !== 'unused') return voucher; // ALREADY ACTIVE OR EXPIRED

  vouchers[index] = {
    ...voucher,
    status: 'active',
    macAddress: mac,
    usedAt: new Date().toISOString()
  };

  saveHotspotVouchers(vouchers);
  addMikrotikLog('info', `Hotspot Voucher [PIN: ${pin}] successfully activated by MAC user [${mac}]`);
  return vouchers[index];
}

export function deleteHotspotVoucher(pin: string): void {
  const vouchers = getHotspotVouchers();
  const filtered = vouchers.filter(v => v.pin !== pin);
  saveHotspotVouchers(filtered);
  addMikrotikLog('info', `Deleted Hotspot Voucher PIN: ${pin}`);
}

// Generate Live Session stats mock
export function getActiveHotspotSessions(): HotspotActiveSession[] {
  const vouchers = getHotspotVouchers().filter(v => v.status === 'active');
  const ips = ['10.50.0.12', '10.50.1.99', '10.50.0.5', '10.50.3.11', '10.50.2.45'];
  
  return vouchers.map((v, idx) => {
    const elapsed = v.usedAt ? (Date.now() - new Date(v.usedAt).getTime()) / 1000 : 3600;
    const hrs = Math.floor(elapsed / 3600).toString().padStart(2, '0');
    const mins = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(elapsed % 60).toString().padStart(2, '0');
    
    // speed fluctuations
    const speedDown = parseFloat((1.5 + Math.random() * 4.5).toFixed(1));
    const speedUp = parseFloat((0.5 + Math.random() * 2.0).toFixed(1));
    
    return {
      id: `session-${v.pin}`,
      pin: v.pin,
      macAddress: v.macAddress || '00:00:00:00:00:00',
      ipAddress: ips[idx % ips.length],
      uptime: `${hrs}:${mins}:${secs}`,
      rxBytes: Math.round(v.dataUsedMB * 1024 * 1024) + Math.round(elapsed * 45000),
      txBytes: Math.round(v.dataUsedMB * 0.15 * 1024 * 1024) + Math.round(elapsed * 12000),
      speedDown,
      speedUp,
      signal: -45 - Math.floor(Math.random() * 30) // -45dBm to -75dBm
    };
  });
}

// Force full database sync from local billing to MikroTik router OS secrets
export function syncKijaniSubscribersToMikrotik(kijaniSubscribers: any[]): void {
  const currentSecrets = getPppoeSecrets();
  let addedCount = 0;
  let updatedCount = 0;

  const updatedSecrets = [...currentSecrets];

  kijaniSubscribers.forEach(sub => {
    if (sub.status === 'active') {
      const existingIdx = updatedSecrets.findIndex(sec => sec.subscriberId === sub.id || sec.username === sub.email);
      const mappedProfileId = sub.packageId === 'kijani-eco' ? 'profile-eco' : sub.packageId === 'kijani-turbo' ? 'profile-turbo' : 'profile-giga';
      
      if (existingIdx !== -1) {
        const sec = updatedSecrets[existingIdx];
        if (sec.profileId !== mappedProfileId || sec.status === 'suspended') {
          updatedSecrets[existingIdx] = {
            ...sec,
            subscriberId: sub.id,
            profileId: mappedProfileId,
            status: 'active'
          };
          updatedCount++;
        }
      } else {
        // Create new PPPoE Secret for this active subscriber
        const randomIp = `10.100.1.${Math.floor(50 + Math.random() * 200)}`;
        updatedSecrets.push({
          username: sub.email,
          pass: sub.password || 'kjl-' + Math.floor(1000 + Math.random() * 9000),
          profileId: mappedProfileId,
          remoteAddress: randomIp,
          status: 'active',
          subscriberId: sub.id,
          uptime: '00d 02h 15m',
          rxBytes: 500000000,
          txBytes: 1200000000
        });
        addedCount++;
      }
    } else if (sub.status === 'pending_activation') {
      // Ensure if any exists it's suspended
      const existingIdx = updatedSecrets.findIndex(sec => sec.subscriberId === sub.id || sec.username === sub.email);
      if (existingIdx !== -1) {
        updatedSecrets[existingIdx].status = 'suspended';
        updatedSecrets[existingIdx].profileId = 'profile-suspended';
        updatedCount++;
      }
    }
  });

  savePppoeSecrets(updatedSecrets);
  
  if (addedCount > 0 || updatedCount > 0) {
    addMikrotikLog('info', `Synched accounts: Added ${addedCount} new active PPPoE credentials, updated ${updatedCount} profiles to match billing.`);
  } else {
    addMikrotikLog('info', `Synched credentials: All PPPoE profiles are perfectly aligned with billing directories.`);
  }
}
