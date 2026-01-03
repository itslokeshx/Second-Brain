/**
 * Chrome Extension Polyfill for Web App
 * Mocks the Chrome Extension API using standard Web APIs
 */

if (!window.chrome) {
    window.chrome = {};
}

// Mock chrome.runtime
if (!chrome.runtime) {
    chrome.runtime = {
        getURL: (path) => {
            if (!path) return path;
            if (path.indexOf('assets/') === 0) return path;
            if (path.indexOf('img/') === 0 || path.indexOf('/img/') === 0) return 'assets/img/' + path.replace(/^[\/]?img\//, '');
            if (path.indexOf('audio/') === 0 || path.indexOf('/audio/') === 0) return 'assets/audio/' + path.replace(/^[\/]?audio\//, '');
            if (path.indexOf('font/') === 0 || path.indexOf('/font/') === 0) return 'assets/font/' + path.replace(/^[\/]?font\//, '');
            return path;
        },
        getManifest: () => ({ version: "1.0.0" }),
        sendMessage: (message, callback) => {
            // console.log("Mock sendMessage:", message);
            if (callback) callback();
        },
        onMessage: {
            addListener: () => { },
        },
        onInstalled: {
            addListener: () => { }
        }
    };
}

// Mock chrome.storage
if (!chrome.storage) {
    const createStorageArea = (areaName) => ({
        get: (keys, callback) => {
            const result = {};
            if (keys === null) {
                // Get all
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    try {
                        result[key] = JSON.parse(localStorage.getItem(key));
                    } catch (e) {
                        result[key] = localStorage.getItem(key);
                    }
                }
            } else if (typeof keys === 'string') {
                const val = localStorage.getItem(keys);
                if (val !== null) {
                    try {
                        result[keys] = JSON.parse(val);
                    } catch (e) {
                        result[keys] = val;
                    }
                }
            } else if (Array.isArray(keys)) {
                keys.forEach(key => {
                    const val = localStorage.getItem(key);
                    if (val !== null) {
                        try {
                            result[key] = JSON.parse(val);
                        } catch (e) {
                            result[key] = val;
                        }
                    }
                });
            } else if (typeof keys === 'object') {
                // keys with defaults
                for (const [key, defaultVal] of Object.entries(keys)) {
                    const val = localStorage.getItem(key);
                    if (val !== null) {
                        try {
                            result[key] = JSON.parse(val);
                        } catch (e) {
                            result[key] = val;
                        }
                    } else {
                        result[key] = defaultVal;
                    }
                }
            }

            if (callback) {
                setTimeout(() => callback(result), 0);
            }
            return Promise.resolve(result);
        },
        set: (items, callback) => {
            for (const [key, value] of Object.entries(items)) {
                localStorage.setItem(key, JSON.stringify(value));
            }
            if (callback) {
                setTimeout(() => callback(), 0);
            }
            return Promise.resolve();
        },
        remove: (keys, callback) => {
            if (typeof keys === 'string') {
                localStorage.removeItem(keys);
            } else if (Array.isArray(keys)) {
                keys.forEach(key => localStorage.removeItem(key));
            }
            if (callback) {
                setTimeout(() => callback(), 0);
            }
            return Promise.resolve();
        },
        clear: (callback) => {
            localStorage.clear();
            if (callback) {
                setTimeout(() => callback(), 0);
            }
            return Promise.resolve();
        }
    });

    chrome.storage = {
        local: createStorageArea('local'),
        sync: createStorageArea('sync'), // Sync data just saves to local in web app
        onChanged: {
            addListener: () => { }
        }
    };
}

// Mock chrome.i18n
if (!chrome.i18n) {
    chrome.i18n = {
        getMessage: function (messageName, substitutions) {
            if (window.I18n && window.I18n.getMessage) {
                return window.I18n.getMessage(messageName, substitutions);
            }
            // Basic English fallback or just return the key formatted
            // This part is kept for backward compatibility or if window.I18n is not available
            const messages = {
                "appName": "Second Brain",
                "appDescription": "Second Brain - Your Personal Productivity Hub",
                // Add more common keys if needed or load from _locales/en/messages.json
            };
            return messages[messageName] || messageName.replace(/_/g, ' ');
        },
        getUILanguage: () => navigator.language
    };
}

// Mock chrome.action (Manifest V3) or chrome.browserAction (Manifest V2)
if (!chrome.action) {
    chrome.action = {
        setBadgeText: (details) => {
            // console.log("Badge text set to:", details.text);
            // Could update document title or favicon overlay
        },
        setBadgeBackgroundColor: () => { },
        setIcon: () => { },
        onClicked: {
            addListener: (cb) => {
                // In a web app, there is no extension icon to click. 
                // This might need a UI button if it's critical.
                // console.log("chrome.action.onClicked listener added");
            }
        }
    };
}
if (!chrome.browserAction) {
    chrome.browserAction = chrome.action;
}

// Mock chrome.tabs
if (!chrome.tabs) {
    chrome.tabs = {
        create: (props) => {
            window.open(props.url, '_blank');
        },
        query: (queryInfo, callback) => {
            // Return current window as a tab
            if (callback) callback([{ id: 1, url: window.location.href }]);
        },
        update: () => { },
        onUpdated: { addListener: () => { } },
        onActivated: { addListener: () => { } }
    }
}

// Mock chrome.windows
if (!chrome.windows) {
    chrome.windows = {
        create: (createData, callback) => {
            // console.log("chrome.windows.create", createData);
            // Web app can't really create independent windows easily like extension popups
            // Just open a new window
            const win = window.open(createData.url, '_blank', `width=${createData.width},height=${createData.height},left=${createData.left},top=${createData.top}`);
            if (callback && win) callback({ id: 123 });
        },
        getAll: () => Promise.resolve([]),
        getCurrent: (cb) => cb && cb({ id: 1 }),
        update: () => { },
        onRemoved: { addListener: () => { } }
    }
}

// Mock chrome.notifications
if (!chrome.notifications) {
    chrome.notifications = {
        create: (id, options, callback) => {
            // console.log("Notification:", options);
            if (Notification.permission === 'granted') {
                new Notification(options.title, { body: options.message, icon: options.iconUrl });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(options.title, { body: options.message, icon: options.iconUrl });
                    }
                });
            }
            if (callback) callback(id || 'notif-' + Date.now());
        },
        clear: () => { },
        onClicked: { addListener: () => { } }
    }
}

// console.log("Chrome Polyfill loaded");
