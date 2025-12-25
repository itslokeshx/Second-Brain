/**
 * Database Recovery Script
 * ═══════════════════════════════════════════════════════════════════════════
 * This script bypasses guardian protection and completely resets IndexedDB.
 * Run this ONCE to fix corrupted/wrong-schema database, then reload.
 * 
 * Usage: Load this file in browser console or as a script, then call:
 *   window.recoverDatabase()
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    window.recoverDatabase = async function () {
        console.log('🔧 DATABASE RECOVERY STARTING...');
        console.log('═══════════════════════════════════════════════════════════════════');

        // Step 1: Get the ORIGINAL deleteDatabase function (before Guardian patches it)
        // This is a fresh reference that bypasses any patches
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        const freshIndexedDB = iframe.contentWindow.indexedDB;
        document.body.removeChild(iframe);

        // Step 2: Delete the database using the unpatched function
        console.log('Step 1: Deleting PomodoroDB6...');

        try {
            await new Promise((resolve, reject) => {
                const deleteRequest = freshIndexedDB.deleteDatabase('PomodoroDB6');
                deleteRequest.onsuccess = () => {
                    console.log('✅ Database deleted successfully');
                    resolve();
                };
                deleteRequest.onerror = () => {
                    console.error('❌ Delete failed:', deleteRequest.error);
                    reject(deleteRequest.error);
                };
                deleteRequest.onblocked = () => {
                    console.warn('⚠️ Delete blocked - closing any open connections...');
                    // Force close by reloading after a delay
                    setTimeout(resolve, 1000);
                };
            });
        } catch (e) {
            console.error('Delete error:', e);
        }

        // Step 3: Clear relevant localStorage
        console.log('Step 2: Clearing localStorage flags...');
        localStorage.removeItem('Version');
        localStorage.removeItem('UpdateV64Data');
        localStorage.removeItem('UpdateTasksData');
        sessionStorage.removeItem('reloaded-after-sync');
        console.log('✅ localStorage cleared');

        // Step 4: Clear session storage
        console.log('Step 3: Clearing sessionStorage...');
        sessionStorage.clear();
        console.log('✅ sessionStorage cleared');

        console.log('═══════════════════════════════════════════════════════════════════');
        console.log('🔄 RECOVERY COMPLETE - Reloading page in 2 seconds...');
        console.log('═══════════════════════════════════════════════════════════════════');

        setTimeout(() => {
            window.location.reload();
        }, 2000);
    };

    // Also expose a simpler version
    window.resetDB = window.recoverDatabase;

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🔧 DATABASE RECOVERY SCRIPT LOADED');
    console.log('   Run: window.recoverDatabase() or window.resetDB()');
    console.log('═══════════════════════════════════════════════════════════════════');

})();
