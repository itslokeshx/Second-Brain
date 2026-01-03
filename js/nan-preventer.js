// ═══════════════════════════════════════════════════════════════════════
// 🛡️ NaN PREVENTER: Intercept and Fix NaN Display in UI
// ═══════════════════════════════════════════════════════════════════════
// 
// This script prevents "NaN" from appearing in the UI by intercepting
// DOM mutations and replacing NaN values with "0" or appropriate defaults.
// 
// CRITICAL: This fixes the bug where system projects (Today, This Week, etc.)
// show "NaNh NaNm" because they don't have estimatePomoNum values.
// ═══════════════════════════════════════════════════════════════════════

(function () {
    'use strict';


    // ═══════════════════════════════════════════════════════════════════════
    // 🚨 REGRESSION DETECTOR: If this fires, stat gates are broken
    // ═══════════════════════════════════════════════════════════════════════
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            try {
                const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks') || '[]');
                const hasNaN = tasks.some(t =>
                    t.actualPomoNum === undefined ||
                    t.elapsedTime === undefined ||
                    isNaN(t.actualPomoNum) ||
                    isNaN(t.elapsedTime)
                );

                if (hasNaN) {
                    console.error('🚨 REGRESSION DETECTED: Tasks have NaN/undefined stats in localStorage');
                    console.error('🚨 This means a gate was bypassed - check hydration-mutex.js and sync-button-handler.js');
                }
            } catch (e) {
                console.warn('[NaN Preventer] Regression check failed:', e);
            }
        }, 2000);
    });

    // ═══════════════════════════════════════════════════════════════════
    // CRITICAL FIX: Replace NaN in text content
    // ═══════════════════════════════════════════════════════════════════
    function sanitizeTextContent(text) {
        if (!text || typeof text !== 'string') return text;

        // Replace various NaN patterns
        return text
            .replace(/NaNh/g, '0h')
            .replace(/NaNm/g, '0m')
            .replace(/NaN/g, '0');
    }

    // ═══════════════════════════════════════════════════════════════════
    // Mutation Observer to catch NaN in real-time
    // ═══════════════════════════════════════════════════════════════════
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'characterData' || mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const originalText = node.textContent;
                        const sanitizedText = sanitizeTextContent(originalText);

                        if (originalText !== sanitizedText) {
                            node.textContent = sanitizedText;
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check all text nodes within this element
                        const walker = document.createTreeWalker(
                            node,
                            NodeFilter.SHOW_TEXT,
                            null,
                            false
                        );

                        let textNode;
                        while (textNode = walker.nextNode()) {
                            const originalText = textNode.textContent;
                            const sanitizedText = sanitizeTextContent(originalText);

                            if (originalText !== sanitizedText) {
                                textNode.textContent = sanitizedText;
                            }
                        }
                    }
                });

                // Also check modified text nodes
                if (mutation.type === 'characterData') {
                    const originalText = mutation.target.textContent;
                    const sanitizedText = sanitizeTextContent(originalText);

                    if (originalText !== sanitizedText) {
                        mutation.target.textContent = sanitizedText;
                    }
                }
            }
        });
    });

    // ═══════════════════════════════════════════════════════════════════
    // Start observing when DOM is ready
    // ═══════════════════════════════════════════════════════════════════
    function startObserving() {
        const targetNode = document.body || document.documentElement;

        observer.observe(targetNode, {
            childList: true,
            subtree: true,
            characterData: true,
            characterDataOldValue: true
        });


        // Also do an initial cleanup pass
        cleanupExistingNaN();
    }

    // ═══════════════════════════════════════════════════════════════════
    // Clean up any existing NaN values in the DOM
    // ═══════════════════════════════════════════════════════════════════
    function cleanupExistingNaN() {
        const walker = document.createTreeWalker(
            document.body || document.documentElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let textNode;
        let fixCount = 0;

        while (textNode = walker.nextNode()) {
            const originalText = textNode.textContent;
            const sanitizedText = sanitizeTextContent(originalText);

            if (originalText !== sanitizedText) {
                textNode.textContent = sanitizedText;
                fixCount++;
            }
        }

        if (fixCount > 0) {
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Initialize when DOM is ready
    // ═══════════════════════════════════════════════════════════════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserving);
    } else {
        startObserving();
    }

    // ═══════════════════════════════════════════════════════════════════
    // Also run cleanup periodically (every 2 seconds) as a safety net
    // ═══════════════════════════════════════════════════════════════════
    setInterval(() => {
        cleanupExistingNaN();
    }, 2000);

})();
