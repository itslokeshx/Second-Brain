(function () {
    console.log('[WebSocket Mock] Initializing...');

    const OriginalWebSocket = window.WebSocket;

    // Create a mock WebSocket class
    class MockWebSocket extends EventTarget {
        constructor(url, protocols) {
            super();
            console.log(`[WebSocket Mock] Intercepted connection to: ${url}`);
            this.url = url;
            this.readyState = 0; // CONNECTING

            // Simulate connection success after a short delay
            setTimeout(() => {
                console.log('[WebSocket Mock] Simulating "open" event');
                this.readyState = 1; // OPEN
                if (this.onopen) {
                    this.onopen(new Event('open'));
                }
                this.dispatchEvent(new Event('open'));

                // Simulate initial "sync complete" or "connected" message if needed
                // Legacy apps often expect a "hello" or "init" message
                /*
                setTimeout(() => {
                    const msg = { type: 'connected', timestamp: Date.now() };
                    this.triggerMessage(JSON.stringify(msg));
                }, 500);
                */
            }, 100);
        }

        send(data) {
            console.log('[WebSocket Mock] Sending data:', data);

            // ✅ CRITICAL: Auto-respond to STOMP CONNECT frame
            if (typeof data === 'string' && data.startsWith('CONNECT')) {
                console.log('[WebSocket Mock] Responding to CONNECT frame...');
                setTimeout(() => {
                    // Expects: CONNECTED, version, heart-beat, user-name
                    const connectedFrame = 'CONNECTED\nversion:1.1\nheart-beat:0,0\nuser-name:guest\n\n\0';
                    this.triggerMessage(connectedFrame);
                }, 100);
            }

            // ✅ CRITICAL: Auto-respond to SUBSCRIBE frame
            if (typeof data === 'string' && data.startsWith('SUBSCRIBE')) {
                console.log('[WebSocket Mock] Responding to SUBSCRIBE frame...');
                setTimeout(() => {
                    const syncMsg = JSON.stringify({ type: 'SYNC' });
                    // Provide a minimal STOMP MESSAGE frame
                    // destination:/topic/Pomodoro
                    // content-type:application/json
                    // subscription:sub-0 (or whatever was sent)
                    // body...

                    const msgFrame = `MESSAGE\ndestination:/topic/Pomodoro\ncontent-type:application/json\nsubscription:sub-0\n\n${syncMsg}\0`;
                    this.triggerMessage(msgFrame);
                }, 200);
            }
        }

        close() {
            console.log('[WebSocket Mock] Closing connection');
            this.readyState = 3; // CLOSED
            if (this.onclose) {
                this.onclose(new Event('close'));
            }
            this.dispatchEvent(new Event('close'));
        }

        // Helper to trigger messages from "server"
        triggerMessage(data) {
            const event = new MessageEvent('message', {
                data: data,
                origin: 'ws://mock-server'
            });
            if (this.onmessage) {
                this.onmessage(event);
            }
            this.dispatchEvent(event);
        }
    }

    // Constants required by WebSocket API
    MockWebSocket.CONNECTING = 0;
    MockWebSocket.OPEN = 1;
    MockWebSocket.CLOSING = 2;
    MockWebSocket.CLOSED = 3;

    // Replace the global WebSocket
    window.WebSocket = MockWebSocket;
    console.log('[WebSocket Mock] Active - All WS connections will now succeed locally');

})();
