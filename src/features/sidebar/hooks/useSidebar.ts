import { useState } from 'react';

export function useSidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'explorer' | 'search' | 'outline' | 'workspaces' | 'typing' | 'canvas' | 'calendar' | 'world-clock'>('explorer');

    return {
        isOpen,
        setIsOpen,
        activeTab,
        setActiveTab,
    };
}
