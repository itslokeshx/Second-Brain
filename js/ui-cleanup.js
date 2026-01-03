/**
 * UI Cleanup Patch v2
 * ═══════════════════════════════════════════════════════════════════════════
 * Hides unwanted UI elements while keeping Sync and Logout visible
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // console.log('[UI Cleanup] Applying patches v2...');

    function applyCleanup() {
        const style = document.createElement('style');
        style.id = 'ui-cleanup-patch-v2';
        style.textContent = `
            /* Robust Header Icon Hiding */
            .HomeHeader-group-3TazE,
            .HomeHeader-forest-1_xCg,
            .HomeHeader-ranking-FW8MF {
                display: none !important;
            }

            /* Settings Menu Hiding */
            li.Settings-menu-1tpM9:has(span[style*="setting-account"]),
            li.Settings-menu-1tpM9:has(span[style*="setting-premium"]),
            li.Settings-menu-1tpM9:has(span[style*="setting-purchase"]),
            li.Settings-menu-1tpM9:has(span[style*="setting-about"]) {
                display: none !important;
            }
            
            /* Ensure dropdown groups are visible by default */
            .UserDropdownMenu-group-x42x0 {
                display: block !important;
            }
        `;

        document.head.appendChild(style);
        // console.log('[UI Cleanup] ✅ CSS patches applied');

        hideMenuItems();
    }

    function hideMenuItems() {
        function hideByText() {
            // Hide specific dropdown items
            document.querySelectorAll('div.UserDropdownMenu-menu-KviKX').forEach(el => {
                const text = el.textContent.trim();
                if (text.includes('Premium period remaining') || text.includes('Upgrade to Premium')) {
                    const group = el.closest('.UserDropdownMenu-group-x42x0');
                    if (group) group.style.setProperty('display', 'none', 'important');
                    else el.style.setProperty('display', 'none', 'important');
                }
                if (text === 'Account Settings') {
                    el.style.setProperty('display', 'none', 'important');
                }
            });

            // Hide settings menu items
            document.querySelectorAll('li.Settings-menu-1tpM9').forEach(el => {
                const menuName = el.querySelector('.Settings-menuName-3vPsX');
                if (menuName) {
                    const name = menuName.textContent.trim();
                    if (name === 'Account' || name === 'About' || name === 'Premium') {
                        el.style.setProperty('display', 'none', 'important');
                    }
                }
            });
        }

        hideByText();

        const observer = new MutationObserver(hideByText);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // console.log('[UI Cleanup] ✅ Menu item observer installed');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyCleanup);
    } else {
        applyCleanup();
    }

    // console.log('[UI Cleanup] 📦 Patch v2 loaded');

})();
