import { GuestApp } from '@/components/guest/guest-app';

// Guest portal for a hotel. In production the MikroTik captive portal redirects
// guests here. Phase 5 wires hotspot login + RADIUS; today this is the visual app
// with mock content and per-hotel branding (warm Mediterranean default).
export default function GuestHome() {
  return <GuestApp />;
}
