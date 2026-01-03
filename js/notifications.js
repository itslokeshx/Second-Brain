// Notification System - In-page toast notifications
(function () {
    'use strict';

    // console.log('[Notifications] Initializing...');

    // Create notification container
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
    `;

    // Add to page when DOM is ready
    if (document.body) {
        document.body.appendChild(container);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(container);
        });
    }

    // Show notification function
    window.showNotification = function (message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = 'notification';

        const colors = {
            success: { bg: '#4CAF50', icon: '✓' },
            error: { bg: '#f44336', icon: '✗' },
            warning: { bg: '#ff9800', icon: '⚠' },
            info: { bg: '#2196F3', icon: 'ℹ' }
        };

        const style = colors[type] || colors.info;

        notification.style.cssText = `
            background: ${style.bg};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
            cursor: pointer;
            max-width: 100%;
            word-wrap: break-word;
        `;

        notification.innerHTML = `
            <span style="font-size: 20px; flex-shrink: 0;">${style.icon}</span>
            <span style="flex: 1;">${message}</span>
            <span style="font-size: 18px; opacity: 0.7; flex-shrink: 0;">×</span>
        `;

        // Click to dismiss
        notification.onclick = () => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        };

        container.appendChild(notification);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease-in';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    };

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ✅ OVERRIDE window.alert to be non-blocking
    window.alert = function (message) {
        console.warn('[Notifications] Intercepted alert:', message);
        window.showNotification(message, 'info', 4000);
        return true; // Return immediately to prevent blocking
    };

    // console.log('[Notifications] ✅ Ready - Replaced blocking alert() with notifications');
})();
