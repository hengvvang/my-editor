import React, { useEffect, useRef } from 'react';
// @ts-ignore
import { flipClock, clock, counter } from './dist/FlipClock.js';
import './dist/flipclock.css';

interface FlipClockProps {
    content?: string;
}

export const FlipClockTool: React.FC<FlipClockProps> = ({ content }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<any>(null);

    useEffect(() => {
        if (!parentRef.current) return;

        // Cleanup
        const cleanup = () => {
            if (parentRef.current) parentRef.current.innerHTML = '';
            if (instanceRef.current?.stop) instanceRef.current.stop();
        };
        cleanup();

        let config: any = {};
        try {
            if (content && content.trim()) config = JSON.parse(content);
        } catch (e) {
            console.error("FlipClock: Invalid JSON config", e);
        }

        try {
            let faceInstance;
            switch (config.type) {
                case 'counter':
                    faceInstance = counter({ value: config.value ?? 0 });
                    break;
                case 'clock':
                default:
                    faceInstance = clock();
                    break;
            }

            const options = {
                parent: parentRef.current,
                face: faceInstance,
                autoStart: true,
                ...config
            };

            instanceRef.current = flipClock(options);
        } catch (err) {
            console.error("FlipClock: Init failed", err);
        }

        return cleanup;
    }, [content]);

    return (
        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] overflow-hidden relative select-none">
            <div ref={parentRef} className="flip-clock-wrapper scale-[1.5]" />
        </div>
    );
};

export default FlipClockTool;
