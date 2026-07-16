import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle, Clock, Zap, ShieldAlert, Check, X, Menu, LogOut, Leaf,
  MapPin, AlertTriangle, RefreshCw, Server, Terminal, Search,
  Wifi, Key, List, Plus, Trash2, Ban, Radio, Settings, ShieldCheck,
  Database, HardDrive, Cpu, FileText, Smartphone, Link, Play, Activity, Code, Laptop
} from 'lucide-react';
import { Subscriber } from '../types';
import { INTERNET_PACKAGES } from '../data/packages';
import { updateSubscriberStatus, getSubscribers } from '../data/store';
import { 
  getRouterConfig, saveRouterConfig, getPppoeProfiles, getPppoeSecrets, 
  getHotspotProfiles, getHotspotVouchers, getMikrotikLogs, addMikrotikLog, 
  addPppoeSecret, togglePppoeStatus, deletePppoeSecret, generateHotspotVouchers, 
  deleteHotspotVoucher, getActiveHotspotSessions, syncKijaniSubscribersToMikrotik,
  addHotspotProfile, updateHotspotProfile, deleteHotspotProfile, ejectHotspotSession,
  RouterConfig, PppoeSecret, PppoeProfile, HotspotProfile, HotspotVoucher, HotspotActiveSession, MikrotikLog
} from '../data/mikrotikStore';

interface AdminDashboardProps {
  onLogout: () => void;
  onRefreshData: () => void;
}

type TabType = 'subscribers' | 'pppoe' | 'hotspot' | 'router' | 'sync';

export default function AdminDashboard({ onLogout, onRefreshData }: AdminDashboardProps) {
  // Core subscriber directory state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Active Control Panel Tab
  const [activeTab, setActiveTab] = useState<TabType>('subscribers');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // MikroTik states
  const [routerConfig, setRouterConfig] = useState<RouterConfig | null>(null);
  const [pppoeProfiles, setPppoeProfiles] = useState<PppoeProfile[]>([]);
  const [pppoeSecrets, setPppoeSecrets] = useState<PppoeSecret[]>([]);
  const [hotspotProfiles, setHotspotProfiles] = useState<HotspotProfile[]>([]);
  const [hotspotVouchers, setHotspotVouchers] = useState<HotspotVoucher[]>([]);
  const [hotspotSessions, setHotspotSessions] = useState<HotspotActiveSession[]>([]);
  const [routerLogs, setRouterLogs] = useState<MikrotikLog[]>([]);

  // New PPPoE Secret form state
  const [newPppUser, setNewPppUser] = useState('');
  const [newPppPass, setNewPppPass] = useState('');
  const [newPppProfile, setNewPppProfile] = useState('');
  const [newPppIp, setNewPppIp] = useState('');

  // Voucher generator form state
  const [voucherProfile, setVoucherProfile] = useState('');
  const [voucherQty, setVoucherQty] = useState(10);
  const [voucherPrefix, setVoucherPrefix] = useState('KJL');

  // Router config form state
  const [routerIp, setRouterIp] = useState('');
  const [routerApiPort, setRouterApiPort] = useState(8728);
  const [routerWebPort, setRouterWebPort] = useState(80);
  const [routerUser, setRouterUser] = useState('');
  const [routerPass, setRouterPass] = useState('');
  const [routerModel, setRouterModel] = useState('');
  const [routerUseSsl, setRouterUseSsl] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Active Router Resource States (live telemetry)
  const [cpuLoad, setCpuLoad] = useState(8);
  const [freeMemory, setFreeMemory] = useState(1842); // in MB
  const [uptime, setUptime] = useState('04d 12h 45m');

  // Connection Handshake Diagnostics State
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [testSteps, setTestSteps] = useState<{ label: string; status: 'pending' | 'loading' | 'success' | 'error' }[]>([]);
  const [handshakeSuccess, setHandshakeSuccess] = useState<boolean | null>(null);

  // Hotspot Package Profile Creator State
  const [newHsName, setNewHsName] = useState('');
  const [newHsTimeLimit, setNewHsTimeLimit] = useState('1h');
  const [newHsSpeedLimit, setNewHsSpeedLimit] = useState('5M/5M');
  const [newHsPrice, setNewHsPrice] = useState(50);
  const [newHsSharedUsers, setNewHsSharedUsers] = useState(1);
  const [newHsDataLimit, setNewHsDataLimit] = useState(0); // 0 = unlimited
  const [newHsValidity, setNewHsValidity] = useState('24h');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [isProvisioningProfileId, setIsProvisioningProfileId] = useState<string | null>(null);

  // Smart Hotspot Setup Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardInterface, setWizardInterface] = useState('ether3-hotspot');
  const [wizardIpPool, setWizardIpPool] = useState('10.5.50.1/24');
  const [wizardDnsName, setWizardDnsName] = useState('login.kijanilink.net');
  const [wizardDnsServers, setWizardDnsServers] = useState('1.1.1.1, 8.8.8.8');
  const [wizardIsProvisioning, setWizardIsProvisioning] = useState(false);
  const [wizardSuccess, setWizardSuccess] = useState(false);
  const [wizardLogs, setWizardLogs] = useState<string[]>([]);

  // Bulk Voucher Custom Parameters
  const [voucherPinLength, setVoucherPinLength] = useState(6);
  const [voucherAlphanumeric, setVoucherAlphanumeric] = useState(true);
  const [showPrintableVouchers, setShowPrintableVouchers] = useState(false);
  const [newlyGeneratedVouchers, setNewlyGeneratedVouchers] = useState<HotspotVoucher[]>([]);


  // API Sync Bridge states
  const [selectedSubscribersForSync, setSelectedSubscribersForSync] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeSyncSubId, setActiveSyncSubId] = useState<string | null>(null);
  const [apiGatewayUrl, setApiGatewayUrl] = useState('https://192.168.88.1/rest');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncLogs, setSyncLogs] = useState<{ id: string; type: 'info' | 'success' | 'warning' | 'error' | 'request'; text: string; timestamp: string }[]>([
    { id: '1', type: 'info', text: 'Sync Bridge initialized. REST API Engine ready.', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', type: 'info', text: 'Handshake settings: RouterOS v7.12 REST compatibility detected.', timestamp: new Date(Date.now() - 3500000).toISOString() }
  ]);
  const [currentApiStep, setCurrentApiStep] = useState<string | null>(null);
  const [apiDebuggerData, setApiDebuggerData] = useState<{
    method: string;
    url: string;
    headers: any;
    body: string;
    status: string;
    response: string;
  } | null>({
    method: 'GET',
    url: 'https://192.168.88.1/rest/ppp/profile',
    headers: {
      'Authorization': 'Basic YWRtaW46a2lqYW5pX3NwaW5lXzIwMjY=',
      'Accept': 'application/json'
    },
    body: 'Empty (Query)',
    status: '200 OK',
    response: JSON.stringify({
      name: 'profile-turbo',
      "rate-limit": "50M/50M",
      "local-address": "10.100.1.1",
      "remote-address": "pppoe-pool-1",
      comment: "Configured via API Bridge"
    }, null, 2)
  });

  // Load all databases
  const loadStoreData = () => {
    const subs = getSubscribers();
    setSubscribers(subs);
    
    const rConfig = getRouterConfig();
    setRouterConfig(rConfig);
    setRouterIp(rConfig.ip);
    setRouterApiPort(rConfig.apiPort);
    setRouterWebPort(rConfig.webfigPort);
    setRouterUser(rConfig.user);
    setRouterPass(rConfig.pass);
    setRouterModel(rConfig.name);
    setRouterUseSsl(rConfig.useSsl ?? false);
    setCpuLoad(rConfig.cpuLoad ?? 8);
    setFreeMemory(rConfig.freeMemory ?? 1842);
    setUptime(rConfig.uptime ?? '04d 12h 45m');

    const pProfiles = getPppoeProfiles();
    setPppoeProfiles(pProfiles);
    if (pProfiles.length > 0 && !newPppProfile) {
      setNewPppProfile(pProfiles[0].id);
    }

    const pSecrets = getPppoeSecrets();
    setPppoeSecrets(pSecrets);

    const hProfiles = getHotspotProfiles();
    setHotspotProfiles(hProfiles);
    if (hProfiles.length > 0 && !voucherProfile) {
      setVoucherProfile(hProfiles[0].id);
    }

    const hVouchers = getHotspotVouchers();
    setHotspotVouchers(hVouchers);

    const hSessions = getActiveHotspotSessions();
    setHotspotSessions(hSessions);

    const logs = getMikrotikLogs();
    setRouterLogs(logs);
  };

  useEffect(() => {
    loadStoreData();

    // Set interval to simulate active hotspot speed traffic and keep sessions alive
    const sessionTimer = setInterval(() => {
      setHotspotSessions(getActiveHotspotSessions());
    }, 5000);

    return () => clearInterval(sessionTimer);
  }, []);

  // Sync Kijani Billing directory directly with the MikroTik secrets pool
  const handleBillingSync = () => {
    syncKijaniSubscribersToMikrotik(subscribers);
    loadStoreData();
    addMikrotikLog('info', 'Triggered manual billing directory audit. Secrets updated.');
  };

  // Execute step-by-step REST API provisioning sequence
  const executeApiProvisioning = async (sub: Subscriber) => {
    setActiveSyncSubId(sub.id);
    const subEmail = sub.email;
    const subPass = sub.password || 'kjl-' + Math.floor(1000 + Math.random() * 9000);
    const subPlan = sub.packageId === 'kijani-eco' ? 'profile-eco' : sub.packageId === 'kijani-turbo' ? 'profile-turbo' : 'profile-giga';
    const subSpeed = sub.packageId === 'kijani-eco' ? '15M/15M' : sub.packageId === 'kijani-turbo' ? '50M/50M' : '200M/200M';
    const subIp = `10.100.1.${Math.floor(50 + Math.random() * 200)}`;

    const addLog = (type: 'info' | 'success' | 'warning' | 'error' | 'request', text: string) => {
      setSyncLogs(prev => [
        { id: Date.now() + Math.random().toString(), type, text, timestamp: new Date().toISOString() },
        ...prev
      ]);
    };

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    try {
      // ---- STEP 1: VERIFY/CREATE PPPoE PROFILE ----
      addLog('request', `[REST GET] Verifying RouterOS profile [${subPlan}] is provisioned at endpoint...`);
      setCurrentApiStep(`GET /ppp/profile/${subPlan}`);
      setApiDebuggerData({
        method: 'GET',
        url: `${apiGatewayUrl}/ppp/profile/${subPlan}`,
        headers: {
          'Authorization': `Basic ${btoa(routerUser + ':' + routerPass)}`,
          'Accept': 'application/json'
        },
        body: 'Empty (Query)',
        status: '200 OK',
        response: JSON.stringify({
          name: subPlan,
          "rate-limit": subSpeed,
          "local-address": "10.100.1.1",
          "remote-address": subPlan === 'profile-giga' ? 'pppoe-pool-2' : 'pppoe-pool-1',
          comment: "Auto-synced from Billing"
        }, null, 2)
      });
      await delay(850);
      addLog('success', `PPP profile "${subPlan}" verified. Rate limits: ${subSpeed}.`);

      // ---- STEP 2: CREATE PPPoE SECRET ----
      addLog('request', `[REST POST] Provisioning PPPoE interface credentials for user "${subEmail}"...`);
      setCurrentApiStep('POST /ppp/secret');
      const pppPayload = {
        name: subEmail,
        password: subPass,
        profile: subPlan,
        "remote-address": subIp,
        comment: `Auto-Provisioned for ${sub.name} (SubID: ${sub.id})`
      };
      setApiDebuggerData({
        method: 'POST',
        url: `${apiGatewayUrl}/ppp/secret`,
        headers: {
          'Authorization': `Basic ${btoa(routerUser + ':' + routerPass)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pppPayload, null, 2),
        status: '201 Created',
        response: JSON.stringify({
          ...pppPayload,
          ".id": `*api-sec-${Math.floor(100 + Math.random() * 899)}`,
          "disabled": "false",
          "last-caller-id": ""
        }, null, 2)
      });
      await delay(1100);

      // Save secret locally
      addPppoeSecret({
        username: subEmail,
        pass: subPass,
        profileId: subPlan,
        remoteAddress: subIp,
        status: 'active',
        subscriberId: sub.id,
        uptime: '00d 00h 01m',
        rxBytes: 50000,
        txBytes: 120000
      });
      addLog('success', `PPPoE Account created. Assigned Tunnel static IP: ${subIp}.`);

      // ---- STEP 3: CONFIGURE HOTSPOT SPEED PROFILE ----
      addLog('request', `[REST PUT] Creating Hotspot profile hs-${subPlan} to sync traffic rules...`);
      setCurrentApiStep(`PUT /ip/hotspot/user/profile/hs-${subPlan}`);
      const hsProfilePayload = {
        name: `hs-${subPlan}`,
        "rate-limit": subSpeed,
        "shared-users": "1"
      };
      setApiDebuggerData({
        method: 'PUT',
        url: `${apiGatewayUrl}/ip/hotspot/user/profile/hs-${subPlan}`,
        headers: {
          'Authorization': `Basic ${btoa(routerUser + ':' + routerPass)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hsProfilePayload, null, 2),
        status: '200 OK',
        response: JSON.stringify({
          ...hsProfilePayload,
          ".id": `*api-hsp-${Math.floor(10 + Math.random() * 89)}`
        }, null, 2)
      });
      await delay(750);
      addLog('success', `Hotspot User Profile "hs-${subPlan}" configured with symmetric cap ${subSpeed}.`);

      // ---- STEP 4: CONFIGURE HOTSPOT BINDING USER ----
      addLog('request', `[REST POST] Creating Hotspot User record for mobile login failover / bypass...`);
      setCurrentApiStep('POST /ip/hotspot/user');
      const hsUserPayload = {
        name: subEmail,
        password: subPass,
        profile: `hs-${subPlan}`,
        comment: `Kijani Link Fiber Failover - ${sub.name}`
      };
      setApiDebuggerData({
        method: 'POST',
        url: `${apiGatewayUrl}/ip/hotspot/user`,
        headers: {
          'Authorization': `Basic ${btoa(routerUser + ':' + routerPass)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hsUserPayload, null, 2),
        status: '201 Created',
        response: JSON.stringify({
          ...hsUserPayload,
          ".id": `*api-hsu-${Math.floor(100 + Math.random() * 899)}`,
          "disabled": "false"
        }, null, 2)
      });
      await delay(950);
      addLog('success', `Hotspot User created. Sync completed successfully.`);

      addLog('success', `[SUCCESS] Autoprovisioning bridge sequence completed for client ${sub.name}!`);
      addMikrotikLog('info', `REST API HANDSHAKE SUCCESS: Auto-provisioned subscriber [${sub.name}] on MikroTik CCR.`);
    } catch (err: any) {
      addLog('error', `[REST ERROR] Handshake failed for ${sub.name}: ${err?.message || 'Gateway connection lost.'}`);
      addMikrotikLog('critical', `REST API SYNC FAILURE: Unable to auto-provision credentials for ${subEmail}.`);
    } finally {
      setActiveSyncSubId(null);
      setCurrentApiStep(null);
    }
  };

  const handleBulkSyncApi = async () => {
    if (selectedSubscribersForSync.length === 0) return;
    setIsSyncing(true);
    const toSync = subscribers.filter(s => selectedSubscribersForSync.includes(s.id));
    
    for (const sub of toSync) {
      await executeApiProvisioning(sub);
    }
    
    setIsSyncing(false);
    setSelectedSubscribersForSync([]);
    loadStoreData();
  };

  const toggleSelectAllSync = (activeSubsList: Subscriber[]) => {
    if (selectedSubscribersForSync.length === activeSubsList.length) {
      setSelectedSubscribersForSync([]);
    } else {
      setSelectedSubscribersForSync(activeSubsList.map(s => s.id));
    }
  };

  const toggleSelectSub = (id: string) => {
    setSelectedSubscribersForSync(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Trigger subscriber activation
  const handleActivateSubscriber = (id: string, name: string) => {
    setProcessingId(id);
    setTimeout(() => {
      const updated = updateSubscriberStatus(id, 'active');
      setSubscribers(updated);
      setProcessingId(null);
      onRefreshData();

      // Mirror directly to MikroTik secret list
      syncKijaniSubscribersToMikrotik(updated);
      loadStoreData();

      addMikrotikLog('info', `Approved Kijani Link line subscription for ${name}. Automatically provisioned corresponding PPPoE network credentials.`);
      
      if (autoSyncEnabled) {
        // Trigger background REST API sequence
        const targetSub = updated.find(s => s.id === id);
        if (targetSub) {
          executeApiProvisioning(targetSub);
        }
      }
    }, 1000);
  };

  // Trigger subscriber rejection
  const handleRejectSubscriber = (id: string, name: string) => {
    setProcessingId(id);
    setTimeout(() => {
      const updated = updateSubscriberStatus(id, 'rejected');
      setSubscribers(updated);
      setProcessingId(null);
      onRefreshData();

      syncKijaniSubscribersToMikrotik(updated);
      loadStoreData();

      addMikrotikLog('warning', `Rejected / Suspended connection application for client ${name}. Revoked router-side credentials.`);
    }, 1000);
  };

  // Add PPPoE secret manually
  const handleAddPppoeSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPppUser || !newPppPass) return;

    addPppoeSecret({
      username: newPppUser,
      pass: newPppPass,
      profileId: newPppProfile,
      remoteAddress: newPppIp || `10.100.1.${Math.floor(100 + Math.random() * 150)}`,
      status: 'active',
      uptime: '00d 00h 01m'
    });

    setNewPppUser('');
    setNewPppPass('');
    setNewPppIp('');
    loadStoreData();
  };

  // Toggle secret state (Suspend / Activate)
  const handleTogglePppoe = (username: string) => {
    togglePppoeStatus(username);
    loadStoreData();
  };

  // Delete secret
  const handleDeletePppoe = (username: string) => {
    if (confirm(`Are you sure you want to delete PPPoE user "${username}"?`)) {
      deletePppoeSecret(username);
      loadStoreData();
    }
  };

  // Hotspot Voucher Generator
  const handleGenerateVouchersSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVouchers = generateHotspotVouchers(voucherProfile, voucherQty, voucherPrefix, voucherPinLength, voucherAlphanumeric);
    setNewlyGeneratedVouchers(newVouchers);
    setShowPrintableVouchers(true);
    loadStoreData();
  };

  // Delete Voucher
  const handleDeleteVoucher = (pin: string) => {
    deleteHotspotVoucher(pin);
    loadStoreData();
  };

  // Trigger interactive diagnostic handshake for the Router Connection
  const triggerConnectionTest = async () => {
    setIsTestingConn(true);
    setHandshakeSuccess(null);
    
    const steps: { label: string; status: 'pending' | 'loading' | 'success' | 'error' }[] = [
      { label: 'Ping Latency Check', status: 'loading' },
      { label: 'REST SSL Handshake verification', status: 'pending' },
      { label: 'RouterOS Version check', status: 'pending' },
      { label: 'System Resource Sync', status: 'pending' }
    ];
    setTestSteps(steps);
    setActiveStepIdx(0);
    
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    
    // Step 1: Ping
    addMikrotikLog('info', `Testing ping latency to gateway host [${routerIp}]...`);
    await delay(750);
    steps[0].status = 'success';
    steps[1].status = 'loading';
    setTestSteps([...steps]);
    setActiveStepIdx(1);
    
    // Step 2: REST SSL Handshake
    addMikrotikLog('info', `Checking REST SSL authentication on port ${routerApiPort} with user [${routerUser}]...`);
    await delay(900);
    steps[1].status = 'success';
    steps[2].status = 'loading';
    setTestSteps([...steps]);
    setActiveStepIdx(2);
    
    // Step 3: RouterOS Version Check
    const rosModel = routerIp.startsWith('10.') || routerIp.startsWith('192.168.100')
      ? 'RB5009UG+S+IN - RouterOS v7.14.2'
      : 'CCR2004-16G-2S+ - RouterOS v7.12';
    setRouterModel(rosModel);
    addMikrotikLog('info', `Authenticated successfully. Detected device: ${rosModel}`);
    await delay(800);
    steps[2].status = 'success';
    steps[3].status = 'loading';
    setTestSteps([...steps]);
    setActiveStepIdx(3);
    
    // Step 4: System Resource Sync
    const liveCpu = Math.floor(3 + Math.random() * 12);
    const liveMem = Math.floor(1600 + Math.random() * 400);
    const liveUptime = `${Math.floor(1 + Math.random() * 9)}d ${Math.floor(1 + Math.random() * 23)}h ${Math.floor(1 + Math.random() * 59)}m`;
    
    setCpuLoad(liveCpu);
    setFreeMemory(liveMem);
    setUptime(liveUptime);
    
    await delay(600);
    steps[3].status = 'success';
    setTestSteps([...steps]);
    setActiveStepIdx(-1);
    setHandshakeSuccess(true);
    setIsTestingConn(false);
    
    // Save settings and connection state to localStorage
    const newConfig = {
      ip: routerIp,
      apiPort: routerApiPort,
      webfigPort: routerWebPort,
      user: routerUser,
      pass: routerPass,
      name: rosModel,
      connected: true,
      lastSync: new Date().toISOString(),
      useSsl: routerUseSsl,
      cpuLoad: liveCpu,
      freeMemory: liveMem,
      uptime: liveUptime
    };
    saveRouterConfig(newConfig);
    setRouterConfig(newConfig);
    addMikrotikLog('info', `Synchronized and saved connection settings for Router: ${rosModel} (${routerIp})`);
    
    loadStoreData();
  };

  // Hotspot Package Actions
  const handleCreateHotspotProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHsName) return;
    
    const profileId = editingProfileId || `hs-${newHsName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-3)}`;
    
    const newProfile: HotspotProfile = {
      id: profileId,
      name: newHsName,
      speedLimit: newHsSpeedLimit,
      timeLimit: newHsTimeLimit,
      dataLimitMB: newHsDataLimit,
      price: newHsPrice,
      validity: newHsValidity,
      sharedUsers: newHsSharedUsers
    };
    
    if (editingProfileId) {
      updateHotspotProfile(newProfile);
      setEditingProfileId(null);
    } else {
      addHotspotProfile(newProfile);
    }
    
    // Reset Form
    setNewHsName('');
    setNewHsTimeLimit('1h');
    setNewHsSpeedLimit('5M/5M');
    setNewHsPrice(50);
    setNewHsSharedUsers(1);
    setNewHsDataLimit(0);
    setNewHsValidity('24h');
    
    loadStoreData();
  };

  const handleEditProfileInit = (prof: HotspotProfile) => {
    setEditingProfileId(prof.id);
    setNewHsName(prof.name);
    setNewHsTimeLimit(prof.timeLimit);
    setNewHsSpeedLimit(prof.speedLimit);
    setNewHsPrice(prof.price);
    setNewHsSharedUsers(prof.sharedUsers || 1);
    setNewHsDataLimit(prof.dataLimitMB);
    setNewHsValidity(prof.validity);
  };

  const handleDeleteProfileClick = (id: string) => {
    if (confirm(`Are you sure you want to delete Hotspot profile: ${id}?`)) {
      deleteHotspotProfile(id);
      loadStoreData();
    }
  };

  const handleProvisionProfileToRouter = async (profile: HotspotProfile) => {
    setIsProvisioningProfileId(profile.id);
    addMikrotikLog('info', `[REST POST] Sending request to create user profile [${profile.name}] inside RouterOS...`);
    
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    await delay(1200);
    
    addMikrotikLog('info', `RouterOS API response 201 Created. Hotspot user profile [${profile.name}] synced with speedlimit: ${profile.speedLimit}`);
    setIsProvisioningProfileId(null);
    
    alert(`Successfully provisioned Hotspot profile "${profile.name}" to MikroTik RouterOS!`);
  };

  // Setup Wizard Actions
  const handleStartWizardProvisioning = async () => {
    setWizardIsProvisioning(true);
    setWizardLogs([]);
    setWizardSuccess(false);
    
    const logs: string[] = [];
    const logAdd = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setWizardLogs([...logs]);
    };
    
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    
    logAdd(`Compiling shell instructions for bridge interface: ${wizardInterface}...`);
    await delay(600);
    logAdd(`Script command: /ip pool add name=hs-pool-${wizardInterface} ranges=${wizardIpPool.replace('.1/24', '.10')}-${wizardIpPool.replace('.1/24', '.254')}`);
    await delay(500);
    logAdd(`Script command: /ip dhcp-server add name=hs-dhcp-${wizardInterface} interface=${wizardInterface} address-pool=hs-pool-${wizardInterface} disabled=no`);
    await delay(500);
    logAdd(`Setting up Hotspot service on ${wizardInterface} with gateway IP ${wizardIpPool.split('/')[0]}...`);
    await delay(700);
    logAdd(`Configuring DNS server redirections to: ${wizardDnsServers}`);
    await delay(600);
    logAdd(`Configuring DNS name landing page: ${wizardDnsName}`);
    await delay(500);
    logAdd(`Running: /ip hotspot setup`);
    logAdd(`Setting HTML login directory: flash/hotspot`);
    await delay(800);
    logAdd(`Provisioning security profile and default templates...`);
    await delay(600);
    logAdd(`SUCCESS: Hotspot Server "${wizardInterface}-service" has been compiled and provisioned successfully!`);
    
    addMikrotikLog('info', `Successfully executed automated Hotspot Setup Wizard on interface [${wizardInterface}]`);
    setWizardSuccess(true);
    setWizardIsProvisioning(false);
  };

  // Eject Active Session
  const handleEjectSessionClick = (pin: string) => {
    if (confirm(`Force disconnect Hotspot session with PIN ${pin}?`)) {
      ejectHotspotSession(pin);
      loadStoreData();
    }
  };

  // Download Mock CSV of generated vouchers
  const handleDownloadCsv = (vouchersToExport: HotspotVoucher[]) => {
    const headers = 'PIN,Profile,Price (KSh),Status\n';
    const rows = vouchersToExport.map(v => `${v.pin},${v.profileId},${v.price},${v.status}`).join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Kijani_Hotspot_Vouchers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addMikrotikLog('info', `Exported ${vouchersToExport.length} Hotspot vouchers as CSV file.`);
  };

  // Update router settings
  const handleUpdateRouterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRouterConfig({
      ip: routerIp,
      apiPort: routerApiPort,
      webfigPort: routerWebPort,
      user: routerUser,
      pass: routerPass,
      name: routerModel || 'Kijani-Spine-CCR2004',
      connected: true,
      lastSync: new Date().toISOString(),
      useSsl: routerUseSsl,
      cpuLoad,
      freeMemory,
      uptime
    });
    addMikrotikLog('info', `Modified MikroTik Router settings to point to IP address: ${routerIp}`);
    setConfigSuccess(true);
    setTimeout(() => setConfigSuccess(false), 3000);
    loadStoreData();
  };

  // Search filter
  const filteredSubscribers = subscribers.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingSubscribers = filteredSubscribers.filter(sub => sub.status === 'pending_activation');
  const activeSubscribers = filteredSubscribers.filter(sub => sub.status === 'active');

  return (
    <div className="bg-[#060814] text-slate-100 min-h-screen relative overflow-hidden font-sans flex flex-col lg:flex-row w-full antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Deep Perspective Background Grid & Glowing 3D Spheres */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px] opacity-25 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_80%)] pointer-events-none" />

      {/* Ambient background orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-pink-500/5 blur-[80px] pointer-events-none" />

      {/* Desktop Sidebar (Left) */}
      <aside className="hidden lg:flex fixed left-6 top-6 bottom-6 w-64 z-40 rounded-3xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-6 flex-col justify-between overflow-y-auto">
        <div className="space-y-8">
          {/* Sidebar Logo */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/10 border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <Wifi className="w-5 h-5 text-emerald-400/20 absolute animate-pulse" />
            </div>
            <div>
              <h2 className="font-display font-black text-sm tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Kijani Link
              </h2>
              <span className="block text-[8px] tracking-widest text-emerald-400 uppercase font-mono font-bold -mt-0.5">
                CONTROL ROOM
              </span>
            </div>
          </div>

          {/* Navigation Tabs List */}
          <nav className="space-y-2">
            {[
              { id: 'subscribers', label: 'Client Verification', icon: Users, count: pendingSubscribers.length },
              { id: 'pppoe', label: 'PPPoE Secrets', icon: Key },
              { id: 'hotspot', label: 'Hotspot Vouchers', icon: Wifi },
              { id: 'sync', label: 'REST API Sync', icon: Activity },
              { id: 'router', label: 'RouterOS Config', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-xs border text-left cursor-pointer relative ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/15 to-blue-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_8px_20px_rgba(16,185,129,0.1)]'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110 text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {item.count}
                    </span>
                  )}
                  {isActive && !item.count && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Foot */}
        <div className="space-y-4 pt-6 border-t border-white/[0.06]">
          <div className="px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[10px] text-slate-500 font-mono">ACTIVE BACKBONE</p>
            <p className="text-[11px] text-emerald-400 font-bold truncate">RouterOS v7.12</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Control Center</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-4 left-4 right-4 h-16 rounded-2xl backdrop-blur-xl bg-slate-950/40 border border-white/10 flex items-center justify-between px-4 z-40 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 border border-white/10">
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-display font-black text-sm tracking-tight text-white">
            Kijani Control Room
          </span>
        </div>
        
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-slate-950/90 backdrop-blur-md pt-24 px-6 space-y-6">
          <nav className="space-y-3">
            {[
              { id: 'subscribers', label: 'Client Verification', icon: Users, count: pendingSubscribers.length },
              { id: 'pppoe', label: 'PPPoE Secrets', icon: Key },
              { id: 'hotspot', label: 'Hotspot Vouchers', icon: Wifi },
              { id: 'sync', label: 'REST API Sync', icon: Activity },
              { id: 'router', label: 'RouterOS Config', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-semibold text-sm border text-left ${
                    isActive
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-transparent border-transparent text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5 text-emerald-400" />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          
          <div className="pt-6 border-t border-white/10">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              Exit Control Center
            </button>
          </div>
        </div>
      )}

      {/* Main Scrollable Content */}
      <main className="flex-1 lg:ml-72 p-4 sm:p-6 lg:p-8 pt-24 lg:pt-8 z-10 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* TOP PANEL: SYSTEM STATE HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/[0.06] pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] tracking-wider font-bold uppercase shadow-sm">
                MikroTik ISP Billing & Provisioning Panel
              </span>
              <span className="text-slate-400 text-xs font-mono flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1 rounded border border-white/[0.06]">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                Router: <span className="text-slate-200 font-semibold">{routerConfig?.name || 'CCR2004'}</span> ({routerConfig?.ip})
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2 font-display">
              Kijani Link Spine Control Room
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Configure RouterOS Hotspot systems, authorize PPPoE accounts, generate speed-limit vouchers, and sync active billing cycles.
            </p>
          </div>
          <div className="flex items-center gap-3 self-end md:self-center">
            <button
              onClick={handleBillingSync}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#060814] font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/10"
              title="Synchronize subscribers to RouterOS Secrets"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              Sync Router Secrets
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          
          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] p-5 rounded-2xl flex items-center justify-between shadow-xl hover:bg-white/[0.04] transition-all">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Fiber Subscribers</p>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1 font-display">{subscribers.length}</h3>
              <p className="text-slate-500 text-[10px] font-mono mt-0.5">Physical connection lines</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] p-5 rounded-2xl flex items-center justify-between shadow-xl hover:bg-white/[0.04] transition-all">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">PPPoE Accounts</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 font-display">
                {pppoeSecrets.filter(s => s.status === 'active').length}
              </h3>
              <p className="text-slate-500 text-[10px] font-mono mt-0.5">Active tunnels matching plans</p>
            </div>
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-teal-400">
              <Key className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] p-5 rounded-2xl flex items-center justify-between shadow-xl hover:bg-white/[0.04] transition-all">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Hotspot Vouchers</p>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1 font-display">{hotspotVouchers.filter(v => v.status === 'unused').length}</h3>
              <p className="text-slate-500 text-[10px] font-mono mt-0.5">Unused pins ready for sale</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] p-5 rounded-2xl flex items-center justify-between shadow-xl hover:bg-white/[0.04] transition-all">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">MAC Session Traffic</p>
              <h3 className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1 font-display">{hotspotSessions.length}</h3>
              <p className="text-slate-500 text-[10px] font-mono mt-0.5">Connected hotspot terminals</p>
            </div>
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400">
              <Wifi className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

        </div>

        {/* TAB CONTENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT/MIDDLE: Main active tab controls (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* TAB 1: SUBSCRIBER DIRECTORY */}
            {activeTab === 'subscribers' && (
              <div className="space-y-8">
                
                {/* Pending Verification card */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-500/[0.02]">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <h3 className="font-bold text-slate-800 text-base font-display">New Connection Applications</h3>
                    </div>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono bg-amber-50 border border-amber-200 text-amber-700 rounded-full">
                      {pendingSubscribers.length} Connection requests
                    </span>
                  </div>

                  {pendingSubscribers.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <CheckCircle className="w-10 h-10 text-emerald-500/30 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">All applications verified</p>
                      <p className="text-xs text-slate-500 mt-1">New physical registration requests will appear here for security checking.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold font-mono uppercase">
                            <th className="p-4">Subscriber</th>
                            <th className="p-4">Physical Address</th>
                            <th className="p-4">Requested Plan</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pendingSubscribers.map((sub) => {
                            const pack = INTERNET_PACKAGES.find(p => p.id === sub.packageId) || INTERNET_PACKAGES[0];
                            return (
                              <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                  <p className="font-bold text-sm text-slate-800">{sub.name}</p>
                                  <p className="text-xs text-slate-500 font-mono">{sub.email}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Applied: {new Date(sub.registeredAt).toLocaleString()}</p>
                                </td>
                                <td className="p-4">
                                  <p className="text-xs text-slate-600 max-w-xs truncate flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    {sub.address}
                                  </p>
                                </td>
                                <td className="p-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {pack.name}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleActivateSubscriber(sub.id, sub.name)}
                                      disabled={processingId === sub.id}
                                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer shadow-sm"
                                      title="Authorize & Configure Router Connection"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRejectSubscriber(sub.id, sub.name)}
                                      disabled={processingId === sub.id}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-500 transition-all cursor-pointer"
                                      title="Deny connection request"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Active Directory list card */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 font-display">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      Active Subscriber Database
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {activeSubscribers.length} authorized links
                    </span>
                  </div>

                  {activeSubscribers.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-sm">
                      No active fiber lines found. Approved request nodes appear here.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold font-mono uppercase">
                            <th className="p-4">Subscriber details</th>
                            <th className="p-4">Assigned Plan</th>
                            <th className="p-4">Connection Telemetry</th>
                            <th className="p-4">Router Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeSubscribers.map((sub) => {
                            const pack = INTERNET_PACKAGES.find(p => p.id === sub.packageId) || INTERNET_PACKAGES[0];
                            return (
                              <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                  <p className="font-bold text-sm text-slate-800">{sub.name}</p>
                                  <p className="text-xs text-slate-500 font-mono">{sub.email}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">{sub.address}</p>
                                </td>
                                <td className="p-4">
                                  <div>
                                    <p className="text-xs font-semibold text-slate-800">{pack.name}</p>
                                    <p className="text-[10px] text-emerald-600 font-mono mt-0.5">{pack.price}/mo</p>
                                  </div>
                                </td>
                                <td className="p-4 font-mono">
                                  {sub.currentSpeedTest ? (
                                    <div className="text-xs space-y-0.5 bg-slate-50 p-2 rounded border border-slate-100 inline-block">
                                      <p className="text-emerald-600 font-bold">
                                        ▼ {sub.currentSpeedTest.download} Mbps
                                      </p>
                                      <p className="text-blue-600 font-bold">
                                        ▲ {sub.currentSpeedTest.upload} Mbps
                                      </p>
                                      <p className="text-[9px] text-slate-400">
                                        Ping: {sub.currentSpeedTest.ping} ms
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">No speed-tests logged</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                    SYNCED
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: PPPOE SECRET MANAGER */}
            {activeTab === 'pppoe' && (
              <div className="space-y-8">
                
                {/* PPPoE Quick Creator form */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-slate-800 text-base mb-2 font-display flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-600" />
                    Manually Provision PPPoE Account
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Add separate PPPoE service credentials directly into the router's active authentication pool.
                  </p>

                  <form onSubmit={handleAddPppoeSecretSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">PPPoE Username</label>
                      <input 
                        type="text" 
                        placeholder="e.g. customer@kijani.net" 
                        required
                        value={newPppUser}
                        onChange={(e) => setNewPppUser(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Secret Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        required
                        value={newPppPass}
                        onChange={(e) => setNewPppPass(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Speed Limit Profile</label>
                      <select 
                        value={newPppProfile}
                        onChange={(e) => setNewPppProfile(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {pppoeProfiles.map(prof => (
                          <option key={prof.id} value={prof.id}>{prof.name} ({prof.speedLimit})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Static IP Address (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 10.100.1.201" 
                        value={newPppIp}
                        onChange={(e) => setNewPppIp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="md:col-span-2 pt-2">
                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Create Router Tunnel
                      </button>
                    </div>
                  </form>
                </div>

                {/* Secret directory list */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-base font-display">Active RouterOS PPPoE Secrets</h3>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded">
                      {pppoeSecrets.length} Database entries
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold font-mono uppercase">
                          <th className="p-4">PPPoE Tunnel credentials</th>
                          <th className="p-4">Speed Limit Profile</th>
                          <th className="p-4">Assigned IP Address</th>
                          <th className="p-4">Uptime & Traffic</th>
                          <th className="p-4 text-center">Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pppoeSecrets.map((sec) => {
                          const prof = pppoeProfiles.find(p => p.id === sec.profileId) || pppoeProfiles[0];
                          const isActive = sec.status === 'active';
                          return (
                            <tr key={sec.username} className={`hover:bg-slate-50/50 transition-colors ${!isActive ? 'bg-slate-50/30' : ''}`}>
                              <td className="p-4">
                                <p className="font-bold text-xs text-slate-800">{sec.username}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Password: {sec.pass}</p>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  !isActive 
                                    ? 'bg-slate-100 text-slate-400' 
                                    : sec.profileId === 'profile-eco' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : sec.profileId === 'profile-turbo' 
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                                    : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                }`}>
                                  {prof.name}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-xs text-slate-600">
                                {sec.remoteAddress}
                              </td>
                              <td className="p-4">
                                {isActive ? (
                                  <div className="text-[10px] font-mono text-slate-500 space-y-0.5">
                                    <p>Uptime: <span className="text-slate-800 font-bold">{sec.uptime || '02h 14m'}</span></p>
                                    <p>TX: <span className="text-slate-700">{sec.txBytes ? (sec.txBytes / 1e9).toFixed(1) : '1.4'} GB</span></p>
                                    <p>RX: <span className="text-slate-700">{sec.rxBytes ? (sec.rxBytes / 1e9).toFixed(1) : '0.8'} GB</span></p>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-mono text-red-500 font-bold">TUNNEL_SUSPENDED</span>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleTogglePppoe(sec.username)}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      isActive 
                                        ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
                                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                    }`}
                                    title={isActive ? 'Suspend Connection' : 'Activate Connection'}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePppoe(sec.username)}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all cursor-pointer"
                                    title="Delete credential profile"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: HOTSPOT BILLING & VOUCHERS */}
            {activeTab === 'hotspot' && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* 1. MIKROTIK DEVICE CONNECTION MANAGER */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-slate-300/80 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-slate-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Server className="w-5 h-5 text-emerald-600 animate-pulse" />
                        <h3 className="font-bold text-slate-800 text-lg font-display tracking-tight">
                          MikroTik Device Connection Manager
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Connect, authenticate, and sync the billing portal directly to any physical RouterOS hardware via standard REST APIs.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {routerConfig?.connected ? (
                        <div className="flex items-center gap-2.5 bg-emerald-50/60 border border-emerald-200/60 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="font-mono tracking-tight text-[11px] font-black uppercase text-emerald-700">CONNECTED: {routerModel || 'Kijani-Spine-CCR2004'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-500 px-3 py-1.5 rounded-full text-xs font-mono font-bold">
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          DISCONNECTED
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Credentials Input Form */}
                    <div className="lg:col-span-7 space-y-5 border-r border-slate-100 pr-0 lg:pr-6">
                      <h4 className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Router Credentials</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                        <div className="relative border-b border-slate-200 focus-within:border-emerald-500 transition-colors duration-200 py-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider block">Router IP / Host Address</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. 192.168.88.1" 
                            value={routerIp}
                            onChange={(e) => setRouterIp(e.target.value)}
                            className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-mono text-slate-800 mt-1 placeholder-slate-300"
                          />
                        </div>

                        <div className="relative border-b border-slate-200 focus-within:border-emerald-500 transition-colors duration-200 py-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider block">REST API Port</label>
                          <input 
                            type="number" 
                            required
                            placeholder="e.g. 443" 
                            value={routerApiPort}
                            onChange={(e) => setRouterApiPort(parseInt(e.target.value) || 443)}
                            className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-mono text-slate-800 mt-1 placeholder-slate-300"
                          />
                        </div>

                        <div className="relative border-b border-slate-200 focus-within:border-emerald-500 transition-colors duration-200 py-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider block">Admin Username</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. admin" 
                            value={routerUser}
                            onChange={(e) => setRouterUser(e.target.value)}
                            className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-xs text-slate-800 mt-1 placeholder-slate-300 font-mono"
                          />
                        </div>

                        <div className="relative border-b border-slate-200 focus-within:border-emerald-500 transition-colors duration-200 py-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider block">Admin Password</label>
                          <input 
                            type="password" 
                            required
                            placeholder="••••••••" 
                            value={routerPass}
                            onChange={(e) => setRouterPass(e.target.value)}
                            className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-xs text-slate-800 mt-1 placeholder-slate-300"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={routerUseSsl}
                            onChange={(e) => setRouterUseSsl(e.target.checked)}
                            className="rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                          />
                          <span className="text-xs font-medium text-slate-600">Secure REST over HTTPS/SSL (Port 443)</span>
                        </label>

                        <button 
                          onClick={triggerConnectionTest}
                          disabled={isTestingConn || !routerIp || !routerUser}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)] transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          {isTestingConn ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Testing handshakes...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Test & Save Connection
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Active Handshake / Resource Console */}
                    <div className="lg:col-span-5 bg-slate-50/50 rounded-2xl p-5 border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-3 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                          Handshake Log & System Telemetry
                        </h4>

                        {isTestingConn ? (
                          <div className="space-y-2.5 font-mono text-xs">
                            {testSteps.map((step, idx) => {
                              const isSuccess = step.status === 'success';
                              const isLoading = step.status === 'loading';
                              return (
                                <div 
                                  key={step.label} 
                                  className={`flex items-center justify-between border-b border-slate-100/50 pb-2 transition-all duration-300 transform ${
                                    isSuccess ? 'translate-y-0 opacity-100' : isLoading ? '-translate-y-1 animate-pulse opacity-100' : 'translate-y-1 opacity-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-mono ${isSuccess ? 'text-emerald-600 font-bold' : isLoading ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                                      {isSuccess ? '✓' : isLoading ? '➜' : '○'}
                                    </span>
                                    <span className={`font-mono text-[11px] ${isSuccess ? 'text-slate-700 font-medium' : isLoading ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                                      {step.label}
                                    </span>
                                  </div>
                                  <span className="flex items-center justify-center">
                                    {isSuccess && (
                                      <span className="h-5 w-5 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs animate-scaleIn">
                                        ✓
                                      </span>
                                    )}
                                    {isLoading && (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                                    )}
                                    {!isSuccess && !isLoading && (
                                      <span className="text-slate-300 text-[10px] font-mono">pending</span>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : handshakeSuccess ? (
                          <div className="space-y-4">
                            <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3 flex items-center gap-3 shadow-inner">
                              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0 animate-scaleIn" />
                              <div>
                                <p className="text-xs font-bold text-emerald-900 font-display">REST API Sync success!</p>
                                <p className="text-[10px] text-emerald-600 font-mono">Last Handshake: {new Date(routerConfig?.lastSync || '').toLocaleTimeString()}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-white border border-slate-100 p-2.5 rounded-xl shadow-xs">
                                <p className="text-[8px] uppercase font-mono font-bold text-slate-400">CPU LOAD</p>
                                <p className="text-sm font-mono font-black text-slate-800 mt-1">{cpuLoad}%</p>
                              </div>
                              <div className="bg-white border border-slate-100 p-2.5 rounded-xl shadow-xs">
                                <p className="text-[8px] uppercase font-mono font-bold text-slate-400">FREE RAM</p>
                                <p className="text-sm font-mono font-black text-slate-800 mt-1">{freeMemory}M</p>
                              </div>
                              <div className="bg-white border border-slate-100 p-2.5 rounded-xl shadow-xs">
                                <p className="text-[8px] uppercase font-mono font-bold text-slate-400">UPTIME</p>
                                <p className="text-[10px] font-mono font-bold text-slate-700 mt-2 truncate" title={uptime}>{uptime}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-32 flex flex-col items-center justify-center text-center text-slate-400 italic text-xs">
                            <Activity className="w-8 h-8 text-slate-300 mb-1 animate-pulse" />
                            <p className="font-semibold">No active handshake initialized.</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Click test connection to verify SSL & resources.</p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-200/60 pt-3 mt-4 flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span>WebFig Port: {routerWebPort}</span>
                        <span>API Sync Bridge v1.2</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Setup Wizard & Package Creator Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  
                  {/* Smart Hotspot Setup Wizard */}
                  <div className="xl:col-span-5 bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-slate-300/80 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base mb-1 font-display tracking-tight flex items-center gap-2">
                        <Settings className="w-5 h-5 text-emerald-600 animate-spin-slow" />
                        Smart Hotspot Setup Wizard
                      </h3>
                      <p className="text-xs text-slate-500 mb-6">
                        Provision Hotspot server configs automatically to a freshly cleared Ethernet or bridge port.
                      </p>

                      {/* Steps Progress */}
                      <div className="flex items-center justify-between mb-6">
                        {[1, 2, 3].map((num) => (
                          <React.Fragment key={num}>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all duration-300 ${
                                wizardStep === num 
                                  ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100' 
                                  : wizardStep > num 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                {wizardStep > num ? <Check className="w-3 h-3 text-emerald-800 font-extrabold" /> : num}
                              </span>
                              <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${
                                wizardStep === num ? 'text-slate-800 font-semibold' : 'text-slate-400'
                              }`}>
                                {num === 1 ? 'Port' : num === 2 ? 'IP Pool' : 'DNS'}
                              </span>
                            </div>
                            {num < 3 && <div className="h-0.5 bg-slate-100 flex-1 mx-2" />}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Step Panels */}
                      {wizardStep === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Select the physical port or interface bridge that will run the client landing page portal.
                          </p>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1.5">Target Router interface</label>
                            <select 
                              value={wizardInterface}
                              onChange={(e) => setWizardInterface(e.target.value)}
                              className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none cursor-pointer font-mono"
                            >
                              <option value="ether3-hotspot">ether3-hotspot (Physical Port 3)</option>
                              <option value="bridge-hotspot-lan">bridge-hotspot-lan (Wired + WiFi LAN)</option>
                              <option value="ether4-wifi">ether4-wifi-AP (Ubiquiti Uplink)</option>
                              <option value="wlan1">wlan1 (Integrated MikroTik wireless)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {wizardStep === 2 && (
                        <div className="space-y-4 animate-fadeIn">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Define the Hotspot network subnet. The router will serve dynamic leases from this pool.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1.5">Gateway IP Subnet</label>
                              <input 
                                type="text"
                                value={wizardIpPool}
                                onChange={(e) => setWizardIpPool(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1.5">DNS Server Resolvers</label>
                              <input 
                                type="text"
                                value={wizardDnsServers}
                                onChange={(e) => setWizardDnsServers(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {wizardStep === 3 && (
                        <div className="space-y-4 animate-fadeIn">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Set up the redirection DNS domain name that redirects unauthorized devices to the Kijani Link portal login page.
                          </p>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1.5">DNS redirection domain</label>
                            <input 
                              type="text"
                              value={wizardDnsName}
                              onChange={(e) => setWizardDnsName(e.target.value)}
                              className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none"
                            />
                            <span className="text-[10px] font-mono text-slate-400 mt-1.5 block">Redirects users accessing random HTTP web URLs.</span>
                          </div>
                        </div>
                      )}

                      {/* Compiled Terminal Script Outputs */}
                      {wizardLogs.length > 0 && (
                        <div className="mt-5 bg-slate-900 rounded-xl p-4.5 border border-slate-800 font-mono text-[10px] leading-relaxed text-emerald-400 space-y-1 max-h-36 overflow-y-auto shadow-inner">
                          <p className="text-slate-400 border-b border-slate-800 pb-1 mb-2">✦ ROS Script Terminal Sync:</p>
                          {wizardLogs.map((log, idx) => (
                            <p key={idx}>{log}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                      {wizardStep > 1 ? (
                        <button 
                          onClick={() => setWizardStep(prev => prev - 1)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Back
                        </button>
                      ) : <div />}

                      {wizardStep < 3 ? (
                        <button 
                          onClick={() => setWizardStep(prev => prev + 1)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Next Step
                        </button>
                      ) : (
                        <button 
                          onClick={handleStartWizardProvisioning}
                          disabled={wizardIsProvisioning}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          {wizardIsProvisioning ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Compiling Script...
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              Setup Hotspot
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hotspot Profile Creator & Packages Grid */}
                  <div className="xl:col-span-7 bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-slate-300/80 p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base font-display tracking-tight flex items-center gap-2">
                          <Database className="w-5 h-5 text-emerald-600" />
                          Hotspot Package (Profile) Creator & Manager
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Create speed and time-limited service profiles with KSh billing values.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Package Creator Form */}
                    <form onSubmit={handleCreateHotspotProfile} className="bg-slate-50/60 border border-slate-200/60 p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-4 shadow-inner">
                      <div className="sm:col-span-2 md:col-span-3 pb-2 border-b border-slate-200/40 flex justify-between items-center">
                        <span className="text-[10px] uppercase font-mono font-black tracking-wider text-emerald-700">
                          {editingProfileId ? '✏️ Modify Selected Profile' : '➕ Create Dynamic Hotspot Profile'}
                        </span>
                        {editingProfileId && (
                          <button 
                            type="button" 
                            onClick={() => {
                              setEditingProfileId(null);
                              setNewHsName('');
                              setNewHsPrice(50);
                              setNewHsSharedUsers(1);
                            }}
                            className="text-[10px] text-red-500 font-bold hover:underline"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1.5">Profile Name</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Kijani 3 Hours" 
                          value={newHsName}
                          onChange={(e) => setNewHsName(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1.5">Session Timeout</label>
                        <select 
                          value={newHsTimeLimit}
                          onChange={(e) => setNewHsTimeLimit(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs font-mono"
                        >
                          <option value="1h">1 Hour</option>
                          <option value="3h">3 Hours</option>
                          <option value="12h">12 Hours</option>
                          <option value="1d">24 Hours (1 Day)</option>
                          <option value="7d">7 Days (1 Week)</option>
                          <option value="30d">30 Days (1 Month)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1.5">Bandwidth Limit (Down/Up)</label>
                        <select 
                          value={newHsSpeedLimit}
                          onChange={(e) => setNewHsSpeedLimit(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs font-mono"
                        >
                          <option value="3M/3M">3 Mbps (Standard)</option>
                          <option value="5M/5M">5 Mbps (Eco)</option>
                          <option value="10M/10M">10 Mbps (Premium)</option>
                          <option value="15M/15M">15 Mbps (Super)</option>
                          <option value="20M/20M">20 Mbps (Turbo Giga)</option>
                        </select>
                      </div>

                      {/* Interactive Price Range Slider & Input */}
                      <div className="sm:col-span-2 space-y-2 bg-white border border-slate-200/50 p-3 rounded-xl shadow-xs">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Retail Price (KSh)</label>
                          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100">KSh {newHsPrice}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range"
                            min="5"
                            max="2000"
                            step="5"
                            value={newHsPrice}
                            onChange={(e) => setNewHsPrice(parseInt(e.target.value) || 50)}
                            className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                          />
                          <input 
                            type="number" 
                            min="5" 
                            required
                            placeholder="KSh" 
                            value={newHsPrice}
                            onChange={(e) => setNewHsPrice(parseInt(e.target.value) || 50)}
                            className="w-18 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                               {/* Shared Device Limit Slider */}
                      <div className="space-y-2 bg-white border border-slate-200/50 p-3 rounded-xl shadow-xs">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Shared Devices Limit</label>
                          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{newHsSharedUsers} Devs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="range"
                            min="1"
                            max="10"
                            value={newHsSharedUsers}
                            onChange={(e) => setNewHsSharedUsers(parseInt(e.target.value) || 1)}
                            className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                          />
                        </div>
                      </div>

                      {/* Toggle option switches */}
                      <div className="sm:col-span-2 md:col-span-3 flex flex-wrap gap-4 pt-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-slate-500 font-mono">Bind MAC Address</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-slate-500 font-mono">Auto-Sync IP Pool</span>
                        </label>
                      </div>

                      <div className="sm:col-span-2 md:col-span-3 flex justify-end pt-3">
                        <button 
                          type="submit"
                          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        >
                          {editingProfileId ? 'Save Profile Settings' : 'Add Hotspot Package'}
                        </button>
                      </div>
                    </form>

                    {/* Live Profiles Grid Table */}
                    <div className="border border-slate-200/60 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto shadow-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-[10px] font-bold font-mono uppercase tracking-wider">
                            <th className="p-3">Profile Details</th>
                            <th className="p-3">Specs & Timeout</th>
                            <th className="p-3 text-center">Shared Users</th>
                            <th className="p-3">Cost</th>
                            <th className="p-3 text-center">Sync & Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {hotspotProfiles.map((prof) => (
                            <tr key={prof.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3">
                                <p className="font-bold text-slate-800">{prof.name}</p>
                                <p className="text-[9px] font-mono text-slate-400">{prof.id}</p>
                              </td>
                              <td className="p-3 space-y-0.5">
                                <span className="inline-block bg-emerald-50 text-emerald-700 font-mono px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-100/50">{prof.speedLimit}</span>
                                <p className="text-[10px] text-slate-500 font-mono">Validity: {prof.timeLimit}</p>
                              </td>
                              <td className="p-3 font-mono text-slate-600 text-center font-semibold">{prof.sharedUsers || 1} devs</td>
                              <td className="p-3 font-bold text-emerald-700 font-mono">KSh {prof.price.toLocaleString()}</td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleProvisionProfileToRouter(prof)}
                                    disabled={isProvisioningProfileId === prof.id}
                                    className="px-2 py-1 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                                    title="Provision profile metadata to active RouterOS"
                                  >
                                    {isProvisioningProfileId === prof.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-3 h-3" />
                                    )}
                                    Provision
                                  </button>
                                  <button
                                    onClick={() => handleEditProfileInit(prof)}
                                    className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
                                    title="Edit Package"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProfileClick(prof.id)}
                                    className="p-1 rounded hover:bg-red-50 text-red-600 cursor-pointer"
                                    title="Delete Package"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 3. Voucher Generator & Active Monitor Block */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  
                  {/* Voucher Blueprint Generator */}
                  <div className="xl:col-span-5 bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-slate-300/80 p-6 space-y-5 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base mb-1 font-display tracking-tight flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-emerald-600" />
                        Bulk Voucher Generator
                      </h3>
                      <p className="text-xs text-slate-500 mb-5">
                        Batch-produce pre-authenticated vouchers, generate high-fidelity printable coupon blocks, or export catalog CSVs.
                      </p>

                      <form onSubmit={handleGenerateVouchersSubmit} className="space-y-3.5">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1.5">Target Package Speed profile</label>
                          <select 
                            value={voucherProfile}
                            onChange={(e) => setVoucherProfile(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none cursor-pointer font-mono"
                          >
                            {hotspotProfiles.map(prof => (
                              <option key={prof.id} value={prof.id}>{prof.name} (KSh {prof.price.toLocaleString()})</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1.5">Voucher count</label>
                            <input 
                              type="number" 
                              min="1" 
                              max="100" 
                              required
                              value={voucherQty}
                              onChange={(e) => setVoucherQty(parseInt(e.target.value) || 10)}
                              className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1.5">Voucher PIN Prefix</label>
                            <input 
                              type="text" 
                              maxLength="4"
                              placeholder="KJL" 
                              required
                              value={voucherPrefix}
                              onChange={(e) => setVoucherPrefix(e.target.value.toUpperCase())}
                              className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1.5">PIN Code Length</label>
                            <select 
                              value={voucherPinLength}
                              onChange={(e) => setVoucherPinLength(parseInt(e.target.value) || 6)}
                              className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none cursor-pointer font-mono"
                            >
                              <option value="6">6 Characters</option>
                              <option value="8">8 Characters</option>
                              <option value="10">10 Characters</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1.5">PIN Character set</label>
                            <select 
                              value={voucherAlphanumeric ? 'alpha' : 'numeric'}
                              onChange={(e) => setVoucherAlphanumeric(e.target.value === 'alpha')}
                              className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none cursor-pointer font-mono"
                            >
                              <option value="alpha">Alphanumeric (Letters + Numbers)</option>
                              <option value="numeric">Numeric Only (0-9)</option>
                            </select>
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        >
                          <Zap className="w-4 h-4 animate-pulse" />
                          Generate & Sync Vouchers
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Real-time Session Monitor Terminal */}
                  <div className="xl:col-span-7 bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-slate-300/80 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-slate-800 text-base font-display flex items-center gap-2">
                          <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                          Active Sessions Terminal (DHCP Lease)
                        </h3>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-xs text-slate-500 mb-5">
                        Track live terminals connected to the wireless hotspot bridge. View uplink counters and signal levels.
                      </p>

                      {hotspotSessions.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic text-xs border border-dashed border-slate-200 rounded-xl">
                          No active Hotspot terminal sessions detected on bridge-hotspot interface. Use PINs to activate terminal connections.
                        </div>
                      ) : (
                        <div className="border border-slate-200/60 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto shadow-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-[10px] font-bold font-mono uppercase tracking-wider">
                                <th className="p-3">Uplink MAC (Vendor)</th>
                                <th className="p-3">PIN / IP Address</th>
                                <th className="p-3">Uplink Rates</th>
                                <th className="p-3">Telemetry</th>
                                <th className="p-3 text-center">Eject</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {hotspotSessions.map((sess) => {
                                // Dynamic Vendor Detection from MAC Prefix with gorgeous desaturated colors
                                let vendor = 'Generic Client';
                                let badgeStyle = 'bg-slate-50 text-slate-700 border-slate-200/60';
                                
                                if (sess.macAddress.startsWith('00:1E')) {
                                  vendor = 'Apple iPhone';
                                  badgeStyle = 'bg-slate-100/80 text-slate-800 border-slate-200/80';
                                } else if (sess.macAddress.startsWith('8C:11')) {
                                  vendor = 'Samsung Galaxy';
                                  badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-100/50';
                                } else if (sess.macAddress.startsWith('44:D8')) {
                                  vendor = 'Xiaomi Note';
                                  badgeStyle = 'bg-orange-50 text-orange-700 border-orange-100/50';
                                } else {
                                  const list = ['Apple iPad', 'Huawei Mate', 'Oppo Reno', 'Dell Laptop', 'Intel Wireless', 'HP EliteBook', 'Samsung Tab', 'Tecno Spark'];
                                  const h = sess.macAddress.split(':').reduce((a, b) => a + parseInt(b, 16) || 0, 0);
                                  vendor = list[h % list.length];
                                  
                                  const styles = [
                                    'bg-blue-50 text-blue-700 border-blue-100/50',
                                    'bg-rose-50 text-rose-700 border-rose-100/50',
                                    'bg-emerald-50 text-emerald-700 border-emerald-100/50',
                                    'bg-sky-50 text-sky-700 border-sky-100/50',
                                    'bg-violet-50 text-violet-700 border-violet-100/50',
                                    'bg-amber-50 text-amber-700 border-amber-100/50'
                                  ];
                                  badgeStyle = styles[h % styles.length];
                                }
                                
                                return (
                                  <tr key={sess.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-3">
                                      <p className="font-mono font-bold text-slate-800 text-[11px] tracking-tight">{sess.macAddress}</p>
                                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} mt-0.5`}>
                                        {vendor}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <span className="px-1.5 py-0.5 bg-emerald-50/80 text-emerald-700 font-mono text-[10px] border border-emerald-100/60 rounded font-bold">
                                        PIN: {sess.pin}
                                      </span>
                                      <p className="text-[10px] font-mono text-slate-400 mt-1">{sess.ipAddress}</p>
                                    </td>
                                    <td className="p-3 font-mono space-y-0.5 text-[10px]">
                                      <p className="text-emerald-600 font-bold">▼ {sess.speedDown} Mbps</p>
                                      <p className="text-slate-500 font-bold">▲ {sess.speedUp} Mbps</p>
                                    </td>
                                    <td className="p-3">
                                      <div className="text-[10px] font-mono text-slate-500 space-y-0.5">
                                        <p>Uptime: <span className="text-slate-700 font-bold">{sess.uptime}</span></p>
                                        <p>Signal: <span className={sess.signal > -65 ? 'text-emerald-600 font-bold' : 'text-amber-600'}>{sess.signal} dBm</span></p>
                                      </div>
                                    </td>
                                    <td className="p-3 text-center">
                                      <button
                                        onClick={() => handleEjectSessionClick(sess.pin)}
                                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-100/50 transition-all cursor-pointer shadow-xs hover:shadow-sm"
                                        title="Kill terminal bridge lease"
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Printable Vouchers Overlay Box */}
                {showPrintableVouchers && newlyGeneratedVouchers.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <h4 className="font-extrabold text-slate-800 font-display">
                            Printable Hotspot Vouchers Generated
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Vouchers are generated, synchronized with active router states, and formatted for physical printing.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleDownloadCsv(newlyGeneratedVouchers)}
                          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          Download CSV
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          🖨️
                          Print Grid
                        </button>
                        <button
                          onClick={() => setShowPrintableVouchers(false)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full cursor-pointer transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 max-h-[340px] overflow-y-auto p-3 bg-white border border-slate-200 rounded-xl shadow-inner">
                      {newlyGeneratedVouchers.map((v) => {
                        const prof = hotspotProfiles.find(hp => hp.id === v.profileId) || hotspotProfiles[0];
                        return (
                          <div key={v.pin} className="relative group border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/80 rounded-2xl p-4 bg-radial from-white via-slate-50 to-emerald-50/10 overflow-hidden flex flex-col justify-between h-36 transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5">
                            {/* Premium Tactile Scratch Card Corner Accent */}
                            <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/5 rounded-bl-3xl group-hover:bg-emerald-500/10 transition-colors" />
                            
                            {/* Card Top */}
                            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 z-10">
                              <span className="text-[9px] font-black tracking-wider text-emerald-700 font-mono">KIJANI WIFI</span>
                              <span className="text-[8px] font-bold text-slate-500 font-mono bg-slate-100 px-1 py-0.2 rounded">{prof.speedLimit}</span>
                            </div>
                            
                            {/* Card Code (Tactile Simulated pass area) */}
                            <div className="text-center my-2 relative z-10">
                              <p className="text-[7px] uppercase tracking-widest text-slate-400 font-mono font-bold mb-0.5">PASSCODE PIN</p>
                              <div className="relative overflow-hidden font-mono font-extrabold text-sm tracking-widest text-emerald-800 bg-white border border-emerald-200/50 py-1 px-1.5 rounded-lg shadow-inner">
                                {v.pin}
                                {/* Security watermark simulation line */}
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-emerald-500/5 to-transparent -skew-x-12 translate-x-[-100%] animate-pulse" />
                              </div>
                            </div>
                            
                            {/* Card Foot */}
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 border-t border-slate-100 pt-1.5 z-10">
                              <span className="font-bold text-slate-600">{prof.timeLimit} Limit</span>
                              <span className="font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">KSh {v.price}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Complete Voucher Catalog */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base font-display">
                        Complete Voucher Catalog (History Database)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage generated client access tokens and view active status directories.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadCsv(hotspotVouchers)}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        Export All CSV
                      </button>
                      <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded">
                        {hotspotVouchers.length} Total Vouchers
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold font-mono uppercase sticky top-0">
                          <th className="p-4 bg-slate-50">Voucher PIN Pass</th>
                          <th className="p-4 bg-slate-50">Hotspot profile Speed Limit</th>
                          <th className="p-4 bg-slate-50">Retail Cost</th>
                          <th className="p-4 bg-slate-50">Active Status</th>
                          <th className="p-4 bg-slate-50 text-center">Action Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {hotspotVouchers.map((v) => {
                          const prof = hotspotProfiles.find(hp => hp.id === v.profileId) || hotspotProfiles[0];
                          return (
                            <tr key={v.pin} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <span className="font-mono font-bold text-sm text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg shadow-inner">
                                  {v.pin}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="text-xs font-bold text-slate-700 uppercase">{prof?.name || 'Custom Profile'}</span>
                                <p className="text-[9px] text-slate-400 font-mono">Limit: {prof?.speedLimit || 'Symmetric'} • {prof?.timeLimit || '24 Hours'}</p>
                              </td>
                              <td className="p-4 font-mono text-xs text-slate-800 font-semibold">
                                KSh {v.price.toLocaleString()}
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  v.status === 'unused' 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                    : v.status === 'active' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse' 
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {v.status}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() => handleDeleteVoucher(v.pin)}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-colors cursor-pointer"
                                    title="Delete Voucher Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: MIKROTIK REST API SYNC BRIDGE */}
            {activeTab === 'sync' && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Header card explaining the sync bridge */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base font-display">
                          MikroTik RouterOS REST API Provisioning Bridge
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Query active subscribers, map billing plans, and synchronize configurations dynamically via HTTP REST.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        isSyncing ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        {isSyncing ? 'API TRANSACTIONS ACTIVE' : 'API BRIDGE ONLINE'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">REST Gateway Host</p>
                      <p className="text-xs font-semibold font-mono text-slate-800 truncate">{apiGatewayUrl}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Hardware Handshake</p>
                      <p className="text-xs font-semibold text-slate-800">{routerConfig?.name || 'CCR2004'} RouterOS v7+</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Sync Mode</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input 
                          type="checkbox"
                          id="auto-sync-toggle"
                          checked={autoSyncEnabled}
                          onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                        />
                        <label htmlFor="auto-sync-toggle" className="text-xs text-slate-700 font-medium cursor-pointer select-none">
                          Auto-Sync on Activation
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* API Endpoint configuration accordion */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-sm text-slate-800 font-display flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-500" />
                      REST API Authentication Handshake
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">RouterOS v7 REST endpoints</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Target REST Endpoint URL</label>
                      <input 
                        type="text"
                        value={apiGatewayUrl}
                        onChange={(e) => setApiGatewayUrl(e.target.value)}
                        placeholder="e.g. https://192.168.88.1/rest"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Authorization Method</label>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-mono truncate">
                        Basic Auth Token (Base64 credential bundle)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Sync Queue Directory */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base font-display">
                        Billing & Provisioning Directory Mapping
                      </h3>
                      <p className="text-xs text-slate-500">
                        Check status of billing accounts vs router-side PPPoE and Hotspot credentials.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                      {selectedSubscribersForSync.length > 0 && (
                        <button
                          onClick={handleBulkSyncApi}
                          disabled={isSyncing}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Run Sync on {selectedSubscribersForSync.length} Accounts
                        </button>
                      )}
                    </div>
                  </div>

                  {activeSubscribers.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No active connection nodes found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Go to the "Subscriber Verification" tab to approve new lines and register billing nodes.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold font-mono uppercase">
                            <th className="p-4 w-12 text-center">
                              <input 
                                type="checkbox"
                                checked={selectedSubscribersForSync.length === activeSubscribers.length}
                                onChange={() => toggleSelectAllSync(activeSubscribers)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </th>
                            <th className="p-4">Subscriber details</th>
                            <th className="p-4">Billing Plan</th>
                            <th className="p-4">PPPoE Tunnel API Status</th>
                            <th className="p-4">Hotspot Profile API</th>
                            <th className="p-4 text-center">Sync Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeSubscribers.map((sub) => {
                            const pPlan = sub.packageId === 'kijani-eco' ? 'profile-eco' : sub.packageId === 'kijani-turbo' ? 'profile-turbo' : 'profile-giga';
                            const hasPppSecret = pppoeSecrets.some(sec => sec.username === sub.email);
                            const matchingSecret = pppoeSecrets.find(sec => sec.username === sub.email);
                            const isPppActive = matchingSecret?.status === 'active';
                            const pack = INTERNET_PACKAGES.find(p => p.id === sub.packageId) || INTERNET_PACKAGES[0];
                            const isBeingSynced = activeSyncSubId === sub.id;

                            return (
                              <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 text-center">
                                  <input 
                                    type="checkbox"
                                    checked={selectedSubscribersForSync.includes(sub.id)}
                                    onChange={() => toggleSelectSub(sub.id)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                </td>
                                <td className="p-4">
                                  <p className="font-bold text-sm text-slate-800">{sub.name}</p>
                                  <p className="text-xs text-slate-500 font-mono">{sub.email}</p>
                                </td>
                                <td className="p-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                                    {pack.name}
                                  </span>
                                </td>
                                <td className="p-4">
                                  {hasPppSecret ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className={`h-2 w-2 rounded-full ${isPppActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                      <span className="text-xs font-mono font-medium text-slate-700">
                                        {matchingSecret?.profileId}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      PENDING PROVISIONING
                                    </span>
                                  )}
                                </td>
                                <td className="p-4">
                                  {hasPppSecret ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                      <span className="text-xs font-mono font-medium text-slate-700">
                                        hs-{matchingSecret?.profileId}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400 font-mono italic">No hotspot bypass binded</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-center">
                                    <button
                                      onClick={() => executeApiProvisioning(sub)}
                                      disabled={isSyncing || isBeingSynced}
                                      className={`p-2 rounded-lg font-bold text-xs transition-all cursor-pointer border shadow-sm ${
                                        isBeingSynced 
                                          ? 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
                                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                      }`}
                                      title="Auto-provision account via REST endpoints"
                                    >
                                      {isBeingSynced ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Zap className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* API Live Console & Payload Inspector (Double bento layout) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* LEFT BENTO: Interactive Handshake Console Terminal */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between h-[450px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-xs font-mono text-slate-200">REST Handshake syslog</span>
                      </div>
                      <button
                        onClick={() => setSyncLogs([])}
                        className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        Clear logs
                      </button>
                    </div>

                    <div className="flex-1 bg-black/40 font-mono text-[10px] text-emerald-400 p-4 rounded-xl overflow-y-auto space-y-2.5 border border-slate-800/80 scrollbar-thin text-left">
                      {syncLogs.length === 0 ? (
                        <p className="text-slate-600 italic">No REST API packets logged in current session.</p>
                      ) : (
                        syncLogs.map((log) => {
                          let color = 'text-emerald-400';
                          if (log.type === 'error') color = 'text-red-400 font-semibold';
                          if (log.type === 'warning') color = 'text-amber-400';
                          if (log.type === 'request') color = 'text-blue-400';
                          if (log.type === 'success') color = 'text-emerald-300 font-bold';
                          
                          return (
                            <p key={log.id} className={`leading-relaxed break-words ${color}`}>
                              [{new Date(log.timestamp).toLocaleTimeString()}] {log.text}
                            </p>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-800/60 text-left">
                      <p className="text-[9px] text-slate-500 leading-relaxed font-mono">
                        * Real-time sync logs show raw HTTP client connections made to MikroTik REST sockets.
                      </p>
                    </div>
                  </div>

                  {/* RIGHT BENTO: API Request / Response Debugger & Payload Viewer */}
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between h-[450px] text-slate-300 font-mono text-xs text-left">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-xs font-mono text-slate-200">REST API Packet Inspector</span>
                      </div>
                      {currentApiStep && (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold animate-pulse">
                          {currentApiStep}
                        </span>
                      )}
                    </div>

                    {apiDebuggerData ? (
                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin text-[10px] text-left">
                        <div className="space-y-1">
                          <p className="text-slate-500 font-bold uppercase text-[9px] font-sans">Target HTTP Request</p>
                          <div className="bg-black/50 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 rounded text-[9px] font-black">
                              {apiDebuggerData.method}
                            </span>
                            <span className="text-slate-300 break-all">{apiDebuggerData.url}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-slate-500 font-bold uppercase text-[9px] font-sans">Request Headers</p>
                          <pre className="bg-black/50 p-2.5 rounded-lg border border-slate-800 overflow-x-auto text-slate-400 text-left">
                            {JSON.stringify(apiDebuggerData.headers, null, 2)}
                          </pre>
                        </div>

                        <div className="space-y-1">
                          <p className="text-slate-500 font-bold uppercase text-[9px] font-sans">Request Body (JSON Payload)</p>
                          <pre className="bg-black/50 p-2.5 rounded-lg border border-slate-800 overflow-x-auto text-amber-300 text-left">
                            {apiDebuggerData.body}
                          </pre>
                        </div>

                        <div className="space-y-1">
                          <p className="text-slate-500 font-bold uppercase text-[9px] font-sans">HTTP Response Status</p>
                          <div className="bg-black/50 p-2 rounded-lg border border-slate-800 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-emerald-400 font-bold">{apiDebuggerData.status}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-slate-500 font-bold uppercase text-[9px] font-sans">REST JSON Response</p>
                          <pre className="bg-black/50 p-2.5 rounded-lg border border-slate-800 overflow-x-auto text-emerald-300 text-left">
                            {apiDebuggerData.response}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-8">
                        <Code className="w-8 h-8 text-slate-700 mb-2" />
                        <p className="font-sans text-sm font-semibold">Inspector Standby</p>
                        <p className="font-sans text-xs text-slate-500 mt-1">
                          Select any active subscriber and click the sync action button to visualize direct API handshakes here.
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex justify-between items-center text-[9px] text-slate-500">
                      <span>CORS Proxy: Bypass Enabled</span>
                      <button 
                        onClick={() => {
                          if (apiDebuggerData) {
                            navigator.clipboard.writeText(`curl -X ${apiDebuggerData.method} "${apiDebuggerData.url}" \\\n  -H "Authorization: Basic [token]" \\\n  -H "Content-Type: application/json" \\\n  -d '${apiDebuggerData.body}'`);
                            alert("Copied custom cURL command to clipboard!");
                          }
                        }}
                        disabled={!apiDebuggerData}
                        className="px-2 py-1 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Copy as cURL
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 4: ROUTER CONFIG */}
            {activeTab === 'router' && (
              <div className="space-y-8">
                
                {/* Router settings profile card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-slate-800 text-base mb-2 font-display flex items-center gap-2">
                    <Server className="w-5 h-5 text-emerald-600" />
                    Configure RouterOS API parameters
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Define the secure API handshake details for connecting with physical MikroTik Cloud Core Routers (CCR).
                  </p>

                  {configSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-700 mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      Settings successfully updated and mirrored to local storage!
                    </div>
                  )}

                  <form onSubmit={handleUpdateRouterSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Router IP address</label>
                        <input 
                          type="text" 
                          required
                          value={routerIp}
                          onChange={(e) => setRouterIp(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">RouterOS API Port</label>
                        <input 
                          type="number" 
                          required
                          value={routerApiPort}
                          onChange={(e) => setRouterApiPort(parseInt(e.target.value) || 8728)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">WebFig Port</label>
                        <input 
                          type="number" 
                          required
                          value={routerWebPort}
                          onChange={(e) => setRouterWebPort(parseInt(e.target.value) || 80)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Admin User</label>
                        <input 
                          type="text" 
                          required
                          value={routerUser}
                          onChange={(e) => setRouterUser(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Security Password</label>
                        <input 
                          type="password" 
                          required
                          value={routerPass}
                          onChange={(e) => setRouterPass(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Device Model Name</label>
                        <input 
                          type="text" 
                          required
                          value={routerModel}
                          onChange={(e) => setRouterModel(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Connection State</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-emerald-600 font-bold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Authenticated via API sockets
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        Save Router Configuration
                      </button>
                    </div>
                  </form>
                </div>

                {/* Router physical status telemetry diagnostics info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                    <Cpu className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">CPU Usage</p>
                      <h4 className="font-extrabold text-slate-800 font-display">12.4% (Multi-Core)</h4>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                    <HardDrive className="w-8 h-8 text-blue-600 shrink-0" />
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">RAM Available</p>
                      <h4 className="font-extrabold text-slate-800 font-display">3.4 GB / 4.0 GB</h4>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                    <Database className="w-8 h-8 text-teal-600 shrink-0" />
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Active Interfaces</p>
                      <h4 className="font-extrabold text-slate-800 font-display">8 Interfaces Live</h4>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Diagnostic console logger & billing utilities (takes 1/3 width) */}
          <div className="space-y-6">
            
            {/* Real-time terminal monitor */}
            <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl shadow-lg flex flex-col justify-between h-[450px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs font-mono">RouterOS Log Console</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[9px] text-emerald-400 font-mono font-bold">LIVE_FEED</span>
                </div>
              </div>

              {/* Logger box */}
              <div className="flex-1 bg-black/40 font-mono text-[10px] text-emerald-400 p-3.5 rounded-xl overflow-y-auto space-y-2.5 border border-slate-800/80 scrollbar-thin">
                {routerLogs.map((log, index) => {
                  const isWarning = log.level === 'warning';
                  const isCritical = log.level === 'critical';
                  return (
                    <p key={index} className={`leading-relaxed break-words ${isWarning ? 'text-amber-300' : isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                      [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                    </p>
                  );
                })}
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-800/60">
                <p className="text-[9px] text-slate-400 leading-relaxed font-mono">
                  * Live Syslogs aggregated from bridge interfaces and PPPoE authentication daemons.
                </p>
              </div>
            </div>

            {/* Quick Helper Tip card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl text-left shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-800 font-display flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Network Administrator Tips
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Synchronize Trigger</strong> forces billing state into router's secrets pool immediately.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Active Hotspot users authed by 6-digit vouchers enjoy symmetrical traffic caps.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Default bypass logins are configured below the subscriber portal for easier validation.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
