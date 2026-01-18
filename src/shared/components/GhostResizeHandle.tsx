import React, { useState, useRef, useCallback, useEffect } from "react";

/**
 * A resizing handle that shows a "ghost" dashed line overlay during drag,
 * and only commits the layout change on mouse up.
 * Use this to avoid expensive re-renders during drag.
 *
 * @param onResizeEnd Callback with the new percentage (relative to container) [0-100]
 * @param containerRef Optional ref to the container element. If not provided, it tries to find closest PanelGroup.
 * @param minPercent Minimum allowed position percentage (default 20)
 * @param maxPercent Maximum allowed position percentage (default 80)
 * @param orientation 'horizontal' (drag left-right) or 'vertical' (drag up-down). CURRENTLY ONLY HORIZONTAL IS IMPLEMENTED FULLY.
 */
export const GhostResizeHandle: React.FC<{
    className?: string;
    onResizeEnd: (percent: number) => void;
    orientation?: 'horizontal' | 'vertical';
    containerRef?: React.RefObject<HTMLDivElement>;
    minPercent?: number;
    maxPercent?: number;
}> = ({ className = '', onResizeEnd, containerRef, minPercent = 20, maxPercent = 80, orientation = 'horizontal' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isAtLimit, setIsAtLimit] = useState(false);
    const [ghostPos, setGhostPos] = useState(0); // Left (horizontal) or Top (vertical)
    const startRef = useRef<{ containerStart: number, containerSize: number } | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Find the specific container for THIS handle
        let container = containerRef?.current;
        if (!container) {
            // Try explicit ID first if we are in a known structure, or fallback to parent (panel group container)
            container = e.currentTarget.parentElement as HTMLDivElement;
            if (!container || (!container.classList.contains('flex-1') && !container.getAttribute('data-panel-group-direction'))) {
                // Fallback to closest search if parent isn't the group
                container = e.currentTarget.closest('[data-panel-group-direction]') as HTMLDivElement;
            }
        }

        if (!container) return;

        const rect = container.getBoundingClientRect();

        startRef.current = {
            containerStart: orientation === 'horizontal' ? rect.left : rect.top,
            containerSize: orientation === 'horizontal' ? rect.width : rect.height
        };

        // Use FIXED coordinates for the ghost line to avoid layout quirks
        setGhostPos(orientation === 'horizontal' ? e.clientX : e.clientY);
        setIsAtLimit(false);
        setIsDragging(true);
        e.preventDefault();
        e.stopPropagation();
    }, [containerRef, orientation]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!startRef.current) return;
            const { containerStart, containerSize } = startRef.current;

            const clientPos = orientation === 'horizontal' ? e.clientX : e.clientY;

            // Constrain within container bounds (with percentage limits)
            let newPos = clientPos;
            const minPos = containerStart + (containerSize * (minPercent / 100));
            const maxPos = containerStart + (containerSize * (maxPercent / 100));

            let atLimit = false;
            if (newPos <= minPos) { newPos = minPos; atLimit = true; }
            else if (newPos >= maxPos) { newPos = maxPos; atLimit = true; }

            setIsAtLimit(atLimit);
            setGhostPos(newPos);
        };

        const handleMouseUp = (e: MouseEvent) => {
            setIsDragging(false);
            if (startRef.current) {
                const { containerSize, containerStart } = startRef.current;
                const minPx = containerSize * (minPercent / 100);
                const maxPx = containerSize * (maxPercent / 100);
                const clientPos = orientation === 'horizontal' ? e.clientX : e.clientY;

                // Final calculation using the last valid position
                let finalPos = clientPos;
                // Clamp again just in case (ensure we respect the same limits)
                if (finalPos < containerStart + minPx) finalPos = containerStart + minPx;
                if (finalPos > containerStart + maxPx) finalPos = containerStart + maxPx;

                // Calculate percentage relative to container
                const relPos = finalPos - containerStart;
                const percent = (relPos / containerSize) * 100;

                onResizeEnd(percent);
            }
            startRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, onResizeEnd, minPercent, maxPercent, orientation]);

    return (
        <>
            {/* The Visual Handler (Static) */}
            <div
                onMouseDown={handleMouseDown}
                className={`group relative flex justify-center items-center transition-colors focus:outline-none outline-none z-[100] shrink-0 ${className}
                    ${orientation === 'horizontal' ? 'w-3 -ml-1.5 -mr-1.5 cursor-col-resize' : 'h-3 -mt-1.5 -mb-1.5 cursor-row-resize w-full'}`}
            >
                <div className={`bg-slate-200 group-hover:bg-blue-400 active:bg-blue-600 transition-colors pointer-events-none
                    ${orientation === 'horizontal' ? 'w-[1px] h-full' : 'h-[1px] w-full'}`} />
            </div>

            {/* The Ghost Line (Fixed Overlay) */}
            {isDragging && (
                <div
                    className={`fixed z-[9999] pointer-events-none ${isAtLimit ? 'border-red-500' : 'border-blue-500'}
                        ${orientation === 'horizontal' ? 'top-0 bottom-0 w-[1px] border-l-2 border-dashed' : 'left-0 right-0 h-[1px] border-t-2 border-dashed'}`}
                    style={{
                        left: orientation === 'horizontal' ? ghostPos : undefined,
                        top: orientation === 'vertical' ? ghostPos : undefined
                    }}
                />
            )}
        </>
    );
};
