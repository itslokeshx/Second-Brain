/**
 * Redux State Diagnostic
 * Run this in console to see what main.js thinks the current state is
 */

(function () {
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🔍 REDUX STATE DIAGNOSTIC');
    console.log('═══════════════════════════════════════════════════════════════════');

    // Try to find the Redux store
    let store = null;

    // Method 1: Check if Redux DevTools is available
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
        try {
            const devTools = window.__REDUX_DEVTOOLS_EXTENSION__;
            if (devTools.getStore) {
                store = devTools.getStore();
            }
        } catch (e) {
            console.log('DevTools method failed:', e.message);
        }
    }

    // Method 2: Check common global store locations
    if (!store) {
        const possibleStores = [
            window.store,
            window.__store,
            window.reduxStore,
            window.__REDUX_STORE__
        ];

        for (const s of possibleStores) {
            if (s && typeof s.getState === 'function') {
                store = s;
                break;
            }
        }
    }

    if (store) {
        const state = store.getState();
        console.log('✅ Found Redux store!');
        console.log('\n📊 Current State:');
        console.log(JSON.stringify(state, null, 2));

        if (state.projectInfo) {
            console.log('\n📁 Project Info:');
            console.log('  Preset Projects:', state.projectInfo.presetProjects?.orderedIds?.length || 0);
            console.log('  Custom Projects:', state.projectInfo.customProjects?.orderedIds?.length || 0);
            console.log('  Checked Project ID:', state.projectInfo.checkedProjectId);

            if (state.projectInfo.presetProjects?.orderedIds?.[0]) {
                const firstId = state.projectInfo.presetProjects.orderedIds[0];
                const firstProject = state.projectInfo.presetProjects.projects[firstId];
                console.log('  First Preset Project:', firstProject);
            }
        }

        return state;
    } else {
        console.log('❌ Could not find Redux store');
        console.log('The store might not be exposed globally');
        console.log('\nTrying to find React root...');

        // Try to find React root
        const rootDiv = document.getElementById('root');
        if (rootDiv) {
            const reactRoot = rootDiv._reactRootContainer || rootDiv._reactRoot;
            if (reactRoot) {
                console.log('✅ Found React root');
                console.log('React version:', React?.version || 'unknown');
            } else {
                console.log('❌ No React root found on #root');
            }
        } else {
            console.log('❌ No #root element found');
        }
    }

    console.log('═══════════════════════════════════════════════════════════════════');
})();
