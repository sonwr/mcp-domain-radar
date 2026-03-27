# mcp-domain-radar

> **AI가 이름을 추천할 때, 도메인까지 같이 확인해주는 MCP 서버**
>
> Name your brand. Check the domain. All in one conversation.

---

## Why?

We've all been there:

```
You:    "서비스 이름 추천해줘"
AI:     "NexFlow는 어떨까요?"
You:     nexflow.com 검색... 이미 선점됨
You:    "다른 거"
AI:     "DataPulse는요?"
You:     datapulse.com 검색... 역시 선점됨
You:    "..."
        (이걸 10번 반복)
```

**mcp-domain-radar**를 설치하면, AI가 이름을 떠올리는 순간 도메인 가용 여부를 바로 확인합니다. 더 이상 브라우저와 터미널을 왔다갔다 할 필요가 없습니다.

---

## Quick Start

**1. Install**

```bash
npm install -g mcp-domain-radar
```

**2. Connect to Claude Code**

```bash
claude mcp add domain-radar -- mcp-domain-radar
```

**3. Use it** — just talk to Claude naturally:

```
"I'm building a task management app for developers.
 Help me find a brand name with an available domain."
```

That's it. Claude will automatically check domains as it brainstorms.

---

## What You Get

### 4 Tools — automatically used by Claude during conversations

| Tool | What it does |
|------|-------------|
| **`check_domains`** | Check exact domain names — `"Is mybrand.com taken?"` |
| **`check_brand_domains`** | Check one name across 17+ TLDs at once — `"Check nexflow across all popular TLDs"` |
| **`suggest_and_check_domains`** | Generate name variations from keywords & check all — `"Brainstorm names from keywords: pulse, data, flow"` |
| **`list_supported_tlds`** | Show all TLDs this server supports |

### 30+ TLDs — including trending ones

| Category | TLDs |
|----------|------|
| **Classic** | `.com` `.net` `.org` |
| **Tech / Startup** | `.io` `.dev` `.app` `.co` `.tech` `.sh` |
| **Trending** | **`.ai`** **`.gg`** **`.so`** `.me` `.xyz` `.cc` `.to` `.run` `.cloud` `.tv` |
| **Creative** | `.lol` `.wtf` `.cool` `.world` `.studio` `.design` |
| **Commerce** | `.online` `.site` `.store` |
| **Country** | `.kr` |

---

## Examples

### "이 이름 도메인 되나요?"
```
You: Check if "nexflow" is available — try .com, .io, .ai, and .dev
```
```
AVAILABLE:
  + nexflow.dev
  + nexflow.ai

TAKEN:
  - nexflow.com
  - nexflow.io

--- 2 available / 2 taken / 0 unknown ---
```

### "키워드로 이름 만들어줘"
```
You: I need a name for an AI code review tool.
     Keywords: code, review, pulse, scan.
     Find me names with available domains.
```
```
Generated 20 name variations from: code, review, pulse, scan
Checking .com .io .ai .dev .app .co for each

+ codepulse (compound) — available: .dev, .ai | taken: .com, .io
+ scanflow (suffix) — available: .ai, .dev, .app | taken: .com
+ getpulse (prefix) — available: .dev, .co | taken: .com, .io, .ai
+ revscan (blend) — available: .com, .io, .ai, .dev, .app, .co
- codelab (suffix) — all checked TLDs taken

TOP PICKS (have available domains):
  revscan → revscan.com, revscan.io, revscan.ai, revscan.dev, revscan.app, revscan.co
  codepulse → codepulse.dev, codepulse.ai
  scanflow → scanflow.ai, scanflow.dev, scanflow.app
```

### Guided workflow with the `brand-naming` prompt
The server includes a built-in prompt template that walks you through the full naming process step by step.

---

## How It Works

```
Your question
    │
    ▼
  Claude brainstorms names
    │
    ▼
  mcp-domain-radar
    ├── 1. DNS lookup (fast — if it resolves, it's taken)
    └── 2. WHOIS query (definitive — checks registration status)
    │
    ▼
  Only names with available domains are recommended
```

- **No API keys required** — uses native DNS and WHOIS protocols
- **Rate-limit friendly** — batches queries with delays
- **Works offline for DNS checks** — WHOIS requires network

---

## Manual Setup (alternative)

If you prefer to configure manually, add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "domain-radar": {
      "command": "mcp-domain-radar"
    }
  }
}
```

Or run from source:

```json
{
  "mcpServers": {
    "domain-radar": {
      "command": "node",
      "args": ["/path/to/mcp-domain-radar/dist/index.js"]
    }
  }
}
```

---

## Development

```bash
git clone https://github.com/sonwr/mcp-domain-radar.git
cd mcp-domain-radar
npm install
npm run build
```

Test locally:

```bash
claude mcp add domain-radar -- node ./dist/index.js
```

---

## Roadmap

- [ ] Domain price estimation per registrar
- [ ] Expiring / recently dropped domain suggestions
- [ ] Registrar API integration (Namecheap, Cloudflare, GoDaddy)
- [ ] Internationalized domain name (IDN) support
- [ ] More TLDs and WHOIS servers

Contributions welcome! Open an issue or PR.

---

## License

MIT
