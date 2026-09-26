import { lookup } from "dns/promises";
import { isIP } from "net";

// Protection SSRF : le serveur ne doit pas pouvoir être utilisé pour joindre
// le réseau interne (localhost, IP privées, métadonnées cloud...).
// Les instances auto-hébergées qui ont besoin de flux/webhooks locaux
// peuvent désactiver le contrôle avec ALLOW_PRIVATE_URLS=true.

const MAX_REDIRECTS = 5;

export class UnsafeUrlError extends Error {}

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local / métadonnées cloud
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast + réservé
  );
}

function isPrivateIP(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);

  const lower = ip.toLowerCase();
  // IPv4 mappée en IPv6 (::ffff:127.0.0.1)
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);

  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") || // unique local
    lower.startsWith("fe80") || // link-local
    lower.startsWith("ff") // multicast
  );
}

async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError(`Protocole non autorisé : ${url.protocol}`);
  }
  if (process.env.ALLOW_PRIVATE_URLS === "true") return;

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [hostname]
    : (await lookup(hostname, { all: true })).map((entry) => entry.address);

  if (addresses.length === 0 || addresses.some(isPrivateIP)) {
    throw new UnsafeUrlError(`Adresse non autorisée : ${url.hostname}`);
  }
}

/**
 * fetch() qui refuse les adresses internes, y compris après redirection.
 */
export async function safeFetch(
  input: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 10_000, ...rest } = init;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new UnsafeUrlError(`URL invalide : ${input}`);
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);

    const response = await fetch(url, {
      ...rest,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    return response;
  }

  throw new Error("Trop de redirections");
}
