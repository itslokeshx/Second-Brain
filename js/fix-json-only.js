(function () {
    // console.log('[JSON Fix] DISABLED - Authentication security priority');
    // console.log('[JSON Fix] All response faking disabled to ensure proper authentication');

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

    // console.log('[JSON Fix] ✅ Minimal mode - No response faking, auth will work properly');
})();
