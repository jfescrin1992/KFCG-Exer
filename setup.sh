#!/usr/bin/env bash

# KFCG ExerFit Auto Setup Script for macOS & Linux
echo "======================================================"
echo "  KFCG EXERFIT - AUTOMATED LOCAL & SERVER SETUP"
echo "======================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ [ERROR] Node.js is not installed."
    echo "Please download and install Node.js from https://nodejs.org/"
    exit 1
fi

echo "📦 [1/3] Installing dependencies..."
npm install

echo ""
echo "⚙️ [2/3] Running Automated Database & Environment Setup..."
node scripts/setup.js

echo ""
echo "🚀 [3/3] Starting ExerFit development server on http://localhost:3000..."
npm run dev
