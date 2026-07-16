import { InternetPackage } from '../types';

export const INTERNET_PACKAGES: InternetPackage[] = [
  {
    id: 'kijani-eco',
    name: 'Kijani Eco 50Mbps',
    speed: '50 Mbps',
    price: 'KSh 3,000',
    features: [
      'Unlimited Solar-Backed Data',
      'Perfect for remote working & HD streaming',
      'Standard eco-node routing priority',
      'Includes free recycled Smart Router',
      'Zero-carbon carbon-offset certificate'
    ],
    color: 'emerald'
  },
  {
    id: 'kijani-turbo',
    name: 'Kijani Turbo 200Mbps',
    speed: '200 Mbps',
    price: 'KSh 5,000',
    features: [
      'High-Speed Light-Optic Connection',
      'Optimized for 4K video & online gaming',
      'Priority routing via backbone hubs',
      'Advanced Wi-Fi 6 green-power router',
      '99.9% uptime green service agreement'
    ],
    color: 'teal'
  },
  {
    id: 'kijani-giga',
    name: 'Kijani Giga 1Gbps',
    speed: '1 Gbps',
    price: 'KSh 9,000',
    features: [
      'Absolute Light-Speed performance',
      'Best for multiple heavy users & VR',
      'Dedicated point-to-point fiber lane',
      'Ultra Wi-Fi 6E High-Performance Router',
      'Premium 4-hour SLA tech response support'
    ],
    color: 'cyan'
  }
];
