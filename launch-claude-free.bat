@echo off
title Claude Code - Free (OpenRouter)
echo ============================================
echo   Claude Code - Free via OpenRouter
echo ============================================
echo.

:: Set environment variables
set ANTHROPIC_BASE_URL=https://openrouter.ai/api
set ANTHROPIC_AUTH_TOKEN=YOUR_OPENROUTER_API_KEY_HERE
set ANTHROPIC_API_KEY=

echo [OK] Environment configured for OpenRouter
echo [OK] Using free models
echo.
echo Available free models (use --model flag):
echo   - qwen/qwen3-coder:free          (BEST for coding)
echo   - nvidia/nemotron-3-super-120b-a12b:free  (120B reasoning)
echo   - google/gemma-4-31b-it:free      (Google's latest)
echo   - meta-llama/llama-3.3-70b-instruct:free  (Meta's 70B)
echo   - openai/gpt-oss-120b:free        (OpenAI open model)
echo   - nousresearch/hermes-3-llama-3.1-405b:free (405B!)
echo.
echo Starting Claude Code with Qwen3 Coder...
echo (If rate limited, try: claude --model "google/gemma-4-31b-it:free")
echo.

claude --model "qwen/qwen3-coder:free"
