// Quick diagnostic script - paste this in browser console

console.log('=== DIAGNOSTIC CHECK ===');

// 1. Check cookies
console.log('Cookies:', document.cookie);

// 2. Check localStorage
console.log('authToken:', localStorage.getItem('authToken'));
console.log('userId:', localStorage.getItem('userId'));

// 3. Check SessionManager
console.log('SessionManager.currentUser:', window.SessionManager?.currentUser);
console.log('SessionManager.token:', window.SessionManager?.token);

// 4. Try manual sync call
fetch('http://localhost:3000/v64/sync', {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
})
    .then(r => r.json())
    .then(data => {
        console.log('Manual sync response:', data);
        if (data.status === 0) {
            console.log('✅ Sync works!');
            console.log('Projects:', data.projects?.length || 0);
            console.log('Tasks:', data.tasks?.length || 0);
            console.log('Pomodoros:', data.pomodoros?.length || 0);
        } else {
            console.log('❌ Sync failed with status:', data.status);
        }
    })
    .catch(err => console.error('Sync error:', err));
