import {
  Building2,
  Home,
  Settings,
  Shield,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

export type StaffProfileDefinition = {
  id: string;
  name: readonly [string, string];
  icon: LucideIcon;
  color: string;
  bg: string;
  count: number;
  bandwidth: readonly [string, string];
  devices: number;
  hours: readonly [string, string];
  vlan: string;
  sharedUsers: string;
  rxRate: string;
  txRate: string;
  sessionTimeout: string;
  idleTimeout: string;
  macCookie: boolean;
};

export const STAFF_PROFILES: StaffProfileDefinition[] = [
  { id: 'mgmt', name: ['Yönetim', 'Management'], icon: Building2, color: 'var(--accent)', bg: 'var(--accent-soft)', count: 4, bandwidth: ['Sınırsız', 'Unlimited'], devices: 3, hours: ['7/24', '24/7'], vlan: 'VLAN 10', sharedUsers: '3', rxRate: '', txRate: '', sessionTimeout: 'none', idleTimeout: 'none', macCookie: true },
  { id: 'front', name: ['Resepsiyon', 'Front Desk'], icon: Users, color: 'var(--info)', bg: 'var(--info-soft)', count: 9, bandwidth: ['20 Mbps', '20 Mbps'], devices: 2, hours: ['07:00–23:00', '07:00–23:00'], vlan: 'VLAN 20', sharedUsers: '1', rxRate: '20M', txRate: '20M', sessionTimeout: '16:00:00', idleTimeout: '00:15:00', macCookie: true },
  { id: 'house', name: ['Kat Hizmetleri', 'Housekeeping'], icon: Home, color: 'var(--purple)', bg: 'var(--purple-soft)', count: 14, bandwidth: ['10 Mbps', '10 Mbps'], devices: 1, hours: ['08:00–20:00', '08:00–20:00'], vlan: 'VLAN 30', sharedUsers: '1', rxRate: '10M', txRate: '10M', sessionTimeout: '12:00:00', idleTimeout: '00:10:00', macCookie: false },
  { id: 'fnb', name: ['Mutfak & F&B', 'Kitchen & F&B'], icon: UtensilsCrossed, color: 'var(--warning)', bg: 'var(--warning-soft)', count: 11, bandwidth: ['10 Mbps', '10 Mbps'], devices: 1, hours: ['06:00–24:00', '06:00–24:00'], vlan: 'VLAN 30', sharedUsers: '1', rxRate: '10M', txRate: '10M', sessionTimeout: '18:00:00', idleTimeout: '00:10:00', macCookie: true },
  { id: 'maint', name: ['Teknik Servis', 'Maintenance'], icon: Settings, color: 'var(--success)', bg: 'var(--success-soft)', count: 5, bandwidth: ['15 Mbps', '15 Mbps'], devices: 2, hours: ['7/24', '24/7'], vlan: 'VLAN 40', sharedUsers: '2', rxRate: '15M', txRate: '15M', sessionTimeout: 'none', idleTimeout: '00:30:00', macCookie: true },
  { id: 'sec', name: ['Güvenlik', 'Security'], icon: Shield, color: 'var(--danger)', bg: 'var(--danger-soft)', count: 6, bandwidth: ['15 Mbps', '15 Mbps'], devices: 2, hours: ['7/24', '24/7'], vlan: 'VLAN 40', sharedUsers: '2', rxRate: '15M', txRate: '15M', sessionTimeout: 'none', idleTimeout: 'none', macCookie: false },
];

export function getStaffProfile(profileId: string) {
  return STAFF_PROFILES.find((profile) => profile.id === profileId);
}
