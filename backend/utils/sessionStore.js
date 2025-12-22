const crypto = require('crypto');

// Shared legacy session store
if (!global.sessions) {
    global.sessions = new Map();
}

function generateJSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

function persistSession(user, jsessionId) {
    if (!jsessionId) return;
    global.sessions.set(jsessionId, {
        uid: user?._id?.toString() || '',
        email: user?.email || '',
        name: user?.name || user?.username || '',
        createdAt: Date.now()
    });
}

function getSession(jsessionId) {
    if (!jsessionId) return null;
    return global.sessions.get(jsessionId) || null;
}

function attachSessionCookie(res, jsessionId) {
    if (!jsessionId) return;
    res.setHeader('Set-Cookie', `JSESSIONID=${jsessionId}; Path=/; SameSite=Lax`);
}

module.exports = {
    generateJSessionId,
    persistSession,
    getSession,
    attachSessionCookie
};
