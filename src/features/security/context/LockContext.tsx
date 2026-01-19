import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const STORAGE_KEY = 'typoly_lock_password';

interface LockContextType {
    isLocked: boolean;
    lock: () => void;
    unlock: (password: string) => boolean;
    setPassword: (password: string, persistent?: boolean) => void;
    hasPassword: boolean;
    showSetPasswordDialog: boolean;
    setShowSetPasswordDialog: (show: boolean) => void;
    checkPassword: (password: string) => boolean;
    clearPassword: () => void;
}

const LockContext = createContext<LockContextType | null>(null);

export const LockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [password, setPasswordState] = useState<string | null>(null);
    const [isPersistent, setIsPersistent] = useState(false);
    const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);

    // Initialize from storage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setPasswordState(stored);
            setIsPersistent(true);
            setIsLocked(true); // Auto-lock on start if password exists
        }
    }, []);

    const lock = () => {
        if (!password) {
            setShowSetPasswordDialog(true);
        } else {
            setIsLocked(true);
        }
    };

    const unlock = (inputPassword: string) => {
        if (inputPassword === password) {
            setIsLocked(false);
            if (!isPersistent) {
                setPasswordState(null);
            }
            return true;
        }
        return false;
    };

    const setPassword = (newPassword: string, persistent: boolean = false) => {
        setPasswordState(newPassword);
        setIsPersistent(persistent);

        if (persistent) {
            localStorage.setItem(STORAGE_KEY, newPassword);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }

        setIsLocked(true);
        setShowSetPasswordDialog(false);
    };

    const clearPassword = () => {
        setPasswordState(null);
        setIsPersistent(false);
        localStorage.removeItem(STORAGE_KEY);
    };

    const checkPassword = (input: string) => input === password;

    return (
        <LockContext.Provider value={{
            isLocked,
            lock,
            unlock,
            setPassword,
            hasPassword: !!password,
            showSetPasswordDialog,
            setShowSetPasswordDialog,
            checkPassword,
            clearPassword
        }}>
            {children}
        </LockContext.Provider>
    );
};

export const useLockContext = () => {
    const context = useContext(LockContext);
    if (!context) {
        throw new Error('useLockContext must be used within a LockProvider');
    }
    return context;
};
