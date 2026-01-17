import React, { useEffect, useRef, useState, memo, useLayoutEffect } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { cities, City } from './cities';
import { Play, Pause, RotateCcw, Maximize2, Minimize2, Globe as GlobeIcon, Sun, Moon } from 'lucide-react';

// --- Hook for Element Size ---
function useElementSize<T extends HTMLElement>() {
    const [size, setSize] = useState({ width: 0, height: 0 });
    const ref = useRef<T>(null);

    useLayoutEffect(() => {
        if (!ref.current) return;

        const updateSize = () => {
            if (ref.current) {
                const { width, height } = ref.current.getBoundingClientRect();
                setSize({ width, height });
            }
        }

        updateSize();

        const observer = new ResizeObserver(updateSize);
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return { ref, width: size.width, height: size.height };
}

// --- Improved React Flip Clock ---
const FlipCard = memo(({ digit, label, isZenMode }: { digit: number | string; label?: string; isZenMode: boolean }) => {
    const [current, setCurrent] = useState(digit);
    const [previous, setPrevious] = useState(digit);
    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
        if (digit !== current) {
            setPrevious(current);
            setCurrent(digit);
            setIsFlipping(true);
            const timer = setTimeout(() => setIsFlipping(false), 600);
            return () => clearTimeout(timer);
        }
    }, [digit, current]);

    // Responsive sizing - Default, overridden by parent scaling in Sidebar mode
    const sizeClass = "w-10 h-16 text-4xl"; // Fixed base size, we will scale the parent

    return (
        <div className="flex flex-col items-center mx-[2px]">
            <div className={`relative ${sizeClass} bg-[#e0e0e0] dark:bg-[#2d2d2d] rounded shadow-md text-[#333] dark:text-[#e5e5e5] font-bold leading-none perspective-card`}>

                {/* Top Half (Current) - Shows Top 50% of Current Digit */}
                <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden bg-[#e0e0e0] dark:bg-[#2d2d2d] rounded-t border-b border-black/10 z-0">
                    <div className="absolute top-0 left-0 w-full h-[200%] flex items-center justify-center">
                        {current}
                    </div>
                </div>

                {/* Bottom Half (Previous) - Shows Bottom 50% of Previous Digit */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden bg-[#e0e0e0] dark:bg-[#2d2d2d] rounded-b border-t border-black/10 z-0">
                    <div className="absolute bottom-0 left-0 w-full h-[200%] flex items-center justify-center">
                        {previous}
                    </div>
                </div>

                {/* Animation Layers */}
                {isFlipping && (
                    <>
                        {/* Top Flap (Previous) - Flips Down */}
                        <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden bg-[#e0e0e0] dark:bg-[#2d2d2d] rounded-t border-b border-black/10 z-20 origin-bottom animate-flip-down-front backface-hidden">
                            <div className="absolute top-0 left-0 w-full h-[200%] flex items-center justify-center">
                                {previous}
                            </div>
                        </div>
                        {/* Bottom Flap (Current) - Flips Up (Revealed) */}
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden bg-[#e0e0e0] dark:bg-[#2d2d2d] rounded-b border-t border-black/10 z-10 origin-top animate-flip-down-back backface-hidden">
                            <div className="absolute bottom-0 left-0 w-full h-[200%] flex items-center justify-center">
                                {current}
                            </div>
                        </div>
                    </>
                )}
            </div>
            {!isZenMode && label && <span className="text-[9px] text-gray-400 mt-1 uppercase font-medium tracking-wider">{label}</span>}
        </div>
    );
});

const ReactFlipClock = ({ timeZone, isZenMode, containerWidth, timeLeft }: { timeZone: string, isZenMode: boolean, containerWidth: number, timeLeft: number | null }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const update = () => {
            try {
                const now = new Date();
                const str = now.toLocaleString('en-US', { timeZone });
                setTime(new Date(str));
            } catch (e) {
                setTime(new Date());
            }
        };
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [timeZone]);

    const h = time.getHours();
    const m = time.getMinutes();
    const s = time.getSeconds();

    const renderGroup = (val: number, label: string) => {
        const str = val.toString().padStart(2, '0');
        return (
            <div className="flex gap-[1px]">
                <FlipCard digit={str[0]} isZenMode={isZenMode} />
                <FlipCard digit={str[1]} isZenMode={isZenMode} label={label} />
            </div>
        );
    };

    // Auto-Scaling Logic
    // We use the same base metric (320px) for both Zen Mode and Normal Mode to ensure consistent scaling behavior
    const baseWidth = 320;
    let scale = 1;
    if (containerWidth > 0) {
        // -32 padding for sidebar, -80 for Zen Mode
        const padding = isZenMode ? 80 : 32;
        // Allow much larger scaling in Zen Mode (up to 10x is practically unlimited) to fill screen
        const maxScale = isZenMode ? 10.0 : 1.2;
        scale = Math.min(maxScale, Math.max(0.4, (containerWidth - padding) / baseWidth));
    }

    // Timer Formatter
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className={`flex flex-col items-center justify-center select-none transition-transform duration-200 origin-center`}
            style={{ transform: `scale(${scale})` }}
        >
            <div className="flex gap-2 items-start justify-center">
                {renderGroup(h, "Hrs")}
                {/* Divider */}
                <div className="flex flex-col gap-2 pt-4">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gray-400 opacity-50`} />
                    <div className={`w-1.5 h-1.5 rounded-full bg-gray-400 opacity-50`} />
                </div>
                {renderGroup(m, "Min")}
                <div className="flex flex-col gap-2 pt-4">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gray-400 opacity-50`} />
                    <div className={`w-1.5 h-1.5 rounded-full bg-gray-400 opacity-50`} />
                </div>
                {renderGroup(s, "Sec")}
            </div>

            {/* Timer Display - Scaled with Clock */}
            {timeLeft !== null && (
                <div className={`mt-6 text-center ${isZenMode ? 'mt-12' : ''}`}>
                    <div className="text-4xl font-[Share_Tech_Mono] text-emerald-400 tracking-widest drop-shadow-lg animate-pulse">
                        {formatTime(timeLeft)}
                    </div>
                    {isZenMode && <div className="text-white/50 text-[10px] mt-2 uppercase tracking-[0.5em]">Focusing</div>}
                </div>
            )}
        </div>
    );
};

// --- Timer Input Component ---
const TimerInput = ({ onStart }: { onStart: (seconds: number) => void }) => {
    const [val, setVal] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const mins = parseInt(val);
        if (!isNaN(mins) && mins > 0) {
            onStart(mins * 60);
            setVal("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-1 w-full max-w-[120px]">
            <input
                type="number"
                placeholder="Min"
                className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 text-center text-sm p-1 outline-none appearance-none"
                value={val}
                onChange={(e) => setVal(e.target.value)}
            />
            <button type="submit" className="text-xs text-blue-500 hover:text-blue-600 font-medium">GO</button>
        </form>
    );
};

const DEFAULT_CITY = cities[0];

export const WorldClockPane: React.FC = () => {
    const [selectedCity, setSelectedCity] = useState<City>(DEFAULT_CITY);
    const [isZenMode, setIsZenMode] = useState(false);
    const [globeTheme, setGlobeTheme] = useState<'day' | 'night'>('day'); // New State

    // Timer State
    const [timerDuration, setTimerDuration] = useState(25 * 60);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [activeTab, setActiveTab] = useState<'world' | 'timer'>('world'); // Sub-tabs

    const globeRef = useRef<any>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const sunIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Responsive: Measure the container size
    const { ref: containerRef, width: containerWidth, height: containerHeight } = useElementSize<HTMLDivElement>();

    // --- Globe Logic ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!globeRef.current) return;
            const globe = globeRef.current;
            const scene = globe.scene();

            // Clean Lights
            const lightsToRemove: THREE.Object3D[] = [];
            scene.traverse((obj: THREE.Object3D) => {
                if (obj instanceof THREE.Light) lightsToRemove.push(obj);
            });
            lightsToRemove.forEach(l => scene.remove(l));

            // Lighting Setup
            const ambientLight = new THREE.AmbientLight(0xffffff, globeTheme === 'day' ? 0.6 : 0.05);
            scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xffffff, globeTheme === 'day' ? 1.0 : 2.0);
            scene.add(sunLight);

            // "Night" theme is actually "Realistic Mode" (Day texture with realistic Lighting)
            // "Day" theme is "Static Mode" (Day texture with fixed bright lighting)
            if (globeTheme === 'night') {
                const updateSun = () => {
                    const now = new Date();
                    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
                    let sunLng = 180 - (utcHours * 15);
                    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
                    const sunLat = 23.44 * Math.sin((2 * Math.PI * (dayOfYear - 81)) / 365);

                    const r = 100;
                    const phi = (90 - sunLat) * (Math.PI / 180);
                    const theta = (sunLng + 90) * (Math.PI / 180);
                    const x = -r * Math.sin(phi) * Math.cos(theta);
                    const y = r * Math.cos(phi);
                    const z = r * Math.sin(phi) * Math.sin(theta);
                    sunLight.position.set(x, y, z);
                };
                updateSun();
                sunIntervalRef.current = setInterval(updateSun, 60000);
            } else {

                sunLight.position.set(50, 50, 50);
                if (sunIntervalRef.current) clearInterval(sunIntervalRef.current);
            }

            if (!isZenMode) {
                globe.pointOfView({ lat: selectedCity.lat, lng: selectedCity.lng, altitude: 2.5 }, 1000);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            if (sunIntervalRef.current) clearInterval(sunIntervalRef.current);
        };
    }, [globeTheme]);  // Re-run when theme changes

    // Auto-resize / Keep visible logic is handled by Flexbox 'flex-1' and 'min-h-0'

    const handleCitySelect = (city: City) => {
        setSelectedCity(city);
    };

    // --- Timer Logic ---
    useEffect(() => {
        if (isTimerRunning && timeLeft !== null && timeLeft > 0) {
            countdownRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev === null || prev <= 0) {
                        setIsTimerRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timeLeft === 0) { setIsTimerRunning(false); }
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [isTimerRunning, timeLeft]);

    const toggleTimer = () => {
        if (!isTimerRunning) {
            if (!timeLeft) setTimeLeft(timerDuration);
            setIsTimerRunning(true);
        } else {
            setIsTimerRunning(false);
        }
    };
    const resetTimer = () => {
        setIsTimerRunning(false);
        setTimeLeft(timerDuration);
    };
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCustomTimer = (secs: number) => {
        setTimerDuration(secs);
        setTimeLeft(secs);
        setIsTimerRunning(true);
        setActiveTab('timer'); // Switch view to timer
    };

    return (
        <div className={`flex flex-col h-full w-full bg-white dark:bg-[#1e1e1e] text-slate-800 dark:text-slate-200 overflow-hidden relative transition-all duration-500 ${isZenMode ? 'p-10 z-50 fixed inset-0' : ''}`}>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
                .perspective-card { perspective: 400px; transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                @keyframes flip-down-front { 0% { transform: rotateX(0deg); } 100% { transform: rotateX(-180deg); } }
                @keyframes flip-down-back { 0% { transform: rotateX(180deg); } 100% { transform: rotateX(0deg); } }
                .animate-flip-down-front { animation: flip-down-front 0.6s ease-in-out forwards; }
                .animate-flip-down-back { animation: flip-down-back 0.6s ease-in-out forwards; }
            `}</style>

            {/* --- Top Bar: City & Config --- */}
            <div className={`shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-[#333] z-20 bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-sm ${isZenMode ? 'hidden' : ''}`}>
                <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                    <GlobeIcon className="w-4 h-4" />
                    <span className="uppercase tracking-wider truncate max-w-[120px]">{selectedCity.name}</span>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setGlobeTheme(t => t === 'day' ? 'night' : 'day')} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors" title="Toggle Day/Night Map">
                        {globeTheme === 'day' ? <Sun className="w-4 h-4 text-orange-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                    </button>
                    <button onClick={() => setIsZenMode(true)} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors" title="Zen Mode">
                        <Maximize2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* --- Main Content Area (Stacking Context) --- */}
            <div ref={containerRef} className="flex-1 relative flex flex-col min-h-0 overflow-hidden">

                {/* 1. Globe Layer (Background but Interactive) */}
                <div className={`absolute inset-0 z-0 flex items-center justify-center transition-opacity duration-700 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="w-full h-full cursor-move bg-transparent">
                        {/* Only render Globe if dimensions are known to avoid initial weirdness */}
                        {containerWidth > 0 && (
                            <Globe
                                ref={globeRef}
                                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                                backgroundColor="rgba(0,0,0,0)"
                                pointsData={cities}
                                pointAltitude={0.15}
                                pointColor={() => '#f59e0b'}
                                pointRadius={0.6}
                                pointResolution={5}
                                pointsMerge={false}
                                pointLabel="name"
                                onPointClick={(point: any) => handleCitySelect(point as City)}
                                width={containerWidth}
                                height={containerHeight}
                                atmosphereColor={globeTheme === 'day' ? "#3a99ff" : "#1a237e"}
                                atmosphereAltitude={0.15}
                            />
                        )}
                    </div>
                </div>

                {/* 1.5 Zen Mode Flat Map Layer */}
                {isZenMode && (
                    <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-100 dark:bg-[#0f172a] overflow-hidden" style={{ zIndex: 5 }}>
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Standard_World_Time_Zones.png"
                            className="w-full h-full object-contain opacity-30 dark:opacity-40 mix-blend-multiply dark:mix-blend-screen scale-110"
                            alt="World Time Zones"
                        />
                        <div className="absolute top-8 left-8 text-4xl font-bold text-gray-500/50 uppercase tracking-[0.2em]">
                            {selectedCity.name}
                        </div>
                    </div>
                )}

                {/* 2. Clock Layer (Floating Foreground) */}
                {/* Use flex-1 to push it to visually nice position, but keep it constrained */}
                <div className={`z-10 flex flex-col items-center pointer-events-none ${isZenMode ? 'justify-center h-full' : 'pt-4'}`}>
                    {/* The Flip Clock */}
                    <div className={`transition-transform duration-500`}>
                        <ReactFlipClock
                            timeZone={selectedCity.timezone}
                            isZenMode={isZenMode}
                            containerWidth={containerWidth}
                            timeLeft={timeLeft}
                        />
                    </div>
                </div>

                {/* Spacer to push controls to bottom */}
                <div className="flex-1 pointer-events-none" />

            </div>

            {/* --- Bottom: Controls & Timer --- */}
            <div className={`shrink-0 z-30 bg-white/95 dark:bg-[#1e1e1e]/95 border-t border-gray-200 dark:border-[#333] transition-transform duration-300 ${isZenMode ? 'translate-y-full absolute bottom-0 w-full' : ''}`}>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-[#333]">
                    <button
                        onClick={() => setActiveTab('world')}
                        className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider ${activeTab === 'world' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-[#252526]'}`}
                    >
                        World
                    </button>
                    <button
                        onClick={() => setActiveTab('timer')}
                        className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider ${activeTab === 'timer' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-[#252526]'}`}
                    >
                        Timer
                    </button>
                </div>

                <div className="p-4 h-32">
                    {activeTab === 'world' && (
                        <div className="flex flex-col gap-2 h-full justify-center">
                            <p className="text-xs text-gray-400 text-center">Click on the globe to change timezone</p>
                            <div className="text-center">
                                <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-[#333] rounded text-gray-600 dark:text-gray-300">
                                    {selectedCity.name} • {selectedCity.timezone}
                                </span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'timer' && (
                        <div className="flex flex-col gap-3 h-full">
                            <div className="flex items-center justify-between">
                                <span className="font-[Share_Tech_Mono] text-2xl text-emerald-600 dark:text-emerald-400">
                                    {timeLeft !== null ? formatTime(timeLeft) : formatTime(timerDuration)}
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={toggleTimer} className={`p-1.5 rounded ${isTimerRunning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                    <button onClick={resetTimer} className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 items-center">
                                {/* Presets */}
                                {[25, 45].map(m => (
                                    <button key={m} onClick={() => { setTimerDuration(m * 60); setTimeLeft(m * 60); setIsTimerRunning(false); }} className="px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-[#333]">
                                        {m}m
                                    </button>
                                ))}
                                {/* Custom Input */}
                                <div className="flex-1 border-l pl-2 dark:border-gray-700">
                                    <TimerInput onStart={handleCustomTimer} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isZenMode && (
                <button
                    onClick={() => setIsZenMode(false)}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-full text-gray-500/50 hover:text-gray-500 dark:text-gray-400/50 dark:hover:text-gray-400 uppercase tracking-[0.2em] text-xs font-bold flex gap-2 transition-all items-center bg-transparent backdrop-blur-[1px]"
                >
                    <Minimize2 className="w-3 h-3" /> Exit Focus
                </button>
            )}
        </div>
    );
};
