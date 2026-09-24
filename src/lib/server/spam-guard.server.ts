/**
 * Leiser Spam-Schutz ohne Captcha und ohne Cookies: Honeypot, Mindest-
 * Ausfüllzeit und ein IP-Limit im Speicher (die IP wird nicht gespeichert).
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MIN_FILL_MS = 4000;
const MAX_TRACKED_IPS = 5000;

const recentByIp = new Map<string, number[]>();

export type SpamVerdict = "ok" | "bot" | "rate_limited";

export function checkSpam(input: {
  website: string;
  startedAt: number;
  ip: string;
  now?: number;
}): SpamVerdict {
  const now = input.now ?? Date.now();
  if (input.website.trim() !== "" || now - input.startedAt < MIN_FILL_MS) return "bot";

  const recent = (recentByIp.get(input.ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    recentByIp.set(input.ip, recent);
    return "rate_limited";
  }
  recent.push(now);
  recentByIp.set(input.ip, recent);

  if (recentByIp.size > MAX_TRACKED_IPS) {
    for (const [ip, times] of recentByIp) {
      if (times.every((t) => now - t >= WINDOW_MS)) recentByIp.delete(ip);
    }
  }
  return "ok";
}
