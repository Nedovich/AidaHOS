/** Guest session cookie name — set after a successful portal login, read on load. */
export const GUEST_COOKIE = 'aida_guest';

/**
 * How long a guest keeps internet access past the stored check-out date. The PMS stores
 * check-out at midnight while guests leave around noon and often linger, so a full day of
 * grace is the working definition of "the stay is over".
 *
 * One value drives all four places that need it: the login gate, the RADIUS
 * Session-Timeout, the session cookie's expiry, and the cookie freshness check on load.
 * They must agree — if the cookie died first, the auto-login after a popup kick would drop
 * the guest back to the manual form while they were still entitled to be online.
 */
export const CHECKOUT_GRACE_MS = 24 * 60 * 60 * 1000;
