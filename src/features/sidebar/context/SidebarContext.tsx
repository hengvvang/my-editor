import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    width: number;
    setWidth: (width: number) => void;
    toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('files');
    const [width, setWidth] = useState(260);

    const toggle = () => setIsOpen(prev => !prev);

    return (
        <SidebarContext.Provider value={{
            isOpen,
            setIsOpen,
            activeTab,
            setActiveTab,
            width,
            setWidth,
            toggle
        }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebarContext = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebarContext must be used within a SidebarProvider');
    }
    return context;
};
