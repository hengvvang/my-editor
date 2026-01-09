import React from "react";
import { LayoutNode, GroupState } from "../../types";

interface LayoutRendererProps {
    node: LayoutNode;
    index: number;
    path: number[];
    resizeSplit: (id: string, newSizes: number[]) => void;
    renderGroup: (group: GroupState, index: number) => React.ReactNode;
}

export const LayoutRenderer: React.FC<LayoutRendererProps> = ({ node, index, path, resizeSplit, renderGroup }) => {
    if (node.type === 'group') {
        return <>{renderGroup(node, index)}</>;
    } else {
        // Split Container
        return (
            <div
                key={node.id}
                className={`flex flex-1 min-w-0 min-h-0 h-full w-full ${node.direction === 'horizontal' ? 'flex-row' : 'flex-col'}`}
            >
                {node.children.map((child, i) => {
                    const size = node.sizes[i]; // Flex grow value
                    return (
                        <React.Fragment key={child.type === 'group' ? child.id : child.id}>
                            {i > 0 && (
                                <div
                                    className={`${node.direction === 'horizontal' ? 'w-1 cursor-col-resize h-full -ml-[0.5px] -mr-[0.5px]' : 'h-1 cursor-row-resize w-full -mt-[0.5px] -mb-[0.5px]'} z-50 shrink-0 flex justify-center items-center group/resizer bg-transparent hover:bg-blue-400 transition-colors`}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        // Split Resizing Logic
                                        const startX = e.clientX;
                                        const startY = e.clientY;
                                        const startSizes = [...node.sizes];
                                        const parentEl = (e.currentTarget as HTMLElement).parentElement;
                                        if (!parentEl) return;

                                        // The parent flex container size
                                        const rect = parentEl.getBoundingClientRect();
                                        const totalSizePx = node.direction === 'horizontal' ? rect.width : rect.height;
                                        const totalFlex = startSizes.reduce((a, b) => a + b, 0);

                                        const handleMove = (ev: MouseEvent) => {
                                            const currentX = ev.clientX;
                                            const currentY = ev.clientY;
                                            const deltaPx = node.direction === 'horizontal' ? currentX - startX : currentY - startY;

                                            // Convert pixel delta to flex delta
                                            if (totalSizePx === 0) return;
                                            const deltaFlex = deltaPx * (totalFlex / totalSizePx);

                                            const newSizes = [...startSizes];

                                            // We are resizing the specific gap between children[i-1] and children[i]
                                            const prevIndex = i - 1;
                                            const nextIndex = i;

                                            // Check constraints (e.g., minimum size)
                                            const minSizePx = 50;
                                            const minFlex = minSizePx * (totalFlex / totalSizePx);

                                            let verifiedDelta = deltaFlex;

                                            // Limit shrinking of left/top item
                                            if (newSizes[prevIndex] + verifiedDelta < minFlex) {
                                                verifiedDelta = minFlex - newSizes[prevIndex];
                                            }
                                            // Limit shrinking of right/bottom item
                                            if (newSizes[nextIndex] - verifiedDelta < minFlex) {
                                                verifiedDelta = newSizes[nextIndex] - minFlex;
                                            }

                                            newSizes[prevIndex] += verifiedDelta;
                                            newSizes[nextIndex] -= verifiedDelta;

                                            resizeSplit(node.id, newSizes);
                                        };

                                        const handleUp = () => {
                                            window.removeEventListener('mousemove', handleMove);
                                            window.removeEventListener('mouseup', handleUp);
                                            document.body.style.cursor = '';
                                            document.body.style.userSelect = '';
                                        };

                                        window.addEventListener('mousemove', handleMove);
                                        window.addEventListener('mouseup', handleUp);
                                        document.body.style.cursor = node.direction === 'horizontal' ? 'col-resize' : 'row-resize';
                                        document.body.style.userSelect = 'none';
                                    }}
                                >
                                    <div className={`${node.direction === 'horizontal' ? 'w-[1px] h-full' : 'h-[1px] w-full'} bg-slate-200 group-hover/resizer:bg-blue-600`} />
                                </div>
                            )}
                            <div style={{ flex: `${size} 1 0px`, overflow: 'hidden' }}>
                                <LayoutRenderer
                                    node={child}
                                    index={index + i}
                                    path={[...path, i]}
                                    resizeSplit={resizeSplit}
                                    renderGroup={renderGroup}
                                />
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }
};
