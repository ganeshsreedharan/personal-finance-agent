# 🏠 Local LLM Setup Guide (Ollama)

Run your finance agent **completely offline** with privacy and zero API costs!

---

## 🚀 Quick Start (5 minutes)

### Step 1: Install Ollama

```bash
# macOS (Homebrew)
brew install ollama

# Or download installer from: https://ollama.com/download
```

### Step 2: Start Ollama Server

```bash
# Start Ollama (runs in background)
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

### Step 3: Pull a Model

```bash
# Recommended for finance agent (fast & accurate)
ollama pull llama3.2:3b

# Check installed models
ollama list
```

### Step 4: Test the Model

```bash
# Test manually
ollama run llama3.2:3b "Extract transaction: Rent 1250€ paid today"

# Test API
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:3b",
  "prompt": "What is 1250 + 45.50?",
  "stream": false
}'
```

---

## 🔧 Integration with Mastra

### Option 1: Environment Variable (Easiest)

Add to `.env.development`:

```bash
# LLM Provider: 'gemini' or 'ollama'
LLM_PROVIDER=ollama

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

Then your agent will automatically use Ollama instead of Gemini!

### Option 2: Code Changes (Manual)

Update `src/mastra/agents/finance.agent.ts`:

```typescript
import { createOllama } from 'ollama-ai-provider-v2';

// Create Ollama provider instance
const ollama = createOllama({ baseURL: 'http://localhost:11434/api' });

// Use as model in Agent
model: ollama('llama3.2:3b'),
```

**Note:** Uses the official `ollama-ai-provider-v2` AI SDK package (requires zod v4). The base URL must end with `/api` (Ollama's native API).

---

## 📊 Model Comparison

| Model | Size | RAM | Speed | Quality | Best For |
|-------|------|-----|-------|---------|----------|
| **llama3.2:3b** | 2.0GB | 4GB | ⚡⚡⚡ | ⭐⭐⭐⭐ | Finance agent (recommended) |
| llama3.1:8b | 4.7GB | 8GB | ⚡⚡ | ⭐⭐⭐⭐⭐ | Better quality, slower |
| gemma2:2b | 1.6GB | 3GB | ⚡⚡⚡⚡ | ⭐⭐⭐ | Ultra-fast, lightweight |
| mistral:7b | 4.1GB | 8GB | ⚡⚡ | ⭐⭐⭐⭐ | General purpose |

**Recommendation:** Start with `llama3.2:3b` - best balance for finance tracking.

---

## 💰 Cost Comparison

| Provider | Cost per 1000 transactions | Privacy | Offline | Speed |
|----------|----------------------------|---------|---------|-------|
| **Ollama (Local)** | $0 (FREE) | ✅ Full | ✅ Yes | ~2-3s |
| Gemini Flash | ~$0.30 | ❌ Cloud | ❌ No | ~1-2s |

**Savings:** ~$3.60/year for 1000 transactions/month

---

## 🔐 Privacy Benefits

**With Ollama (Local LLM):**
- ✅ All financial data stays on your machine
- ✅ No data sent to Google/OpenAI/Anthropic
- ✅ Works completely offline
- ✅ No API keys needed
- ✅ No rate limits
- ✅ Full control

**With Gemini (Cloud):**
- ❌ Data sent to Google servers
- ❌ Requires internet
- ❌ API key management
- ⚠️ Rate limits (15 req/min)

---

## 🎯 Testing Local LLM

### Test 1: Parse Transaction
```bash
ollama run llama3.2:3b "Parse transaction: Groceries 45.50€ at REWE"
```

Expected output should include:
- Amount: 45.50
- Currency: EUR
- Vendor: REWE
- Category: Groceries

### Test 2: Categorization
```bash
ollama run llama3.2:3b "Categorize: Rent 1250€"
```

Expected: Housing-Rent, recurring: yes

### Test 3: Speed Test
```bash
time ollama run llama3.2:3b "What is 100 + 200?"
```

Should respond in ~1-3 seconds.

---

## 🐛 Troubleshooting

### Ollama not starting?
```bash
# Check if port 11434 is in use
lsof -i :11434

# Restart Ollama
pkill ollama
ollama serve
```

### Model too slow?
- Try smaller model: `ollama pull gemma2:2b`
- Close other apps to free RAM
- Check CPU usage: `top`

### Out of memory?
- Use smaller model (gemma2:2b uses only 1.5GB)
- Close other applications
- Increase swap space

### Model not found?
```bash
# List installed models
ollama list

# Pull model again
ollama pull llama3.2:3b
```

---

## 🔄 Switching Between Local & Cloud

You can easily switch between Ollama (local) and Gemini (cloud):

### Use Local LLM:
```bash
# .env.development
LLM_PROVIDER=ollama
```

### Use Cloud LLM:
```bash
# .env.development
LLM_PROVIDER=gemini
```

Then restart: `npm run dev`

---

## 📈 Performance Tips

1. **Keep Ollama running** - Start it at login for instant responses
2. **Use SSD** - Much faster model loading
3. **Adequate RAM** - 8GB minimum for llama3.2:3b
4. **Close other apps** - More RAM = faster inference
5. **Pre-load model** - Run `ollama run llama3.2:3b` once at startup

---

## 🎓 Next Steps

1. Install Ollama
2. Pull llama3.2:3b model
3. Set `LLM_PROVIDER=ollama` in `.env.development`
4. Restart bot: `npm run dev`
5. Test with: "Rent 1250€"
6. Compare speed & accuracy with Gemini

---

## 📚 Resources

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Ollama Models Library](https://ollama.com/library)
- [Llama 3.2 Info](https://ollama.com/library/llama3.2)
- [Performance Tuning](https://github.com/ollama/ollama/blob/main/docs/faq.md)

---

**Questions?** Check the troubleshooting section or ask!
