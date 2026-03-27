#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  checkDomains,
  DEFAULT_TLDS,
  getSupportedTlds,
  type DomainResult,
} from "./checker.js";
import { generateVariations } from "./variations.js";

const server = new McpServer({
  name: "domain-radar",
  version: "0.1.0",
  description:
    "Check domain availability in real-time during brand naming sessions",
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatResults(results: DomainResult[]): string {
  const lines: string[] = [];

  const available = results.filter((r) => r.available === true);
  const taken = results.filter((r) => r.available === false);
  const unknown = results.filter((r) => r.available === null);

  if (available.length > 0) {
    lines.push("AVAILABLE:");
    for (const r of available) {
      lines.push(`  + ${r.domain}`);
    }
  }

  if (taken.length > 0) {
    lines.push("\nTAKEN:");
    for (const r of taken) {
      lines.push(`  - ${r.domain}`);
    }
  }

  if (unknown.length > 0) {
    lines.push("\nUNABLE TO CHECK:");
    for (const r of unknown) {
      lines.push(`  ? ${r.domain} — ${r.detail || "unknown error"}`);
    }
  }

  lines.push(
    `\n--- ${available.length} available / ${taken.length} taken / ${unknown.length} unknown ---`
  );

  return lines.join("\n");
}

// ── Tool: check_domains ─────────────────────────────────────────────────────

server.tool(
  "check_domains",
  `Check availability of specific domain names.
Use this when you already have exact domain names to verify (e.g. "mybrand.com", "mybrand.ai").
Checks via DNS + WHOIS for accurate results.`,
  {
    domains: z
      .array(z.string())
      .describe(
        'Full domain names including TLD, e.g. ["cool.ai", "cool.com", "cool.dev"]'
      ),
  },
  async ({ domains }) => {
    const results = await checkDomains(domains);
    return { content: [{ type: "text", text: formatResults(results) }] };
  }
);

// ── Tool: check_brand_domains ───────────────────────────────────────────────

server.tool(
  "check_brand_domains",
  `Check domain availability for a single brand name across many popular TLDs at once.
Default TLDs: .com .io .dev .app .ai .co .so .me .xyz .tech .net .sh .run .cloud .to .gg .cc
Supports 30+ TLDs including trending ones like .ai, .gg, .so, .lol, .wtf, .cool.`,
  {
    name: z
      .string()
      .describe('Brand / product / service name without TLD, e.g. "nexflow"'),
    tlds: z
      .array(z.string())
      .optional()
      .describe(
        "Custom list of TLDs to check. Omit to use the default popular set."
      ),
  },
  async ({ name, tlds }) => {
    const targetTlds = tlds && tlds.length > 0 ? tlds : DEFAULT_TLDS;
    const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, "");

    if (!cleanName) {
      return {
        content: [
          {
            type: "text",
            text: "Error: name must contain at least one alphanumeric character.",
          },
        ],
      };
    }

    const domains = targetTlds.map((tld) => `${cleanName}.${tld}`);
    const results = await checkDomains(domains);

    const header = `Domain availability for "${cleanName}" across ${targetTlds.length} TLDs:\n`;
    return {
      content: [{ type: "text", text: header + formatResults(results) }],
    };
  }
);

// ── Tool: suggest_and_check_domains ─────────────────────────────────────────

server.tool(
  "suggest_and_check_domains",
  `Generate brand-name variations from keywords, then check domain availability for each.
Creates variations using prefixes (get-, try-, my-…), suffixes (-hq, -lab, -flow…),
compounds (keyword1+keyword2), and portmanteau blends.
Great for brainstorming when obvious names are taken.`,
  {
    keywords: z
      .array(z.string())
      .describe(
        'Root keywords to generate variations from, e.g. ["pulse", "data"]'
      ),
    tlds: z
      .array(z.string())
      .optional()
      .describe("TLDs to check per variation. Default: com, io, ai, dev, app, co"),
    max_variations: z
      .number()
      .optional()
      .describe("Max name variations to generate & check. Default: 20"),
  },
  async ({ keywords, tlds, max_variations }) => {
    const targetTlds =
      tlds && tlds.length > 0 ? tlds : ["com", "io", "ai", "dev", "app", "co"];
    const maxVar = max_variations ?? 20;

    const variations = generateVariations(keywords).slice(0, maxVar);

    if (variations.length === 0) {
      return {
        content: [
          { type: "text", text: "No valid name variations could be generated from the given keywords." },
        ],
      };
    }

    const allDomains: string[] = [];
    for (const v of variations) {
      for (const tld of targetTlds) {
        allDomains.push(`${v.name}.${tld}`);
      }
    }

    const results = await checkDomains(allDomains);

    // Group results by name
    const lines: string[] = [
      `Generated ${variations.length} name variations from: ${keywords.join(", ")}`,
      `Checking ${targetTlds.map((t) => "." + t).join(" ")} for each\n`,
    ];

    const namesWithAvailable: string[] = [];

    for (const v of variations) {
      const nameResults = results.filter((r) =>
        r.domain.startsWith(v.name + ".")
      );
      const availTlds = nameResults
        .filter((r) => r.available === true)
        .map((r) => "." + r.domain.split(".").pop());
      const takenTlds = nameResults
        .filter((r) => r.available === false)
        .map((r) => "." + r.domain.split(".").pop());

      if (availTlds.length > 0) {
        namesWithAvailable.push(v.name);
        const takenPart =
          takenTlds.length > 0 ? ` | taken: ${takenTlds.join(", ")}` : "";
        lines.push(
          `+ ${v.name} (${v.type}) — available: ${availTlds.join(", ")}${takenPart}`
        );
      } else {
        lines.push(`- ${v.name} (${v.type}) — all checked TLDs taken`);
      }
    }

    if (namesWithAvailable.length > 0) {
      lines.push(`\nTOP PICKS (have available domains):`);
      for (const name of namesWithAvailable.slice(0, 10)) {
        const nameResults = results.filter((r) =>
          r.domain.startsWith(name + ".")
        );
        const avail = nameResults
          .filter((r) => r.available === true)
          .map((r) => r.domain);
        lines.push(`  ${name} → ${avail.join(", ")}`);
      }
    } else {
      lines.push(
        "\nNo names found with available domains. Try different keywords or broader TLDs."
      );
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ── Tool: list_supported_tlds ───────────────────────────────────────────────

server.tool(
  "list_supported_tlds",
  "List all TLDs that this server can check via WHOIS, grouped by category.",
  {},
  async () => {
    const tlds = getSupportedTlds();
    const text = [
      `Supported TLDs (${tlds.length} total):`,
      `  ${tlds.map((t) => "." + t).join(", ")}`,
      "",
      `Default TLDs checked by check_brand_domains:`,
      `  ${DEFAULT_TLDS.map((t) => "." + t).join(", ")}`,
    ].join("\n");

    return { content: [{ type: "text", text }] };
  }
);

// ── Prompt: brand-naming ────────────────────────────────────────────────────

server.prompt(
  "brand-naming",
  "Guided brand naming workflow with domain availability checking",
  {
    concept: z.string().describe("What the product/service does (1-2 sentences)"),
    style: z
      .string()
      .optional()
      .describe("Naming style: techy, minimal, playful, professional, bold"),
  },
  ({ concept, style }) => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `I need a brand name for this concept: ${concept}
${style ? `Preferred naming style: ${style}` : ""}

Follow this process:
1. Brainstorm 10+ creative name ideas
2. Use check_brand_domains to check each name across popular TLDs
3. For names that are ALL taken, use suggest_and_check_domains with related keywords
4. Present a shortlist of names that have at least .com, .ai, or .io available
5. Give your top 3 recommendations with reasoning

Only recommend names where a good domain is actually available.`,
        },
      },
    ],
  })
);

// ── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start domain-radar MCP server:", error);
  process.exit(1);
});
