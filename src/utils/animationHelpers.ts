export function addRippleEffect(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    if (!button) { return; }

    const ripple = document.createElement('span');
    ripple.classList.add('ripple');

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
        ripple.remove();
    }, { once: true });
}

export interface PanelTransitionOptions {
    durationMs?: number;
    onComplete?: () => void;
}

export function openPanel(panelElement: HTMLElement, options?: PanelTransitionOptions): Promise<void> {
    return new Promise(resolve => {
        if (!panelElement) {
            console.warn('openPanel: panelElement is null or undefined.');
            resolve();
            return;
        }

        const duration = options?.durationMs || 300;

        panelElement.classList.remove('panel-closing');
        panelElement.classList.add('panel-hidden');

        void panelElement.offsetWidth;

        panelElement.classList.remove('panel-hidden');
        panelElement.classList.add('panel-open');

        const handleTransitionEnd = () => {
            panelElement.removeEventListener('transitionend', handleTransitionEnd);
            options?.onComplete?.();
            resolve();
        };

        const computedStyle = window.getComputedStyle(panelElement);
        const transitionDuration = parseFloat(computedStyle.transitionDuration) * 1000;

        if (transitionDuration > 0) {
            panelElement.addEventListener('transitionend', handleTransitionEnd, { once: true });
        } else {
            setTimeout(handleTransitionEnd, duration);
        }
    });
}

export function closePanel(panelElement: HTMLElement, options?: PanelTransitionOptions): Promise<void> {
    return new Promise(resolve => {
        if (!panelElement) {
            console.warn('closePanel: panelElement is null or undefined.');
            resolve();
            return;
        }

        const duration = options?.durationMs || 300;

        panelElement.classList.remove('panel-open');
        panelElement.classList.add('panel-closing');

        const handleTransitionEnd = () => {
            panelElement.removeEventListener('transitionend', handleTransitionEnd);
            panelElement.classList.add('panel-hidden');
            panelElement.classList.remove('panel-closing');
            options?.onComplete?.();
            resolve();
        };

        const computedStyle = window.getComputedStyle(panelElement);
        const transitionDuration = parseFloat(computedStyle.transitionDuration) * 1000;

        if (transitionDuration > 0) {
            panelElement.addEventListener('transitionend', handleTransitionEnd, { once: true });
        } else {
            setTimeout(handleTransitionEnd, duration);
        }
    });
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationOptions {
    durationMs?: number;
    type?: NotificationType;
    onDismiss?: () => void;
}

class NotificationManager {
    private static instance: NotificationManager;
    private container: HTMLElement | null = null;
    private notificationQueue: HTMLElement[] = [];
    private maxNotifications = 3;

    private constructor() {
        this.createContainer();
    }

    public static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    private createContainer(): void {
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    public showNotification(message: string, options?: NotificationOptions): void {
        if (!this.container) {
            console.error('Notification container not found or created.');
            return;
        }

        const notificationElement = document.createElement('div');
        notificationElement.classList.add('notification');
        notificationElement.classList.add(`notification-${options?.type || 'info'}`);
        notificationElement.textContent = message;

        this.notificationQueue.push(notificationElement);
        this.container.appendChild(notificationElement);

        requestAnimationFrame(() => {
            notificationElement.classList.add('notification-show');
        });

        const duration = options?.durationMs || 3000;
        setTimeout(() => this.dismissNotification(notificationElement, options?.onDismiss), duration);

        this.manageNotificationVisibility();
    }

    private dismissNotification(notificationElement: HTMLElement, onDismissCallback?: () => void): void {
        if (!notificationElement || !notificationElement.parentElement) { return; }

        notificationElement.classList.remove('notification-show');
        notificationElement.classList.add('notification-hide');

        notificationElement.addEventListener('animationend', () => {
            notificationElement.remove();
            this.notificationQueue = this.notificationQueue.filter(n => n !== notificationElement);
            onDismissCallback?.();
            this.manageNotificationVisibility();
        }, { once: true });
    }

    private manageNotificationVisibility(): void {
        // This method can be expanded to handle complex stacking logic
        // For now, it primarily ensures the queue is updated upon dismissal.
    }
}

export const notificationManager = NotificationManager.getInstance();

export interface DamageNumberOptions {
    isCritical?: boolean;
    color?: string;
    durationMs?: number;
    offsetY?: number;
    offsetX?: number;
}

export function showDamageNumber(
    targetElement: HTMLElement,
    value: number | string,
    options?: DamageNumberOptions,
): void {
    if (!targetElement) {
        console.warn('showDamageNumber: targetElement is null or undefined.');
        return;
    }

    const damageNumber = document.createElement('span');
    damageNumber.classList.add('damage-number');
    damageNumber.textContent = String(value);

    if (options?.isCritical) {
        damageNumber.classList.add('critical');
    }
    if (options?.color) {
        damageNumber.style.color = options.color;
    }

    const rect = targetElement.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    damageNumber.style.position = 'absolute';
    damageNumber.style.left = `${rect.left + scrollX + rect.width / 2 + (options?.offsetX || 0)}px`;
    damageNumber.style.top = `${rect.top + scrollY - 20 + (options?.offsetY || 0)}px`;

    document.body.appendChild(damageNumber);

    requestAnimationFrame(() => {
        damageNumber.classList.add('float-up-fade-out');
    });

    const duration = options?.durationMs || 1000;
    damageNumber.addEventListener('animationend', () => {
        damageNumber.remove();
    }, { once: true });

    setTimeout(() => {
        if (damageNumber.parentElement) {
            damageNumber.remove();
        }
    }, duration + 50);
}

export function animateBar(
    barElement: HTMLElement,
    currentValue: number,
    maxValue: number,
    durationMs: number = 500,
): Promise<void> {
    return new Promise(resolve => {
        if (!barElement) {
            console.warn('animateBar: barElement is null or undefined.');
            resolve();
            return;
        }

        const targetWidth = (currentValue / maxValue) * 100;

        barElement.style.transition = `width ${durationMs}ms ease-out`;

        barElement.style.width = `${targetWidth}%`;

        const handleTransitionEnd = () => {
            barElement.removeEventListener('transitionend', handleTransitionEnd);
            barElement.style.transition = '';
            resolve();
        };

        barElement.addEventListener('transitionend', handleTransitionEnd, { once: true });

        setTimeout(() => {
            if (barElement.style.transition !== '') {
                barElement.style.transition = '';
                resolve();
            }
        }, durationMs + 50);
    });
}

export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}