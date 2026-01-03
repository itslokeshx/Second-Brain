/**
 * Premium Sync Notification System
 * Shows a beautiful, minimal toast notification on sync success/failure
 */

(function () {
    'use strict';

    // Create notification container
    const createNotificationContainer = () => {
        let container = document.getElementById('sync-notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'sync-notification-container';
            container.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        return container;
    };

    // Show premium notification
    window.showSyncNotification = function (message, type = 'success', duration = 3000) {
        const container = createNotificationContainer();

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'sync-notification';

        // Set colors based on type
        const colors = {
            success: {
                bg: '#10b981',
                icon: '✓',
                shadow: 'rgba(16, 185, 129, 0.3)'
            },
            error: {
                bg: '#ef4444',
                icon: '✕',
                shadow: 'rgba(239, 68, 68, 0.3)'
            },
            warning: {
                bg: '#f59e0b',
                icon: '⚠',
                shadow: 'rgba(245, 158, 11, 0.3)'
            },
            info: {
                bg: '#3b82f6',
                icon: 'ℹ',
                shadow: 'rgba(59, 130, 246, 0.3)'
            }
        };

        const color = colors[type] || colors.success;

        notification.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 20px;
            background: ${color.bg};
            color: white;
            border-radius: 12px;
            box-shadow: 0 8px 24px ${color.shadow}, 0 2px 8px rgba(0, 0, 0, 0.1);
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 12px;
            pointer-events: auto;
            opacity: 0;
            transform: translateX(400px);
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            max-width: 400px;
            min-width: 280px;
        `;

        notification.innerHTML = `
            <div style="
                width: 24px;
                height: 24px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: bold;
                flex-shrink: 0;
            ">${color.icon}</div>
            <div style="flex: 1; line-height: 1.4;">${message}</div>
        `;

        container.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(0)';
            });
        });

        // Auto remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(400px)';

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, duration);
    };

})();
