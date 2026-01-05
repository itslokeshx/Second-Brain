(function () {


    // COMPLETELY DISABLED - No more faking responses
    // This ensures authentication cannot be bypassed

    // Only keep the basic object safety check
    const originalParse = JSON.parse;
    JSON.parse = function (text, ...args) {
        // Safety: If it's already an object, return it
        if (typeof text === 'object' && text !== null) {
            return text;
        }

        // Let everything else fail naturally - no faking!
        return originalParse(text, ...args);
    };

})();
