# Local LLM Setup (Ollama)

Run the finance agent **completely offline** — full privacy, zero API costs.

---

## Quick Start

### 1. Install Ollama

```bash
# macOS
brew install ollama

# Or download from: https://ollama.com/download
```

### 2. Start Ollama & Pull a Model

```bash
ollama serve

# Recommended model
ollama pull qwen2.5:14b-instruct

# Verify
ollama list
```

### 3. Configure Environment

In `.env.development`:

```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b-instruct
```

### 4. Start the Bot

```bash
npm run dev
```

---

## Model Recommendations

| Model | Size | RAM | Notes |
|-------|------|-----|-------|
| **qwen2.5:14b-instruct** | 9GB | 16GB | Best quality for finance (current default) |
| qwen2.5:7b | 4.7GB | 8GB | Good balance of speed and quality |
| llama3.2:3b | 2.0GB | 4GB | Fast, lightweight |
| gemma2:2b | 1.6GB | 3GB | Ultra-fast, minimal RAM |

---

## Known Ollama Quirks

These are handled automatically by the bot:

- **Empty responses after tool calls** — `extractToolReply()` constructs replies from tool results
- **Retry logic** — if model returns empty, handler retries with rephrased prompt
- **Language mixing** — agent instructions enforce English-only responses
- **Wrong year** — today's date injected via context string

---

## Switching Providers

```bash
# Local
LLM_PROVIDER=ollama

# Cloud
LLM_PROVIDER=gemini
```

Restart with `npm run dev` after changing.

---

## Troubleshooting

**Ollama not starting?**
```bash
lsof -i :11434    # Check if port is in use
pkill ollama && ollama serve
```

**Too slow?** Try a smaller model: `ollama pull qwen2.5:7b`

**Out of memory?** Use `gemma2:2b` (1.5GB) or close other apps.

**Model not found?** `ollama list` to check installed models.
