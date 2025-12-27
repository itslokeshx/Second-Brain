/**
 * Username Poison Blocker - Aggressive DOM Protection
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This script actively monitors and blocks username text from appearing in
 * task input fields, regardless of how main.js tries to inject it.
 * 
 * Strategy: MutationObserver + Active Scrubbing
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    console.log('[Poison Blocker] 🛡️ Initializing aggressive DOM protection...');

    let username = '';
    let usernamePrefix = '';

    // Get username from cookies
    function updateUsernameFromCookies() {
        const cookies = document.cookie.split(';').reduce((acc, c) => {
            const [k, v] = c.trim().split('=');
            acc[k] = decodeURIComponent(v || '');
            return acc;
        }, {});
        
        if (cookies.NAME) {
            username = cookies.NAME;
            usernamePrefix = username.toLowerCase();
            console.log('[Poison Blocker] 🔍 Monitoring for username:', username);
        }
    }

    // Check if element is task-related
    function isTaskRelatedContext(el) {
        if (!el) return false;

        // Check element itself
        const className = el.className || '';
        const classStr = typeof className === 'string' ? className : className.toString();
        
        if (classStr && (
            classStr.includes('task') ||
            classStr.includes('Task') ||
            classStr.includes('input') ||
            classStr.includes('Input') ||
            classStr.includes('editor') ||
            classStr.includes('Editor') ||
            classStr.includes('draft') ||
            classStr.includes('placeholder') ||
            classStr.includes('editable')
        )) {
            return true;
        }

        // Check ancestors (up to 5 levels)
        let parent = el.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
            const parentClass = parent.className || '';
            const parentClassStr = typeof parentClass === 'string' ? parentClass : parentClass.toString();
            
            if (parentClassStr && (
                parentClassStr.includes('task') ||
                parentClassStr.includes('Task') ||
                parentClassStr.includes('TaskList') ||
                parentClassStr.includes('TaskItem') ||
                parentClassStr.includes('NewTask') ||
                parentClassStr.includes('input') ||
                parentClassStr.includes('editor')
            )) {
                return true;
            }
            
            parent = parent.parentElement;
            depth++;
        }

        return false;
    }

    // Scrub poisoned text from element
    function scrubElement(el) {
        if (!username || !usernamePrefix) return false;

        const text = el.textContent || '';
        const lowerText = text.toLowerCase();

        // Check if text contains username
        if (lowerText.includes(usernamePrefix)) {
            // Check if this is a task-related element
            if (isTaskRelatedContext(el)) {
                console.log('[Poison Blocker] 💀 BLOCKED username injection into:', el.className);
                console.log('[Poison Blocker] 🧹 Poisoned text:', text);
                
                // Clear it
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = '';
                } else {
                    el.textContent = '';
                }
                
                return true;
            }
        }

        return false;
    }

    // Scrub all task-related elements
    function scrubTaskElements() {
        if (!username) return;

        // Find all potential task input fields
        const selectors = [
            'input[type="text"]',
            'textarea',
            '[contenteditable="true"]',
            '[class*="task"]',
            '[class*="Task"]',
            '[class*="input"]',
            '[class*="Input"]'
        ];

        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    scrubElement(el);
                });
            } catch (e) {
                // Ignore invalid selectors
            }
        });
    }

    // Set up MutationObserver
    const observer = new MutationObserver((mutations) => {
        if (!username) {
            updateUsernameFromCookies();
            if (!username) return;
        }

        mutations.forEach(mutation => {
            // Check for text changes
            if (mutation.type === 'characterData') {
                const target = mutation.target.parentElement;
                if (target) {
                    scrubElement(target);
                }
            }

            // Check for added nodes
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        scrubElement(node);
                        
                        // Check all text nodes within added element
                        const textNodes = [];
                        const walker = document.createTreeWalker(
                            node,
                            NodeFilter.SHOW_ELEMENT,
                            null
                        );
                        
                        let currentNode;
                        while (currentNode = walker.nextNode()) {
                            scrubElement(currentNode);
                        }
                    }
                });
            }

            // Check for attribute changes (like value, contenteditable)
            if (mutation.type === 'attributes') {
                scrubElement(mutation.target);
            }
        });
    });

    // Start observing when DOM is ready
    function startObserving() {
        updateUsernameFromCookies();
        
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                characterDataOldValue: true,
                attributes: true,
                attributeFilter: ['value', 'contenteditable']
            });
            
            console.log('[Poison Blocker] ✅ Active monitoring started');
            
            // Initial scrub
            scrubTaskElements();
        } else {
            setTimeout(startObserving, 100);
        }
    }

    // Periodic scrubbing (defense in depth)
    setInterval(() => {
        scrubTaskElements();
    }, 3000);

    // Cookie change monitoring
    setInterval(updateUsernameFromCookies, 2000);

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserving);
    } else {
        startObserving();
    }

    console.log('[Poison Blocker] 📦 Loaded - will start when DOM ready');

})();
