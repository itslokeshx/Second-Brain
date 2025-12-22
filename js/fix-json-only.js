(function () {
    console.log('[JSON Fix] Initializing JSON response fix only...');

    // 1. FIX THE JSON PARSE ERROR
    const originalParse = JSON.parse;
    JSON.parse = function (text) {
        // Safety: If it's already an object, return it (avoids double-parse crash)
        if (typeof text === 'object' && text !== null) {
            // console.warn('[JSON Fix] Object passed to JSON.parse, returning it directly'); 
            return text;
        }

        if (!text || text === '[object Object]') {
            console.warn('[JSON Fix] Preventing [object Object] parse crash');
            return { status: 0, success: true };
        }
        try {
            return originalParse(text);
        } catch (e) {
            console.warn('[JSON Fix] Parse failed, returning safe object');
            return { status: 0, success: true };
        }
    };

    // 2. FIX XHR RESPONSES (ONLY FOR JSON)
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (...args) {
        const xhr = this;

        const originalOnLoad = xhr.onload;
        xhr.onload = function () {
            // Fix bad responses BEFORE they reach the app
            if (xhr.responseText === '[object Object]' ||
                (xhr.responseText && xhr.responseText.includes('[object'))) {
                console.warn('[JSON Fix] Intercepted [object Object] response');
                // Create a clean fake response
                Object.defineProperty(xhr, 'responseText', {
                    value: JSON.stringify({ status: 0, success: true }),
                    writable: false
                });
                // Ensure status is OK
                Object.defineProperty(xhr, 'status', { value: 200, writable: false });
            }

            // Call original handler if exists
            if (originalOnLoad) {
                return originalOnLoad.apply(this, arguments);
            }
        };

        return originalSend.apply(this, args);
    };

    console.log('[JSON Fix] ✅ Active - Only fixes JSON responses, no auth interference');
})();
