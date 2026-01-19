import React, { useMemo } from 'react';

export const ContributionGraph: React.FC = React.memo(() => {
    // Memoize the entire calculation logic to prevent re-execution on every render
    const graphData = useMemo(() => {
        // Simulation Parameters
        const emptyCol = "0000000";
        // Dynamic End Date: Always use the end of the current year so it stays relevant
        const currentYear = new Date().getFullYear();
        const endDate = new Date(currentYear, 11, 31);

        const letters = {
            T: ["1000000", "1000000", "1111111", "1000000", "1000000"],
            Y: ["1100000", "0010000", "0001111", "0010000", "1100000"],
            P: ["1111111", "1001000", "1001000", "1001000", "0110000"],
            O: ["0111110", "1000001", "1000001", "1000001", "0111110"],
            L: ["1111111", "0000001", "0000001", "0000001", "0000001"],
        };

        // Balanced padding for ~52 columns total (8 + 35 + 9)
        const noiseStart = [
            "0000000", "0000000", "0010000", "0000100", "0000000",
            "0000000", "0001000", "0000000"
        ];
        const noiseEnd = [
            "0000000", "0000000", "0010000", "0000000",
            "0000000", "0001000", "0000000", "0001000", "0000000"
        ];

        const logoCols = [
            ...noiseStart,
            ...letters.T, emptyCol,
            ...letters.Y, emptyCol,
            ...letters.P, emptyCol,
            ...letters.O, emptyCol,
            ...letters.L, emptyCol,
            ...letters.Y,
            ...noiseEnd
        ];

        // Date Calculation Helpers
        const totalCols = logoCols.length;
        const getCellDate = (c: number, r: number) => {
            // r=0 is Sunday, r=6 is Saturday
            const daysToSubtract = (totalCols - 1 - c) * 7 + (6 - r);
            const d = new Date(endDate);
            d.setDate(d.getDate() - daysToSubtract);
            return d;
        };

        // Generate Month Labels
        const monthLabels: { x: number, label: string }[] = [];
        let seenMonth = -1;

        for (let i = 0; i < totalCols; i++) {
            const monthCounts = new Map<number, number>();

            for (let r = 0; r < 7; r++) {
                const d = getCellDate(i, r);
                const m = d.getMonth();
                monthCounts.set(m, (monthCounts.get(m) || 0) + 1);
            }

            // Determine dominant month (>= 4 days in this column)
            let dominantMonth = -1;
            for (const [m, count] of monthCounts.entries()) {
                if (count >= 4) {
                    dominantMonth = m;
                    break;
                }
            }

            // If we found a new dominant month, add a label
            if (dominantMonth !== -1 && dominantMonth !== seenMonth) {
                let sampleDateForDominant: Date | null = null;
                // Find a sample date for this month to format the label
                for (let r = 0; r < 7; r++) {
                    const d = getCellDate(i, r);
                    if (d.getMonth() === dominantMonth) {
                        sampleDateForDominant = d;
                        break;
                    }
                }

                if (sampleDateForDominant) {
                    monthLabels.push({
                        x: i,
                        label: sampleDateForDominant.toLocaleDateString('en-US', { month: 'short' })
                    });
                    seenMonth = dominantMonth;
                }
            }
        }

        return { logoCols, monthLabels, getCellDate };
    }, []);

    const { logoCols, monthLabels, getCellDate } = graphData;

    return (
        <div className="flex">
            {/* Day Labels (Left) */}
            <div className="flex flex-col gap-[2px] mr-2 mt-[19px]">
                {["", "Mon", "", "Wed", "", "Fri", ""].map((day, i) => (
                    <div key={i} className="h-[9px] text-[10px] leading-[9px] text-slate-400 text-right w-[24px]">
                        {day}
                    </div>
                ))}
            </div>

            <div className="flex flex-col">
                {/* Month Labels (Top) */}
                <div className="relative h-[15px] w-full mb-1">
                    {monthLabels.map((m, idx) => (
                        <span key={idx} className="absolute text-[10px] text-slate-400 leading-none top-0" style={{ left: `${m.x * 11}px` }}>
                            {m.label}
                        </span>
                    ))}
                </div>

                {/* The Grid */}
                <div className="flex gap-[2px]">
                    {logoCols.map((colPattern, x) => (
                        <div key={x} className="flex flex-col gap-[2px]">
                            {colPattern.split('').map((char, y) => {
                                const isActive = char === '1';
                                let colorClass = "bg-[#ebedf0]"; // Level 0

                                // Deterministic coloring based on coordinate for stability
                                if (isActive) {
                                    const rand = (x * 7 + y * 3) % 10;
                                    if (rand < 2) colorClass = "bg-[#9be9a8]";      // L1
                                    else if (rand < 5) colorClass = "bg-[#40c463]"; // L2
                                    else if (rand < 9) colorClass = "bg-[#30a14e]"; // L3
                                    else colorClass = "bg-[#216e39]";               // L4
                                }

                                // Tooltip Date Logic
                                const cellDate = getCellDate(x, y);
                                const dateStr = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                const count = isActive ? ((x * 3 + y * 7) % 15) + 1 : 0;
                                const tooltip = count > 0
                                    ? `${count} contributions on ${dateStr}`
                                    : `No contributions on ${dateStr}`;

                                return (
                                    <div
                                        key={y}
                                        className={`w-[9px] h-[9px] rounded-[2px] transition-colors ${colorClass} hover:ring-[1px] hover:ring-slate-500 hover:z-20 relative cursor-pointer`}
                                        title={tooltip}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend (Bottom Right) */}
                <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-400 select-none opacity-80">
                    <span className="mr-1">Less</span>
                    <div className="w-[9px] h-[9px] bg-[#ebedf0] rounded-[2px]" />
                    <div className="w-[9px] h-[9px] bg-[#9be9a8] rounded-[2px]" />
                    <div className="w-[9px] h-[9px] bg-[#40c463] rounded-[2px]" />
                    <div className="w-[9px] h-[9px] bg-[#30a14e] rounded-[2px]" />
                    <div className="w-[9px] h-[9px] bg-[#216e39] rounded-[2px]" />
                    <span className="ml-1">More</span>
                </div>
            </div>
        </div>
    );
});
