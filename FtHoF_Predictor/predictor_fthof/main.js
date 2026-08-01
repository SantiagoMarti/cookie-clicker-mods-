/**
 * FtHoF Predictor
 * Version: 1.0
 * Description: Predicts the next outcome of the Force the Hand of Fate spell.
 */

Game.registerMod("predictor_fthof", {
    init: function() {
        // Wrap the logic in a function to ensure the grimoire has loaded
        const initPredictor = () => {
            if (Game.Objects['Wizard tower'] && Game.Objects['Wizard tower'].minigameLoaded) {
                const M = Game.Objects['Wizard tower'].minigame;

                function predictFtHoF() {
                    const spell = M.spells['hand of fate'];
                    const failChance = M.getFailChance(spell);

                    // Re-seed the random number generator using the game's seed and total spells cast
                    Math.seedrandom(Game.seed + '/' + M.spellsCastTotal);
                    const isWin = Math.random() < (1 - failChance);
                    let result = "";

                    if (isWin) {
                        let choices = [];
                        choices.push('frenzy', 'multiply cookies');
                        if (!Game.hasBuff('Dragonflight')) choices.push('click frenzy');
                        if (Math.random() < 0.1) choices.push('cookie storm', 'cookie storm', 'blab');
                        if (Game.BuildingsOwned >= 10 && Math.random() < 0.25) choices.push('building special');
                        if (Math.random() < 0.15) choices = ['cookie storm drop'];
                        if (Math.random() < 0.0001) choices.push('free sugar lump');
                        result = choose(choices);
                    } else {
                        let choices = [];
                        choices.push('clot', 'ruin cookies');
                        if (Math.random() < 0.1) choices.push('cursed finger', 'blood frenzy');
                        if (Math.random() < 0.003) choices.push('free sugar lump');
                        if (Math.random() < 0.1) choices = ['blab'];
                        result = choose(choices);
                    }

                    // Reset the seed back to normal
                    Math.seedrandom();
                    return { isWin: isWin, effect: result };
                }

                const originalTooltip = M.spellTooltip;

                // Monkey patching the tooltip function to inject our prediction
                M.spellTooltip = function(id) {
                    const originalFunc = originalTooltip.call(M, id);
                    return function() {
                        let str = originalFunc();
                        const me = M.spellsById[id];

                        if (me.id === M.spells['hand of fate'].id) {
                            const prediction = predictFtHoF();
                            const color = prediction.isWin ? '#6f6' : '#f66';
                            const title = prediction.isWin ? 'Success: ' : 'Backfire! ';

                            const injection = '<div class="line"></div><div class="description"><b>Next Cookie:</b> <span style="color:' + color + ';">' + title + prediction.effect.toUpperCase() + '</span></div>';
                            str = str.replace('</div></div>', injection + '</div></div>');
                        }
                        return str;
                    };
                };

                Game.Notify('FtHoF Predictor', 'The mod has loaded successfully.', [22, 11], 6);
            } else {
                // If the minigame hasn't loaded yet, try again in 1 second
                setTimeout(initPredictor, 1000);
            }
        };

        initPredictor();
    },
    
    save: function() {
        return ""; // No extra save data required for this mod
    },
    
    load: function(str) {
        // No loading required
    }
});