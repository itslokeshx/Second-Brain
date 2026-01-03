/**
 * Loading Orchestrator - State-Aware Loading System
 * ═══════════════════════════════════════════════════════════════════════════
 * Manages all loading phases with real state detection (NO timeouts)
 * 
 * Phases:
 * - nav: Browser navigation load
 * - authReload: Post-login reload
 * - hydrate: main.js hydration & IndexedDB sync
 * - logout: Logout reload
 * 
 * Loader visible if ANY phase is true
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL STATE
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        phases: {
            nav: false,
            authReload: false,
            hydrate: false,
            logout: false
        },
        loaderElement: null,
        initialized: false
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CORE API
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Set phase state and update loader visibility
     */
    function setPhase(phaseName, value) {
        if (!(phaseName in state.phases)) {
            console.warn('[Loader] Unknown phase:', phaseName);
            return;
        }

        const oldValue = state.phases[phaseName];
        state.phases[phaseName] = Boolean(value);

        if (oldValue !== state.phases[phaseName]) {
            // console.log(`[Loader] Phase "${phaseName}": ${oldValue} → ${state.phases[phaseName]}`);
            update();
        }
    }

    /**
     * Check if loader should be visible
     */
    function isVisible() {
        return Object.values(state.phases).some(Boolean);
    }

    /**
     * Update loader visibility based on phase state
     */
    function update() {
        if (!state.loaderElement) return;

        const shouldShow = isVisible();

        if (shouldShow) {
            state.loaderElement.classList.add('visible');
            // console.log('[Loader] 🔄 Showing loader', state.phases);
        } else {
            state.loaderElement.classList.remove('visible');
            // console.log('[Loader] ✅ Hiding loader (all phases complete)');
        }
    }

    /**
     * Show loader (manual override)
     */
    function show() {
        if (state.loaderElement) {
            state.loaderElement.classList.add('visible');
        }
    }

    /**
     * Hide loader (manual override)
     */
    function hide() {
        if (state.loaderElement) {
            state.loaderElement.classList.remove('visible');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE DETECTORS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Phase 1: Navigation Load
     */
    function setupNavigationDetector() {
        // Start: DOMContentLoaded
        if (document.readyState === 'loading') {
            setPhase('nav', true);
        }

        // End: window.load
        window.addEventListener('load', () => {
            setPhase('nav', false);
        });
    }

    /**
     * Phase 2: Auth Reload
     */
    function setupAuthReloadDetector() {
        // Check if we just reloaded after login
        const hasReloadedAfterLogin = sessionStorage.getItem('reloaded-after-login');

        if (hasReloadedAfterLogin) {
            setPhase('authReload', true);

            // End on first animation frame (first paint)
            requestAnimationFrame(() => {
                setPhase('authReload', false);
            });
        }
    }

    /**
     * Phase 3: Hydration
     */
    function setupHydrationDetector() {
        // Listen for hydration complete event from main.js
        window.addEventListener('SB_HYDRATION_DONE', () => {
            // console.log('[Loader] Hydration complete event received');
            setPhase('hydrate', false);
        });
    }

    /**
     * Phase 4: Logout
     */
    function setupLogoutDetector() {
        // Poll for login form (only when logout phase is active)
        function checkLoginForm() {
            if (state.phases.logout) {
                // Look for login form in DOM
                const loginForm = document.querySelector('[class*="Login"]') ||
                    document.querySelector('input[type="email"]') ||
                    document.querySelector('input[type="password"]');

                if (loginForm) {
                    // console.log('[Loader] Login form detected - logout complete');
                    setPhase('logout', false);
                } else {
                    // Keep checking
                    requestAnimationFrame(checkLoginForm);
                }
            }
        }

        // Start checking when logout phase becomes active
        const originalSetPhase = setPhase;
        setPhase = function (phaseName, value) {
            originalSetPhase(phaseName, value);

            if (phaseName === 'logout' && value === true) {
                requestAnimationFrame(checkLoginForm);
            }
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init() {
        if (state.initialized) return;

        // console.log('[Loader] 🚀 Initializing loading orchestrator...');

        // Get loader element
        state.loaderElement = document.getElementById('sb-loader');

        if (!state.loaderElement) {
            console.error('[Loader] ❌ Loader element not found! Add #sb-loader to HTML.');
            return;
        }

        // Setup all phase detectors
        setupNavigationDetector();
        setupAuthReloadDetector();
        setupHydrationDetector();
        setupLogoutDetector();

        state.initialized = true;
        // console.log('[Loader] ✅ Orchestrator ready');

        // Initial update
        update();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL API
    // ═══════════════════════════════════════════════════════════════════════

    window.__SB_LOADER = {
        phases: state.phases,
        setPhase,
        isVisible,
        show,
        hide,
        update
    };

    // console.log('[Loader] 📦 Loading orchestrator loaded');

})();
