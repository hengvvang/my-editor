import React, { useRef } from "react";
import { Panel, PanelGroup, ImperativePanelGroupHandle } from "react-resizable-panels";
import { LayoutNode, GroupState } from "../../types";
import { GhostResizeHandle } from "../GhostResizeHandle";

interface LayoutRendererProps {
    node: LayoutNode;
    index: number;
    path: number[];
    resizeSplit: (id: string, newSizes: number[]) => void;
    renderGroup: (group: GroupState, index: number) => React.ReactNode;
}

export const LayoutRenderer: React.FC<LayoutRendererProps> = ({ node, index, path, resizeSplit, renderGroup }) => {
    const groupRef = useRef<ImperativePanelGroupHandle>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    if (node.type === 'group') {
        return <>{renderGroup(node, index)}</>;
    } else {
        // Split Container using react-resizable-panels
        return (
            <div ref={containerRef} className="h-full w-full relative">
                <PanelGroup
                    ref={groupRef}
                    direction={node.direction}
                    onLayout={(sizes) => resizeSplit(node.id, sizes)}
                    className="h-full w-full"
                >
                    {node.children.map((child, i) => {
                        const size = node.sizes[i];
                        const totalSize = node.sizes.reduce((a, b) => a + b, 0);
                        const percentage = totalSize > 0 ? (size / totalSize) * 100 : 100 / node.children.length;

                        // Calculate bounds for the handle preceding this panel (at index i > 0)
                        // Handle is between child[i-1] and child[i]
                        const preSum = node.sizes.slice(0, i - 1).reduce((s, x) => s + x, 0);
                        const pairSum = (i > 0) ? (node.sizes[i - 1] + node.sizes[i]) : 0;

                        return (
                            <React.Fragment key={child.id}>
                                {i > 0 && (
                                    <GhostResizeHandle
                                        containerRef={containerRef}
                                        orientation={node.direction}
                                        minPercent={preSum + 10}
                                        maxPercent={preSum + pairSum - 10}
                                        onResizeEnd={(val) => {
                                            if (groupRef.current) {
                                                const newSizes = [...node.sizes];
                                                const newLeft = val - preSum;
                                                const newRight = pairSum - newLeft;
                                                newSizes[i - 1] = newLeft;
                                                newSizes[i] = newRight;
                                                groupRef.current.setLayout(newSizes);
                                            }
                                        }}
                                    />
                                )}
                                <Panel
                                    defaultSize={percentage}
                                    minSize={10}
                                    id={`split-${node.id}-${i}`}
                                >
                                    <div className="h-full w-full overflow-hidden">
                                        <LayoutRenderer
                                            node={child}
                                            index={index + i}
                                            path={[...path, i]}
                                            resizeSplit={resizeSplit}
                                            renderGroup={renderGroup}
                                        />
                                    </div>
                                </Panel>
                            </React.Fragment>
                        );
                    })}
                </PanelGroup>
            </div>
        );
    }
};
