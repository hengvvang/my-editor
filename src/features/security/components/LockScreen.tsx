import React, { useState, useEffect, useRef } from 'react';
import { useLockContext } from '../context/LockContext';
import { ContributionGraph } from '../../../shared/components/ContributionGraph';
import { Lock, ArrowRight, ShieldCheck, Check, RotateCcw, Settings } from 'lucide-react';
import { confirm } from '@tauri-apps/plugin-dialog';

export const LockScreen: React.FC = () => {
    const { isLocked, unlock, setPassword, showSetPasswordDialog, setShowSetPasswordDialog, clearPassword } = useLockContext();
    const [input, setInput] = useState("");
    const [confirmInput, setConfirmInput] = useState("");
    const [isPersistent, setIsPersistent] = useState(false);
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isLocked || showSetPasswordDialog) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isLocked, showSetPasswordDialog]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (unlock(input)) {
            setInput("");
            setError(false);
        } else {
            setError(true);
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setInput("");
        }
    };

    const handleSetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!input.trim()) return;

        if (input !== confirmInput) {
            setError(true);
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }

        setPassword(input, isPersistent);
        setInput("");
        setConfirmInput("");
        setIsPersistent(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'Escape' && showSetPasswordDialog) {
            setShowSetPasswordDialog(false);
            setInput("");
            setConfirmInput("");
            setError(false);
            setIsPersistent(false);
        }
    };

    const handleContainerClick = () => {
        // Automatically focus input when clicking on the background
        inputRef.current?.focus();
    };

    const handleResetPassword = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmed = await confirm(
            'Are you sure you want to reset and clear the current password?',
            { title: 'Reset Password', kind: 'warning', okLabel: 'Reset', cancelLabel: 'Cancel' }
        );
        if (confirmed) {
            clearPassword();
            setShowSetPasswordDialog(true);
        }
    };

    if (!isLocked && !showSetPasswordDialog) return null;

    if (showSetPasswordDialog) {
        return (
            <div
                className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                onClick={handleContainerClick}
            >
                <div
                    className="relative overflow-hidden w-full max-w-[400px] rounded-[32px] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 group"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Background: Diagonal Split + Grid */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white from-50% to-slate-950 to-50%">
                        {/* Grid Pattern Overlay */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTIwIDBIMHYyMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjMiLz48L3N2Zz4=')] mix-blend-difference pointer-events-none"></div>
                    </div>

                    <div className="relative p-8 flex flex-col items-center gap-6">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-current shadow-lg backdrop-blur-sm bg-white/10 mix-blend-difference text-white">
                            <ShieldCheck size={32} strokeWidth={1.5} />
                        </div>

                        {/* Text */}
                        <div className="text-center space-y-2 mix-blend-difference text-white">
                            <h2 className="text-2xl font-bold tracking-tight">Security Setup</h2>
                            <p className="text-sm opacity-80 max-w-[280px]">
                                Set a password to lock your workspace.
                            </p>
                        </div>

                        <form onSubmit={handleSetPassword} className="w-full flex flex-col gap-5">
                            <div className="space-y-4">
                                {/* New Password Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider ml-4 mix-blend-difference text-white opacity-70">New Password</label>
                                    <div className="relative group/input">
                                        <input
                                            ref={inputRef}
                                            type="password"
                                            autoFocus
                                            value={input}
                                            onChange={e => { setInput(e.target.value); setError(false); }}
                                            onKeyDown={handleKeyDown}
                                            className="w-full px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 focus:border-white/50 focus:bg-white/20 outline-none transition-all text-center tracking-widest font-bold text-lg mix-blend-difference text-white placeholder:text-white/20 shadow-inner"
                                            placeholder="••••••••"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                {/* Confirm Password Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider ml-4 mix-blend-difference text-white opacity-70">Confirm Password</label>
                                    <div className={`relative transition-transform duration-300 ${shake ? 'translate-x-[-4px]' : ''}`}>
                                        <input
                                            type="password"
                                            value={confirmInput}
                                            onChange={e => { setConfirmInput(e.target.value); setError(false); }}
                                            onKeyDown={handleKeyDown}
                                            className={`w-full px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border outline-none transition-all text-center tracking-widest font-bold text-lg mix-blend-difference text-white placeholder:text-white/20 shadow-inner
                                                ${error ? 'border-red-500/50 bg-red-500/10' : 'border-white/20 focus:border-white/50 focus:bg-white/20'}
                                            `}
                                            placeholder="••••••••"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                {/* Persistent Toggle */}
                                <div
                                    className="flex items-center gap-3 p-2 px-4 rounded-full cursor-pointer transition-colors border border-white/10 hover:bg-white/5 mix-blend-difference text-white"
                                    onClick={() => setIsPersistent(!isPersistent)}
                                >
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isPersistent ? 'bg-white border-white' : 'border-white/50'}`}>
                                        {isPersistent && <Check size={12} className="text-black" strokeWidth={3} />}
                                    </div>
                                    <div className="flex flex-col select-none">
                                        <span className="text-xs font-bold">Restorable Password</span>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && <p className="text-xs text-red-400 text-center font-bold animate-in fade-in slide-in-from-top-1 bg-black/50 py-1 rounded-full backdrop-blur-sm">Passwords do not match</p>}

                            {/* Buttons */}
                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowSetPasswordDialog(false); setInput(""); setConfirmInput(""); setError(false); setIsPersistent(false); }}
                                    className="flex-1 px-4 py-3 text-sm font-bold rounded-full border border-white/20 hover:bg-white/10 transition-all mix-blend-difference text-white uppercase tracking-wide"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!input.trim() || !confirmInput.trim()}
                                    className="flex-1 px-4 py-3 text-sm font-bold bg-white text-black rounded-full hover:scale-105 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-wide"
                                >
                                    Set Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                <style>{`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-4px); }
                        75% { transform: translateX(4px); }
                    }
                    .animate-shake {
                        animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-[99999] bg-white/60 backdrop-blur-xl flex flex-col items-center justify-center select-none animate-in fade-in duration-500"
            onClick={handleContainerClick}
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-100/30 rounded-full blur-[100px]" />
            </div>

            <div className="relative flex flex-col items-center gap-8 p-8 animate-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 ring-1 ring-slate-900/5 hover:scale-105 transition-transform duration-500 ease-out">
                    <ContributionGraph />
                </div>

                <div className="w-full max-w-[280px]">
                    <form
                        onSubmit={handleSubmit}
                        className="relative group"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`
                            relative overflow-hidden rounded-full backdrop-blur-md shadow-xl
                            transition-all duration-300 ring-1 ring-white/50 border border-white/30
                            bg-white/20 hover:bg-white/30
                            ${shake ? 'translate-x-[-2px] ring-red-400 bg-red-50/20' : 'hover:scale-[1.01]'}
                        `}>
                            <input
                                ref={inputRef}
                                type="password"
                                value={input}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => { setInput(e.target.value); setError(false); }}
                                placeholder="Enter Password"
                                className="select-text w-full pl-6 pr-12 py-3 text-center bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-500/70 font-medium tracking-widest text-lg"
                                autoComplete="off"
                            />

                            <button
                                type="submit"
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/80 text-white shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:bg-black ${input ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
                            >
                                <ArrowRight size={14} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="mt-4 text-center h-5">
                            {error ? (
                                <span className="text-xs font-semibold text-red-500 animate-in fade-in slide-in-from-top-1">
                                    Incorrect password
                                </span>
                            ) : (
                                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400">
                                    <Lock size={10} />
                                    <span>Session Locked</span>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <button
                onClick={handleResetPassword}
                className="absolute bottom-8 right-8 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-slate-600 hover:text-red-600 transition-all duration-300 border border-white/30 shadow-sm hover:shadow-md group"
                title="Reset Password"
            >
                <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>

            <style>{`
                /* Hide browser default password reveal button */
                input[type="password"]::-ms-reveal,
                input[type="password"]::-ms-clear {
                    display: none;
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }
             `}</style>
        </div>
    );
};
