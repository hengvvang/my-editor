import { useEffect, useState } from 'react';

export type SidebarTab = 'explorer' | 'search' | 'outline' | 'workspaces' | 'typing' | 'canvas' | 'calendar' | 'world-clock' | 'translate';

export function useSidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<SidebarTab>('explorer');

    // Listen for sidebar:switch-tab events
    useEffect(() => {
        const handleSwitchTab = (event: Event) => {
            const customEvent = event as CustomEvent<{ tab: SidebarTab }>;
            const tab = customEvent.detail?.tab;
            if (tab) {
                setActiveTab(tab);
                setIsOpen(true);
            }
        };

        window.addEventListener('sidebar:switch-tab', handleSwitchTab);
        return () => window.removeEventListener('sidebar:switch-tab', handleSwitchTab);
    }, []);

    return {
        isOpen,
        setIsOpen,
        activeTab,
        setActiveTab,
    };
}
