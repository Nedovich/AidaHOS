import { redirect } from 'next/navigation';

// Bare visits land on the configured demo hotel. In production the MikroTik
// captive portal redirects guests straight to /[hotelSlug].
export default function Root() {
  redirect(`/${process.env.NEXT_PUBLIC_GUEST_DEFAULT_HOTEL ?? 'demo'}`);
}
