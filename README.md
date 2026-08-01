# 🍪 Cookie Clicker - Advanced Mods Collection

> A suite of highly optimized, technical modifications for *Cookie Clicker* (v2.052).

This repository contains a collection of scripts designed to maximize efficiency and automation through algorithmic trading, RNG prediction, and low-level engine hooks. Rather than relying on standard UI polling, these modules interact directly with the game's core loops.

By leveraging **Monkey Patching** for zero-latency execution, mathematical seed evaluation for RNG prediction, and **Finite State Machines (FSM)** for market trend analysis, this collection transforms standard game mechanics into deterministic, high-performance automated systems.

---

## 📦 Included Mods

### 📈 [1. Auto Broker (High-Frequency Trading Bot)](./auto-broker)
An advanced algorithmic trading bot for the Stock Market minigame. It doesn't just buy when prices drop; it evaluates the mathematical context of the market to secure consistent profit margins.
*   **Zero-Latency Hooks:** Overrides the native `bank.tick` function to execute trades in the exact millisecond the market updates, completely bypassing `setInterval` delays.
*   **State-Aware Logic (FSM):** Uses the market's hidden modes to predict trends, featuring an early memory-based trigger to catch *Slow Rise* transitions.
*   **Dynamic Bollinger Bands:** Calculates real-time volatility during the *Chaotic* mode to ensure trades always cover the auto-broker commission overhead.
*   **Injected Dashboard:** Renders a clean, two-column UI directly into the game's DOM to monitor active thresholds and recent trades without cluttering the screen with notifications.

### 🔮 [2. FtHoF Predictor (RNG Seed Evaluation)](./fthof-predictor)
A grimoire utility that eliminates the guesswork from the *Force the Hand of Fate* spell, enabling massive combo setups.
*   **Seed Tracking:** Hooks into the game's internal `Math.seedrandom` state using the current save seed and total spells cast to accurately pre-calculate the RNG roll.
*   **Seamless UI Injection:** Modifies the native spell tooltip to display the upcoming cookie outcome (*Success* or *Backfire*) directly in the game's interface before casting.

### 🖱️ [3. Golden Cookie AutoClicker](./golden-autoclicker)
A lightweight, reliable automation script for screen entities.
*   **Entity Mapping:** Continuously scans the `Game.shimmers` array to instantly trigger Golden Cookies, Wrath Cookies, and seasonal drops without consuming excessive CPU cycles.

---

## 🚀 Installation Guide

Since these are raw JavaScript mods, you can load them directly into your browser version of the game using one of the following methods:

**Method A: Browser Console (Quickest)**
1. Open Cookie Clicker in your browser.
2. Press `F12` (or `Ctrl+Shift+I`) to open the Developer Tools, and navigate to the **Console** tab.
3. Copy the entire code from the desired `main.js` file and paste it into the console. Hit `Enter`.

**Method B: Bookmarklet (Recommended for daily use)**
1. Create a new bookmark in your browser.
2. Name it after the mod (e.g., "Load Auto Broker").
3. In the URL field, paste the following code, replacing `YOUR_GITHUB_RAW_LINK` with the raw link to the `main.js` file hosted in this repository:

```javascript
javascript:(function(){var s=document.createElement('script');s.src='YOUR_GITHUB_RAW_LINK';document.head.appendChild(s);}());
