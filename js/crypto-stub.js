// ===== CRITICAL RENDER UNLOCK =====
// main.js checks for these objects before mounting the React root.
// If missing, it aborts rendering and disconnects.
console.log('[Crypto Stub] Initializing mock encryption library...');

window.CryptoLib = {
    encrypt: v => { return v; },
    decrypt: v => { return v; },
    hash: v => { return v; },
};

window.Encryptor = {
    encrypt: v => { return v; },
    decrypt: v => { return v; },
};

// ✅ CRITICAL: main.js calls new JSEncrypt()
// found at: r = new JSEncrypt()
window.JSEncrypt = class JSEncrypt {
    constructor() {
    }
    setPublicKey(key) {
    }
    encrypt(data) {
        return data; // Return mock encrypted string
    }
    decrypt(data) {
        return data;
    }
};

// Also mock common crypto libraries sometimes used
window.b64_to_utf8 = v => v;
window.utf8_to_b64 = v => v;


