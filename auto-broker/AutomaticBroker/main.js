/**
 * Cookie Clicker Auto Broker
 * Version: 9.2 (Includes Instant UI Toggle)
 * Description: Advanced High-Frequency Trading algorithm for Cookie Clicker's Stock Market.
 * Features: Zero-latency DOM hooks, FSM trend prediction, Dynamic Bollinger Bands, 
 * Auto-Broker purchasing, and an injected dual-column GUI.
 */

// Variable y función global para que el botón HTML pueda interactuar con el bot al instante
if (typeof window.autoBrokerActive === 'undefined') {
    window.autoBrokerActive = true;
}

// Guardamos las últimas líneas para que la interfaz no parpadee al encender/apagar
window.lastAutoBrokerDebugLines = [];

window.toggleAutoBroker = function() {
    window.autoBrokerActive = !window.autoBrokerActive;
    Game.Notify('Auto Broker', window.autoBrokerActive ? 'Bot RESUMED' : 'Bot PAUSED (Manual Control)', [16, 5]);
    
    // Forzar el renderizado instantáneo de la UI sin esperar al bank.tick
    if (typeof window.forceAutoBrokerRender === 'function') {
        window.forceAutoBrokerRender();
    }
};

Game.registerMod("auto_broker", {
    init: function() {
        Game.Notify('Auto Broker', 'Algorithm V9.2 initialized: Instant Toggle active.', [16, 5]); 
        setTimeout(() => { this.startBroker(); }, 5000);
    },

    startBroker: function() {
        let bank = Game.Objects['Bank'].minigame;
        if (!bank) return;

        // Exponer el renderizador al ámbito global para el botón
        window.forceAutoBrokerRender = () => {
            let currentOverhead = 1 + 0.01 * (20 * Math.pow(0.95, bank.brokers));
            renderUI(window.lastAutoBrokerDebugLines, currentOverhead);
        };

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

            // Variables de estilo dinámicas para el botón
            let btnText = window.autoBrokerActive ? 'ON' : 'OFF';
            let btnColor = window.autoBrokerActive ? '#94cd50' : '#ff3b3b';

            let html = `
                <div style="display: flex; justify-content: center; align-items: center; gap: 15px; font-weight: bold; color: #94cd50; margin-bottom: 4px; font-size: 14px;">
                    <span>🎯 Auto Broker V9.2 | Current Overhead: ${((overhead - 1) * 100).toFixed(2)}%</span>
                    <button onclick="window.toggleAutoBroker()" style="background: ${btnColor}; color: black; border: 1px solid #fff; border-radius: 4px; padding: 2px 10px; font-weight: bold; cursor: pointer; transition: background 0.2s;">
                        Auto Broker: ${btnText}
                    </button>
                </div>
                <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 6px; font-size: 14px;">
                    <span><b>Buys:</b> ${stats.buys}</span>
                    <span><b>Sells:</b> ${stats.sells}</span>
                </div>
                <div style="font-size: 12px; margin-bottom: 6px;">
                    <span style="color:#94cd50;">■ Bought this tick</span> &nbsp;&nbsp;|&nbsp;&nbsp; <span style="color:#ff3b3b;">■ Sold this tick</span>
                </div>
                <hr style="border: 0; height: 1px; background: #555; margin: 8px 0;">
                
                <div style="font-family: monospace; font-size: 12px; text-align: left; max-height: 200px; overflow-y: auto; column-count: 2; column-gap: 20px; column-rule: 1px solid #555; padding: 4px;">
                    ${window.autoBrokerActive ? (debugLines.length > 0 ? debugLines.join('') : 'Analyzing thresholds...') : '<div style="color:#ff3b3b; text-align:center; width:100%; column-span: all; font-weight:bold;">Status: PAUSED (Manual Control)</div>'}
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

            let overhead = 1 + 0.01 * (20 * Math.pow(0.95, bank.brokers));

            // Si el bot está apagado, bloqueamos la ejecución pero mantenemos la UI actualizada con las cifras
            if (!window.autoBrokerActive) {
                renderUI(window.lastAutoBrokerDebugLines, overhead);
                return;
            }

            let bankLevel = Game.Objects['Bank'].level;
            let assets = bank.goodsById; 
            
            // Auto-Broker Routine
            let maxBrokers = bank.getMaxBrokers();
            while (bank.brokers < maxBrokers) {
                let brokerPrice = bank.getBrokerPrice();
                if (Game.cookies * 0.05 > brokerPrice) { 
                    Game.Spend(brokerPrice); 
                    bank.brokers++; 
                } else { break; }
            }

            // Recalculate overhead in case brokers were just bought
            overhead = 1 + 0.01 * (20 * Math.pow(0.95, bank.brokers));
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
                    // FOMO Buy (Slow Rise Transition)
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

                // Format pricing strings
                let strSell = sellThreshold >= 999999 ? 'N/A' : '$' + sellThreshold.toFixed(1);
                let strBuy = '$' + buyThreshold.toFixed(1);

                debugLines.push(`<div style="color: ${textColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 1px 0;">[${asset.symbol}] ${MODE_NAMES[asset.mode]} | B: ${strBuy} | S: ${strSell}</div>`);
            });

            // Guardamos las líneas globalmente y renderizamos
            window.lastAutoBrokerDebugLines = debugLines;
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
