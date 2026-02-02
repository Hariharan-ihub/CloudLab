import { useEffect, useRef } from 'react';

/**
 * Hook that alerts clicks outside of the passed ref
 * @param {React.MutableRefObject} ref - The ref of the element to detect outside clicks for
 * @param {Function} handler - The function to call on outside click
 */
export const useClickOutside = (ref, handler) => {
    useEffect(() => {
        const listener = (event) => {
            // Do nothing if clicking ref's element or descendent elements
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};
