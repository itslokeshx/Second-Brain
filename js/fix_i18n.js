/**
 * Fix for local file:// access to i18n files.
 * Intercepts XHR requests for translation files and returns the embedded I18N_DATA.
 */
(function () {
    console.log("[Fix] Initializing i18n XHR Interceptor...");

    if (!window.I18N_DATA) {
        console.warn("[Fix] window.I18N_DATA is missing. Interceptor inactive.");
        return;
    }

    var OldXHR = window.XMLHttpRequest;
    var oldOpen = OldXHR.prototype.open;
    var oldSend = OldXHR.prototype.send;

    OldXHR.prototype.open = function (method, url) {
        this._interceptUrl = url;
        return oldOpen.apply(this, arguments);
    };

    OldXHR.prototype.send = function (data) {
        // Check if this request is for an i18n text file
        if (this._interceptUrl && this._interceptUrl.match(/i18n\/strings.*\.txt/)) {
            console.log("[Fix] Intercepting XHR request for:", this._interceptUrl);

            // Convert JSON object back to properties file format (key=value)
            var responseText = "";
            for (var key in window.I18N_DATA) {
                if (window.I18N_DATA.hasOwnProperty(key)) {
                    responseText += key + "=" + window.I18N_DATA[key] + "\n";
                }
            }

            // Shadow the read-only properties with our mock values
            Object.defineProperty(this, "readyState", { value: 4, writable: false });
            Object.defineProperty(this, "status", { value: 200, writable: false });
            Object.defineProperty(this, "statusText", { value: "OK", writable: false });
            Object.defineProperty(this, "responseText", { value: responseText, writable: false });
            Object.defineProperty(this, "response", { value: responseText, writable: false });

            // Trigger events asynchronously to simulate network callback
            var self = this;
            setTimeout(function () {
                if (self.onreadystatechange) {
                    self.onreadystatechange();
                }
                if (self.onload) {
                    self.onload();
                }
            }, 10);

            return;
        }

        return oldSend.apply(this, arguments);
    };
})();
