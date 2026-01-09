import { useEffect, useState } from 'react';

export function useSidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const [width, setWidth] = useState(240);
    const [activeTab, setActiveTab] = useState<'explorer' | 'search' | 'outline' | 'workspaces'>('explorer');
    const [resizingTarget, setResizingTarget] = useState<'sidebar' | null>(null);

     // --- Global Resizing ---
     useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingTarget) return;
            if (resizingTarget === 'sidebar') {
                const newWidth = e.clientX - 48; // Activity bar width
                if (newWidth >= 0 && newWidth < 800) setWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            setResizingTarget(null);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
        if (resizingTarget) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingTarget]);

    return {
        isOpen,
        setIsOpen,
        width,
        setWidth,
        activeTab,
        setActiveTab,
        startResizing: () => setResizingTarget('sidebar'),
    };
}
