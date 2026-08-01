/**
 * Golden Cookie AutoClicker
 * Version: 1.0
 * Description: Automatically clicks Golden and Wrath cookies.
 */

Game.registerMod("golden_cookie_autoclicker", {
    init: function() {
        // Set an interval to run every 500 milliseconds (half a second)
        this.clickerInterval = setInterval(function() {
            
            // Game.shimmers is an array containing all clickable on-screen objects
            // (Golden cookies, Wrath cookies, and Reindeer during Christmas)
            if (Game.shimmers.length > 0) {
                Game.shimmers.forEach(function(shimmer) {
                    // Check if the object is a golden cookie (includes Wrath cookies)
                    if (shimmer.type === 'golden') {
                        shimmer.pop(); // Simulates a player click
                    }
                });
            }
            
        }, 500);

        // Notification to let the user know the mod is running
        Game.Notify('Golden AutoClicker', 'Mod loaded! Golden and Wrath cookies will now be clicked automatically.', [10, 14], 6);
    },
    
    save: function() {
        return ""; // No extra save data required for this mod
    },
    
    load: function(str) {
        // No loading required
    }
});