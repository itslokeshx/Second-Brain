/**
 * Redux State Diagnostic
 * Run this in console to see what main.js thinks the current state is
 */

(function () {


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


        if (state.projectInfo) {


            if (state.projectInfo.presetProjects?.orderedIds?.[0]) {
                const firstId = state.projectInfo.presetProjects.orderedIds[0];
                const firstProject = state.projectInfo.presetProjects.projects[firstId];
            }
        }

        return state;
    } else {


        // Try to find React root
        const rootDiv = document.getElementById('root');
        if (rootDiv) {
            const reactRoot = rootDiv._reactRootContainer || rootDiv._reactRoot;
            if (reactRoot) {

            } else {

            }
        } else {

        }
    }

})();
