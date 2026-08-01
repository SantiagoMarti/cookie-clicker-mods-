/**
 * Cookie Clicker Auto Broker
 * Version: 9.0
 * Description: Advanced High-Frequency Trading algorithm for Cookie Clicker's Stock Market.
 * Features: Zero-latency DOM hooks, FSM trend prediction, Dynamic Bollinger Bands, 
 * Auto-Broker purchasing, and an injected dual-column GUI.
 */

Game.registerMod("auto_broker", {
    init: function() {
        Game.Notify('Auto Broker', 'Algorithm V9 initialized: Full English, State Memory, and Reset Guard active.', [16, 5]); 
        setTimeout(() => { this.startBroker(); }, 5000);
    },

    startBroker: function() {
        let bank = Game.Objects['Bank'].minigame;
        if (!bank) return;

        // Shortened mode names for compact UI rendering
        const MODE_NAMES = ['Stable', 'S. Rise', 'S. Fall', 'F. Rise', 'F. Fall', 'Chaotic'];
        
        let stats = {
            buys: 0,
            sells: 0
        };

        // ==========================================
        // 1. UI INJECTION & RENDERING
        // ==========================================
        let renderUI = (debugLines, overhead) => {
            let parentContainer = l('bankHeader');
            if (!parentContainer) return;
            
            let host = parentContainer; 
            let panelUI = l('autoBrokerUI');
            
            if (!panelUI) {
                panelUI = document.createElement('div');
                panelUI.id = 'autoBrokerUI';
                panelUI.style = 'margin-top: 8px; padding: 10px; border: 1px solid #79c600; background: rgba(0, 0, 0, 0.85); box-shadow: 0px 0px 4px rgba(0,0,0,0.5) inset; color: #eee; font-size: 13px; text-align: center; border-radius: 4px;';
                host.appendChild(panelUI);
            }

            let html = `
                <div style="font-weight: bold; color: #94cd50; margin-bottom: 4px; font-size: 14px;">🎯 Auto Broker V9 | Current Overhead: ${((overhead - 1) * 100).toFixed(2)}%</div>
                <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 6px; font-size: 14px;">
                    <span><b>Buys:</b> ${stats.buys}</span>
                    <span><b>Sells:</b> ${stats.sells}</span>
                </div>
                <div style="font-size: 12px; margin-bottom: 6px;">
                    <span style="color:#94cd50;">■ Bought this tick</span> &nbsp;&nbsp;|&nbsp;&nbsp; <span style="color:#ff3b3b;">■ Sold this tick</span>
                </div>
                <hr style="border: 0; height: 1px; background: #555; margin: 8px 0;">
                
                <div style="font-family: monospace; font-size: 12px; text-align: left; max-height: 200px; overflow-y: auto; column-count: 2; column-gap: 20px; column-rule: 1px solid #555; padding: 4px;">
                    ${debugLines.length > 0 ? debugLines.join('') : 'Analyzing thresholds...'}
                </div>
            `;
            
            panelUI.innerHTML = html;
        };

        // ==========================================
        // THRESHOLD CALCULATIONS
        // ==========================================
        function calculateThresholds(asset, baseValue, overhead) {
            let buyThreshold = 0; let sellThreshold = 999999;
            switch (asset.mode) {
                case 0: // Stable
                    buyThreshold = baseValue * 0.70; sellThreshold = baseValue * 1.20; break;
                case 5: { // Chaotic (Dynamic Bollinger Bands)
                    let window = asset.vals.slice(0, 30); 
                    let range = Math.max(...window) - Math.min(...window);
                    let attemptBuy = Math.min(...window) + range * 0.25;
                    let attemptSell = Math.max(...window) - range * 0.25;

                    if (range >= baseValue * 0.15 && attemptSell > (attemptBuy * overhead * 1.05)) {
                        buyThreshold = attemptBuy; sellThreshold = attemptSell;
                    } else {
                        buyThreshold = baseValue * 0.60; sellThreshold = baseValue * 1.35;
                    }
                    break;
                }
                case 1: // Slow Rise
                    buyThreshold = baseValue * 0.70; sellThreshold = baseValue * 1.40; break;
                case 2: // Slow Fall
                    buyThreshold = baseValue * 0.50; break;
                case 3: // Fast Rise
                    sellThreshold = baseValue * 1.60; break;
                case 4: // Fast Fall
                    buyThreshold = baseValue * 0.30; break;
            }
            return { buyThreshold, sellThreshold };
        }

        // ==========================================
        // EXECUTION HELPERS 
        // ==========================================
        function executeBuy(asset) {
            if (bank.buyGood(asset.id, 10000)) {
                if (bank.draw) bank.draw();
                stats.buys++;
                return true;
            }
            return false;
        }

        function executeSell(asset) {
            if (bank.sellGood(asset.id, 10000)) {
                if (bank.draw) bank.draw();
                stats.sells++;
                return true;
            }
            return false;
        }

        // ==========================================
        // CORE MARKET LOGIC
        // ==========================================
        let executeMarketLogic = () => {
            // Guard against the 15-tick synchronous pre-warming loop on reset/ascension
            if (bank.ticks <= 15) return;

            let bankLevel = Game.Objects['Bank'].level;
            let assets = bank.goodsById; 
            
            // Auto-Broker Routine (Fills brokers if cost is < 5% of current bank)
            let maxBrokers = bank.getMaxBrokers();
            while (bank.brokers < maxBrokers) {
                let brokerPrice = bank.getBrokerPrice();
                if (Game.cookies * 0.05 > brokerPrice) { 
                    Game.Spend(brokerPrice); 
                    bank.brokers++; 
                } else { break; }
            }

            let overhead = 1 + 0.01 * (20 * Math.pow(0.95, bank.brokers));
            let softCeiling = 100 + (bankLevel - 1) * 3;
            let debugLines = [];

            assets.forEach(asset => {
                let baseValue = 10 + (asset.id * 10) + (bankLevel - 1);
                let fomoLimit = Math.min(baseValue * 1.20, softCeiling);
                let { buyThreshold, sellThreshold } = calculateThresholds(asset, baseValue, overhead);
                
                // State Memory for Transitions
                let lastMode = asset._lastMode !== undefined ? asset._lastMode : asset.mode;
                asset._lastMode = asset.mode;

                let tickAction = 'none';

                // Evaluate conditions in priority order
                if ((asset.mode === 2 || asset.mode === 4) && asset.stock > 0 && asset.val > (baseValue * 0.60)) {
                    // Panic Sell
                    if (executeSell(asset)) tickAction = 'sell';
                } 
                else if (asset.mode === 3 && asset.val < fomoLimit && asset.stock < bank.getGoodMaxStock(asset)) {
                    // FOMO Buy (Fast Rise)
                    if (executeBuy(asset)) tickAction = 'buy';
                } 
                else if (asset.mode === 1 && lastMode !== 1 && asset.val < fomoLimit && asset.stock < bank.getGoodMaxStock(asset)) {
                    // FOMO Buy (Slow Rise Transition) - Buy immediately when entering Mode 1
                    if (executeBuy(asset)) tickAction = 'buy';
                }
                else if (asset.val <= buyThreshold && asset.stock < bank.getGoodMaxStock(asset)) {
                    // Standard Value Buy
                    if (executeBuy(asset)) tickAction = 'buy';
                } 
                else if (asset.val >= sellThreshold && asset.stock > 0) {
                    // Standard Value Sell
                    if (executeSell(asset)) tickAction = 'sell';
                }

                // Determine UI text color
                let textColor = '#eee'; 
                if (tickAction === 'buy') textColor = '#94cd50'; 
                else if (tickAction === 'sell') textColor = '#ff3b3b'; 

                // Format pricing strings (B: and S:)
                let strSell = sellThreshold >= 999999 ? 'N/A' : '$' + sellThreshold.toFixed(1);
                let strBuy = '$' + buyThreshold.toFixed(1);

                debugLines.push(`<div style="color: ${textColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 1px 0;">[${asset.symbol}] ${MODE_NAMES[asset.mode]} | B: ${strBuy} | S: ${strSell}</div>`);
            });

            renderUI(debugLines, overhead);
        };

        // ==========================================
        // EVENT INJECTION (MONKEY PATCHING)
        // ==========================================
        if (!bank._botHooked) {
            let _origTick = bank.tick;
            bank.tick = function() {
                let ret = _origTick.apply(this, arguments);
                executeMarketLogic();                    
                return ret;
            };
            bank._botHooked = true;
        }

        // Initial UI Render
        let initialOverhead = 1 + 0.01 * (20 * Math.pow(0.95, bank.brokers));
        renderUI([], initialOverhead);
    },

    save: function() { return ''; },
    load: function(str) {}
});