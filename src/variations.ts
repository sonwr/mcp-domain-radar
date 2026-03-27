const PREFIXES = [
  "get",
  "try",
  "use",
  "go",
  "my",
  "the",
  "hey",
  "with",
  "on",
  "re",
  "un",
];

const SUFFIXES = [
  "app",
  "hq",
  "lab",
  "labs",
  "hub",
  "up",
  "now",
  "go",
  "ly",
  "ify",
  "fy",
  "er",
  "ai",
  "x",
  "os",
  "kit",
  "box",
  "base",
  "flow",
  "wave",
  "stack",
  "craft",
  "nest",
  "spot",
  "pad",
  "dock",
  "port",
  "sync",
  "link",
  "tap",
  "zen",
  "way",
];

export interface NameVariation {
  name: string;
  type: "original" | "prefix" | "suffix" | "compound" | "blend";
}

/**
 * Generate brand name variations from a list of keywords.
 */
export function generateVariations(keywords: string[]): NameVariation[] {
  const variations: NameVariation[] = [];
  const seen = new Set<string>();

  function add(name: string, type: NameVariation["type"]) {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean && clean.length >= 3 && clean.length <= 24 && !seen.has(clean)) {
      seen.add(clean);
      variations.push({ name: clean, type });
    }
  }

  const cleaned = keywords.map((kw) => kw.toLowerCase().replace(/[^a-z0-9]/g, ""));

  // Original keywords as-is
  for (const kw of cleaned) {
    add(kw, "original");
  }

  // Prefix + keyword
  for (const kw of cleaned) {
    for (const prefix of PREFIXES) {
      add(prefix + kw, "prefix");
    }
  }

  // Keyword + suffix
  for (const kw of cleaned) {
    for (const suffix of SUFFIXES) {
      add(kw + suffix, "suffix");
    }
  }

  // Two-keyword compounds (AB, BA)
  if (cleaned.length >= 2) {
    for (let i = 0; i < cleaned.length; i++) {
      for (let j = 0; j < cleaned.length; j++) {
        if (i !== j) {
          add(cleaned[i] + cleaned[j], "compound");
        }
      }
    }
  }

  // Blends: first part of A + last part of B (portmanteau)
  if (cleaned.length >= 2) {
    for (let i = 0; i < cleaned.length; i++) {
      for (let j = 0; j < cleaned.length; j++) {
        if (i !== j && cleaned[i].length >= 3 && cleaned[j].length >= 3) {
          // First 3-4 chars + last 3-4 chars
          add(cleaned[i].slice(0, 3) + cleaned[j].slice(-3), "blend");
          add(cleaned[i].slice(0, 4) + cleaned[j].slice(-3), "blend");
          add(cleaned[i].slice(0, 3) + cleaned[j].slice(-4), "blend");
        }
      }
    }
  }

  return variations;
}
