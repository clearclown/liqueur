<div align="center">

# Project Liquid

**AI-Powered Dynamic UI Generation**

*Transform natural language into secure, production-ready dashboards*

[![Release](https://img.shields.io/github/v/release/clearclown/liqueur?style=flat-square&color=blue)](https://github.com/clearclown/liqueur/releases)
[![Tests](https://img.shields.io/badge/tests-360%20passed-brightgreen?style=flat-square)](https://github.com/clearclown/liqueur/actions)
[![Coverage](https://img.shields.io/badge/coverage-97.76%25-brightgreen?style=flat-square)](https://github.com/clearclown/liqueur)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

[Quick Start](#-quick-start) · [Documentation](#-documentation) · [Why Liquid?](#-why-liquid) · [Contributing](#-contributing)

</div>

---

## The Problem

Traditional AI UI generation tools let AI write JavaScript/SQL directly:

```
User → AI → JavaScript/SQL → Execute → Security vulnerabilities
```

This creates **XSS**, **SQL injection**, and **arbitrary code execution** risks.

## The Solution

Liquid takes a different approach: **AI generates JSON schemas only**.

```
User → AI → JSON Schema → Rust validation → Safe ORM → Secure execution
```

- No code execution from AI output
- Strict type validation (unknown fields = immediate error)
- Row-Level Security enforced by default

---

## Quick Start

### Prerequisites

- Node.js 20+
- API key from: DeepSeek, OpenAI, Anthropic, or Gemini

### Setup

```bash
git clone https://github.com/clearclown/liqueur.git
cd liqueur && npm install
cp .env.example .env
```

### Configure AI Provider

```bash
# .env - Choose one:
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-your-key

# Or: anthropic, openai, gemini
```

### Run

```bash
npm run dev -w @liqueur/playground
# Open http://localhost:3000
```

### Generate Your First Dashboard

```bash
curl -X POST http://localhost:3000/api/liquid/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show monthly expenses as a bar chart",
    "metadata": {
      "tables": [{
        "name": "expenses",
        "columns": [
          {"name": "amount", "type": "decimal"},
          {"name": "month", "type": "date"}
        ]
      }]
    }
  }'
```

---

## Supported AI Providers

| Provider | Model | Cost/Request | Response Time |
|----------|-------|--------------|---------------|
| **DeepSeek** | deepseek-chat | ~$0.001 | 5-7s |
| Anthropic | claude-3-haiku | ~$0.0003 | 2-3s |
| Gemini | gemini-1.5-flash | ~$0.0002 | 1-2s |
| OpenAI | gpt-4o-mini | ~$0.0002 | 3-4s |
| GLM | glm-4 | ~$0.001 | 4-5s |
| Local | LM Studio | Free | Varies |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React/Next.js)                                   │
│  • Renders JSON schema as UI components                     │
│  • Chart, Table, Grid, Stack layouts                        │
└─────────────────────────────────────────────────────────────┘
                            ↓ JSON Schema
┌─────────────────────────────────────────────────────────────┐
│  Protocol Layer (TypeScript + Rust)                         │
│  • Strict type validation                                   │
│  • DataSource → ORM conversion                              │
└─────────────────────────────────────────────────────────────┘
                            ↓ Validated Query
┌─────────────────────────────────────────────────────────────┐
│  Backend (Rust/reinhardt-web)                               │
│  • Row-Level Security enforcement                           │
│  • Database query execution                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Packages

| Package | Description |
|---------|-------------|
| `@liqueur/protocol` | Core type definitions & validators |
| `@liqueur/react` | React component library |
| `@liqueur/ai-provider` | AI provider abstraction (6 providers) |
| `@liqueur/artifact-store` | Schema persistence |
| `@liqueur/auth` | Authentication & authorization |
| `@liqueur/db-adapter` | Database introspection |

---

## Why Liquid?

### Security First

- **No arbitrary code execution**: AI outputs JSON schemas only
- **Fail Fast**: Invalid schemas rejected immediately by Rust type system
- **Row-Level Security**: User permissions enforced on every query

### Developer Experience

- **Backend agnostic**: Works with existing Rust, Python, Go backends
- **Protocol oriented**: JSON Schema as the universal language
- **TDD enforced**: 97%+ test coverage required

### Production Ready

- **Rate limiting**: Built-in DDoS protection
- **Caching**: Optimized for performance
- **Multi-provider**: Switch AI providers without code changes

[Read the full philosophy →](docs/philosophy/why-liquid.md)

---

## Documentation

| Topic | Link |
|-------|------|
| Quick Start | [docs/tutorials/quickstart.md](docs/tutorials/quickstart.md) |
| Core Concepts | [docs/tutorials/concepts.md](docs/tutorials/concepts.md) |
| Philosophy | [docs/philosophy/why-liquid.md](docs/philosophy/why-liquid.md) |
| Architecture | [docs/architecture/](docs/architecture/) |
| API Reference | [docs/api/](docs/api/) |

---

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) first.

### Development

```bash
# Run tests
npm test

# Type check
npm run typecheck

# Lint & format
npm run lint && npm run format
```

### Requirements

- TDD mandatory (tests before implementation)
- 95%+ coverage required
- All CI checks must pass

---

## License

[MIT](LICENSE)

---

<div align="center">

**[GitHub](https://github.com/clearclown/liqueur)** · **[Issues](https://github.com/clearclown/liqueur/issues)** · **[Releases](https://github.com/clearclown/liqueur/releases)**

Made with TypeScript, Rust, and AI

</div>
