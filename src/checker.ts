import dns from "node:dns/promises";
import net from "node:net";

// WHOIS servers by TLD
const WHOIS_SERVERS: Record<string, string> = {
  // Classic
  com: "whois.verisign-grs.com",
  net: "whois.verisign-grs.com",
  org: "whois.pir.org",
  // Tech / Startup
  io: "whois.nic.io",
  dev: "whois.nic.google",
  app: "whois.nic.google",
  co: "whois.nic.co",
  tech: "whois.nic.tech",
  sh: "whois.nic.sh",
  // AI / Trending
  ai: "whois.nic.ai",
  so: "whois.nic.so",
  me: "whois.nic.me",
  xyz: "whois.nic.xyz",
  to: "whois.tonic.to",
  run: "whois.nic.run",
  cloud: "whois.nic.cloud",
  tools: "whois.nic.tools",
  studio: "whois.nic.studio",
  design: "whois.nic.design",
  // More trending
  gg: "whois.gg",
  cc: "ccwhois.verisign-grs.com",
  tv: "tvwhois.verisign-grs.com",
  lol: "whois.nic.lol",
  wtf: "whois.nic.wtf",
  cool: "whois.nic.cool",
  world: "whois.nic.world",
  online: "whois.nic.online",
  site: "whois.nic.site",
  store: "whois.nic.store",
  // Country
  kr: "whois.kr",
};

// Patterns that indicate domain is NOT registered
const NOT_FOUND_PATTERNS = [
  "no match for",
  "not found",
  "no data found",
  "domain not found",
  "no entries found",
  "no object found",
  "nothing found",
  "status: free",
  "status: available",
  "% no matching objects found",
  "is available for purchase",
  "no information available",
  "domain name not known",
  "above domain name is not registered",
];

// Patterns that indicate domain IS registered
const REGISTERED_PATTERNS = [
  "domain name:",
  "registrar:",
  "creation date:",
  "created:",
  "registered on:",
  "registration date:",
  "registry domain id:",
  "registrant:",
  "name server:",
  "nserver:",
];

export interface DomainResult {
  domain: string;
  available: boolean | null; // null = unable to determine
  method: "dns" | "whois" | "error";
  detail?: string;
}

async function whoisQuery(domain: string, server: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(43, server, () => {
      socket.write(domain + "\r\n");
    });

    let data = "";
    socket.on("data", (chunk) => {
      data += chunk.toString();
    });
    socket.on("end", () => resolve(data));
    socket.on("error", reject);

    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error("WHOIS query timeout (10s)"));
    }, 10000);

    socket.on("close", () => clearTimeout(timeout));
  });
}

function parseWhoisAvailability(response: string): boolean | null {
  const lower = response.toLowerCase().trim();

  if (!lower || lower.length < 5) return null;

  for (const pattern of NOT_FOUND_PATTERNS) {
    if (lower.includes(pattern)) return true;
  }

  for (const pattern of REGISTERED_PATTERNS) {
    if (lower.includes(pattern)) return false;
  }

  return null; // ambiguous
}

export async function checkDomain(domain: string): Promise<DomainResult> {
  const tld = domain.split(".").pop()?.toLowerCase();
  if (!tld) {
    return { domain, available: null, method: "error", detail: "Invalid domain format" };
  }

  // Step 1: Quick DNS check — if it resolves, the domain is definitely taken
  try {
    const results = await dns.resolve(domain);
    if (results && results.length > 0) {
      return { domain, available: false, method: "dns", detail: "DNS records found (in use)" };
    }
  } catch {
    // DNS didn't resolve — could be available or just not configured. Continue to WHOIS.
  }

  // Step 2: WHOIS check for definitive answer
  const server = WHOIS_SERVERS[tld];
  if (!server) {
    return { domain, available: null, method: "error", detail: `No WHOIS server known for .${tld}` };
  }

  try {
    const response = await whoisQuery(domain, server);
    const available = parseWhoisAvailability(response);

    if (available === null) {
      return { domain, available: null, method: "whois", detail: "Could not parse WHOIS response" };
    }

    return { domain, available, method: "whois" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { domain, available: null, method: "error", detail: `WHOIS failed: ${msg}` };
  }
}

/**
 * Check multiple domains with batching and rate-limit delays.
 */
export async function checkDomains(domains: string[]): Promise<DomainResult[]> {
  const BATCH_SIZE = 5;
  const BATCH_DELAY_MS = 1000;

  const results: DomainResult[] = [];

  for (let i = 0; i < domains.length; i += BATCH_SIZE) {
    const batch = domains.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(checkDomain));
    results.push(...batchResults);

    // Delay between batches to avoid WHOIS rate limits
    if (i + BATCH_SIZE < domains.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  return results;
}

/** Popular TLDs checked by default */
export const DEFAULT_TLDS = [
  "com",
  "io",
  "dev",
  "app",
  "ai",
  "co",
  "so",
  "me",
  "xyz",
  "tech",
  "net",
  "sh",
  "run",
  "cloud",
  "to",
  "gg",
  "cc",
];

export function getSupportedTlds(): string[] {
  return Object.keys(WHOIS_SERVERS);
}
