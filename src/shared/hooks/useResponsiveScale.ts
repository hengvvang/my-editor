import { useCallback, useEffect, useRef, useState } from 'react';

interface AutoFitOptions {
    baseWidth?: number;
    baseHeight?: number;
    // If true, will not scale up beyond 1.0
    limitToOne?: boolean;
}

export function useResponsiveScale(options: AutoFitOptions = {}) {
    const {
        baseWidth = 1000,
        baseHeight = 800,
        limitToOne = true
    } = options;

    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    const updateScale = useCallback(() => {
        const node = containerRef.current;
        if (!node) return;

        const { clientWidth, clientHeight } = node;
        // If container is hidden or not ready
        if (clientWidth === 0 || clientHeight === 0) return;

        // Calculate ratios
        const ratioX = clientWidth / baseWidth;
        const ratioY = clientHeight / baseHeight;

        // Take the smaller ratio to ensure fit
        let s = Math.min(ratioX, ratioY);

        // If limitToOne is true and calculated scale > 1, cap it at 1
        if (limitToOne && s > 1) {
             s = 1;
        }

        setScale(s);
    }, [baseWidth, baseHeight, limitToOne]);

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        // Use ResizeObserver for performant updates
        const observer = new ResizeObserver(() => {
             requestAnimationFrame(updateScale);
        });

        observer.observe(node);
        updateScale(); // Initial call

        return () => {
            observer.disconnect();
        };
    }, [updateScale]);

    return {
        containerRef,
        scale,
        // Helper specifically for the content style
        contentStyle: {
            width: baseWidth,
            height: baseHeight,
            transform: `scale(${scale})`,
            flexShrink: 0,
            transformOrigin: 'center center',
            // Transition for smoother resizing
            transition: 'transform 0.1s ease-out'
        } as React.CSSProperties
    };
}
