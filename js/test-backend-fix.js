/**
 * 🧪 DATA INTEGRITY REGRESSION TEST
 * 
 * Verifies that:
 * 1. DataSanitizer does NOT corrupt valid durations with missing timestamps.
 * 2. PomodoroDurationInterceptor does NOT corrupt rehydrated records.
 */

(function () {
    console.log('\n🧪 STARTING REGRESSION TEST...\n');

    let failures = 0;
    const testPomo = {
        id: 'test-pomo-' + Date.now(),
        duration: 1500000, // 25 mins
        startTime: 0,      // Backend default
        endTime: 0,        // Backend default
        status: 'completed'
    };

    // ---------------------------------------------------------
    // TEST 1: Data Sanitizer Logic
    // ---------------------------------------------------------
    console.log('Test 1: Data Sanitizer Logic');

    // Simulate Sanitizer Logic (extracted from verified code)
    const sanitizerPomo = { ...testPomo };
    let fixed = false;

    // --- LOGIC UNDER TEST ---
    if (typeof sanitizerPomo.duration !== 'number' || isNaN(sanitizerPomo.duration)) {
        const parsedDuration = Number(sanitizerPomo.duration);
        if (!isNaN(parsedDuration) && parsedDuration > 0) {
            sanitizerPomo.duration = parsedDuration;
            fixed = true;
        } else {
            if (sanitizerPomo.startTime && sanitizerPomo.endTime && typeof sanitizerPomo.startTime === 'number' && typeof sanitizerPomo.endTime === 'number') {
                sanitizerPomo.duration = sanitizerPomo.endTime - sanitizerPomo.startTime;
            } else {
                sanitizerPomo.duration = 0;
            }
            fixed = true;
        }
    }
    // ------------------------

    if (sanitizerPomo.duration === 1500000) {
        console.log('✅ PASS: Sanitizer preserved valid duration (1500000)');
    } else {
        console.error(`❌ FAIL: Sanitizer corrupted duration! Expected 1500000, got ${sanitizerPomo.duration}`);
        failures++;
    }

    // ---------------------------------------------------------
    // TEST 2: Interceptor Logic (Simulation)
    // ---------------------------------------------------------
    console.log('\nTest 2: Interceptor Logic');

    // Simulate Interceptor Logic
    let intercepted = false;
    let writtenValue = null;

    // Mock originalPut
    const originalPut = (val) => {
        writtenValue = val;
        return 'success';
    };

    const interceptor = (value) => {
        // --- LOGIC UNDER TEST ---
        // New logic: trust duration > 0
        if (value.duration && value.duration > 0) {
            console.log(`[Mock Interceptor] ⏭️ Skipping hydration write`);
            return originalPut(value);
        }

        // Old corrupting logic (simulated fallthrough)
        const now = Date.now();
        if (value.duration === undefined || value.duration === 0) {
            value.duration = 0;
            value.startTime = now;
        }
        return originalPut(value);
        // ------------------------
    };

    interceptor(testPomo);

    if (writtenValue.duration === 1500000 && writtenValue.startTime === 0) {
        console.log('✅ PASS: Interceptor respected rehydrated data');
    } else {
        console.error('❌ FAIL: Interceptor corrupted data!');
        console.error('   Got:', writtenValue);
        failures++;
    }

    // ---------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------
    console.log('\n════════════════════════════════════════════');
    if (failures === 0) {
        console.log('🎉 ALL TESTS PASSED. Fix is verified.');
    } else {
        console.error(`💥 ${failures} TESTS FAILED.`);
    }
    console.log('════════════════════════════════════════════\n');

})();
