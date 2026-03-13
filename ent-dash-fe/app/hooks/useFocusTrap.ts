import { useEffect, useRef } from 'react';

/**
 * Traps keyboard focus inside a container while active.
 * Pressing Tab/Shift+Tab cycles through focusable elements within the ref.
 * Pressing Escape calls the provided `onClose` callback.
 *
 * @example
 * const modalRef = useFocusTrap(isOpen, onClose);
 * <div ref={modalRef} ...>...</div>
 */
export function useFocusTrap(active: boolean, onClose?: () => void) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!active || !containerRef.current) return;

        const container = containerRef.current;

        // Focus first focusable element
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(',');

        const getFocusable = () =>
            Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));

        const firstFocusable = getFocusable()[0];
        firstFocusable?.focus();

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose?.();
                return;
            }

            if (e.key !== 'Tab') return;

            const focusable = getFocusable();
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (e.shiftKey) {
                // Shift+Tab: if on first element, wrap to last
                if (active === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                // Tab: if on last element, wrap to first
                if (active === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [active, onClose]);

    return containerRef;
}
