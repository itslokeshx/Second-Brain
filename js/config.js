// Configuration for Second Brain App
// Automatically detects environment and sets appropriate API URLs

(function () {
    'use strict';

    const AppConfig = {
        // Detect if we're in development or production
        isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

        // Get API base URL
        getApiBaseUrl: function () {
            // Production: Use Render backend URL
            // UPDATE THIS after deploying backend to Render!
            if (!this.isDevelopment) {
                return 'https://second-brain-backend-saxs.onrender.com';
            }

            // Development: backend on port 3000
            return 'http://localhost:3000';
        },

        // Get full API URL for an endpoint
        getApiUrl: function (endpoint) {
            const baseUrl = this.getApiBaseUrl();
            // Remove leading slash if present to avoid double slashes
            const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
            return baseUrl + cleanEndpoint;
        },

        // Session configuration
        session: {
            checkInterval: 30000, // 30 seconds
            cookieMonitorInterval: 2000 // 2 seconds
        },

        // Feature flags
        features: {
            autoSync: true,
            periodicSessionCheck: true,
            debugLogging: window.location.hostname === 'localhost'
        }
    };

    // Export globally
    window.AppConfig = AppConfig;

    // console.log('[Config] Initialized');
    // console.log('[Config] Environment:', AppConfig.isDevelopment ? 'Development' : 'Production');
    // console.log('[Config] API Base URL:', AppConfig.getApiBaseUrl());
})();
