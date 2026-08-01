# 📈 Auto Broker (High-Frequency Trading Bot)

The flagship module of this collection. The **Auto Broker** is an advanced, fully autonomous algorithmic trading bot for the *Cookie Clicker* Stock Market minigame. 

Unlike naive trend-following scripts that blindly buy when prices rise (resulting in massive losses due to broker overhead and market gravity), this bot operates as a **State-Aware Value Investor**. It reads the game's internal variables in real-time, calculates dynamic profit margins, and executes trades with zero milliseconds of latency.

## 🧠 Advanced Algorithmic Logic

The superiority of this bot lies in its multi-layered mathematical approach to the market, addressing the hidden mechanics of the game's engine:

### 1. State-Aware Finite State Machine (FSM)
The minigame dictates stock prices using 6 hidden modes. The bot reads `asset.mode` directly from the engine to determine its posture, calculating dynamic `buyThreshold` and `sellThreshold` values based on the stock's intrinsic `baseValue` (`10 + (id * 10) + (bankLevel - 1)`).
*   **Stable (0) & Slow Rise (1):** Targets buys at `0.70x` base value. Sets high sell targets (`1.20x` and `1.40x`).
*   **Slow Fall (2) & Fast Fall (4):** Acts as a deep-value investor, refusing to buy until the asset crashes to `0.50x` or `0.30x` its base value.
*   **Panic Sells:** If the market enters a Fall mode (2 or 4) while holding stock, and the current value is still above `0.60x`, it instantly dumps the asset to prevent holding the bag.

### 2. Dynamic Bollinger Bands (The Chaotic Mode 5)
Mode 5 (Chaotic) is the most common market state and lacks predictable gravity. Instead of relying on static thresholds, the bot acts as a quantitative volatility trader:
*   It analyzes a rolling window of the last 30 engine ticks (`asset.vals.slice(0, 30)`).
*   It calculates the local range (`max - min`). 
*   It places dynamic buy/sell orders at the 25th and 75th percentiles of this local spread.
*   **Overhead Protection:** It will only execute the trade if the local volatility is high enough (`range >= baseValue * 0.15`) AND the spread strictly covers the active broker commission mathematically (`attemptSell > attemptBuy * overhead * 1.05`).

### 3. Transition Memory & Early FOMO Detection
Following trends blindly leads to buying at the top of a rally. To solve this, the bot uses two mechanics:
*   **The Soft Ceiling Limit:** It calculates the mathematical gravity threshold where the game engine forces prices down (`100 + (bankLevel - 1) * 3`). FOMO buys are strictly disabled above this limit.
*   **State Memory Injection (`_lastMode`):** The bot injects a memory property into the asset objects. By comparing the current tick to the previous one, it detects the exact moment a stock transitions into a *Slow Rise*. If the price is below the soft ceiling, it executes an immediate market buy, riding the entire upward wave from the absolute bottom.

### 4. Commission Management (Auto-Broker)
Trading frequently with high overhead drains cookies. The bot includes an autonomous HR system:
*   In every tick, it checks the cost of hiring a new broker (`bank.getBrokerPrice()`).
*   If the cost is less than `5%` of your current liquid cookie bank, it automatically hires them.
*   It dynamically recalculates the global overhead equation `1 + 0.01 * (20 * 0.95^brokers)` in real-time, feeding this exact floating-point number into the Mode 5 volatility calculations.

### 5. Zero-Latency Execution & Engine Hooking
The bot does not use Javascript `setInterval` polling, avoiding desyncs.
*   **Monkey Patching:** It hooks directly into the native `bank.tick` function, executing evaluation logic in the exact millisecond the market updates.
*   **Initialization Guard:** The game engine runs a synchronous `for` loop of 15 ticks to pre-warm the market during `M.reset()` (upon ascending). The bot includes a cycle guard (`bank.ticks <= 15`) to block execution during this burst, preventing artificial trades and UI spam.

---

## 💡 Optimal Setup & Strategic Recommendations

For this algorithmic bot to achieve its absolute maximum potential and generate exponential profit, it is highly recommended to meet the following in-game conditions:

* **High Broker Count (~100+ Brokers):** The broker commission (overhead) strictly dictates the bot's trading frequency, especially in the volatility-based Mode 5. The overhead equation scales as `20% * 0.95^brokers`. By maintaining around 100 brokers, this commission drops exponentially toward a flat `0%`. The closer the overhead is to zero, the narrower the spreads the bot can exploit, drastically increasing the volume of profitable micro-trades.
* **Massive Liquid Bankroll:** The algorithm is designed to capitalize on *every* mathematical opportunity simultaneously. If three different high-value stocks crash into a *Fast Fall* (Mode 4) at the exact same time, the bot will attempt to buy the maximum stock capacity for all of them. To prevent bottlenecking your profit potential, you must maintain a spare cookie bankroll large enough to max out the stock of **all assets at the same time**. Running out of liquid cookies means missing out on critical deep-value accumulation phases.
* **Disable "Supreme Intellect" (Dragon Aura):** The Krumblor dragon aura *Supreme Intellect* alters the underlying RNG mechanics of all minigames. For the Stock Market, it artificially increases volatility and heavily skews the FSM transition probabilities toward Mode 5 (Chaotic), while severely shortening the lifespan of stable trends. While this bot is perfectly capable of scalping profits in Chaotic mode via its Bollinger Bands, its most massive profit margins come from riding long *Slow Rise* (Mode 1) trends from the absolute bottom. Supreme Intellect disrupts these natural, long-term FSM cycles. For optimal algorithmic performance, the market must be allowed to operate on its natural mathematical gravity without this aura's interference.

---

## 📊 Injected Telemetry Dashboard

Monitoring the bot shouldn't require opening the browser console. The mod seamlessly injects a dual-column CSS UI directly into the `bankHeader` DOM container.

*   **Real-Time Targets:** Displays the exact floating-point buy/sell thresholds (`B:` and `S:`) for every active stock.
*   **Color-Coded Ticks:** Highlights assets in <span style="color:#94cd50">green (Bought)</span> or <span style="color:#ff3b3b">red (Sold)</span> during the exact tick a trade executes.
*   **Live Overhead:** Displays the real-time commission percentage as the bot automatically scales your broker workforce.

## ⚙️ Mod Information
* **Version:** 9.0 (Stable)
* **Dependencies:** None
* **Game Version:** Optimized for 2.052
* **Steam Achievements:** Supported (`AllowSteamAchievs: true`)
