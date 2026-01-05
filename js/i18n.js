
(function () {
    var translations = {};
    var loaded = false;

    window.I18n = {

        init: function () {
            if (loaded) return;

            if (window.I18N_DATA) {
                translations = window.I18N_DATA;
                loaded = true;

                return;
            }

            var xhr = new XMLHttpRequest();
            // Assuming English for now as per the files found
            xhr.open('GET', 'i18n/strings_en.txt', false); // false = synchronous
            xhr.overrideMimeType('text/plain; charset=utf-8');
            xhr.send(null);

            if (xhr.status === 200) {
                this.parseData(xhr.responseText);
                loaded = true;
            } else {
                console.error('Failed to load i18n strings:', xhr.status);
            }
        },

        parseData: function (data) {
            var lines = data.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                // Skip empty lines or existing comments (though strict file format seems to be key = value)
                if (!line || line.indexOf('=') === -1) continue;

                var separatorIndex = line.indexOf('=');
                var key = line.substring(0, separatorIndex).trim();
                var value = line.substring(separatorIndex + 1).trim();

                translations[key] = value;
            }
        },

        /**
         * Gets a localized message string.
         * @param {string} messageName The name of the message.
         * @param {string|string[]} [substitutions] Optional substitutions.
         * @returns {string} The localized message.
         */
        getMessage: function (messageName, substitutions) {
            if (!loaded) {
                this.init(); // Lazy init if called early
            }

            var message = translations[messageName];
            if (message === undefined) {
                return messageName; // Fallback to key name if not found for debugging
            }

            if (substitutions) {
                if (!Array.isArray(substitutions)) {
                    substitutions = [substitutions];
                }

                for (var i = 0; i < substitutions.length; i++) {
                    // Replace {0}, {1}, etc.
                    message = message.replace(new RegExp('\\{' + i + '\\}', 'g'), substitutions[i]);
                }
            }
            return message;
        },

        /**
         * Translates the entire page by finding elements with data-i18n attributes.
         */
        translatePage: function () {
            if (!loaded) this.init();

            // Text content translation
            var elements = document.querySelectorAll('[data-i18n]');
            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                var key = el.getAttribute('data-i18n');
                var text = this.getMessage(key);
                if (text !== key) {
                    el.textContent = text;
                }
            }

            // Placeholder translation
            var inputs = document.querySelectorAll('[data-i18n-placeholder]');
            for (var i = 0; i < inputs.length; i++) {
                var el = inputs[i];
                var key = el.getAttribute('data-i18n-placeholder');
                var text = this.getMessage(key);
                if (text !== key) {
                    el.setAttribute('placeholder', text);
                }
            }

            // Title attribute translation
            var titledElements = document.querySelectorAll('[data-i18n-title]');
            for (var i = 0; i < titledElements.length; i++) {
                var el = titledElements[i];
                var key = el.getAttribute('data-i18n-title');
                var text = this.getMessage(key);
                if (text !== key) {
                    el.setAttribute('title', text);
                }
            }
        }
    };

    // Auto-init immediately
    try {
        window.I18n.init();
    } catch (e) {
        console.error('Error initializing I18n:', e);
    }

    // Auto-translate on load
    document.addEventListener('DOMContentLoaded', function () {
        window.I18n.translatePage();
    });

})();
