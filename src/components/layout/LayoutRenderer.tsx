import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { LayoutNode, GroupState } from "../../types";

// Consistent resize handle for splits
const SplitResizeHandle: React.FC<{ direction: 'horizontal' | 'vertical' }> = ({ direction }) => (
    <PanelResizeHandle
        className={`group relative ${direction === 'horizontal' ? 'w-1' : 'h-1'} transition-all duration-150`}
    >
        <div className={`absolute ${direction === 'horizontal' ? 'inset-y-0 -left-1 -right-1' : 'inset-x-0 -top-1 -bottom-1'} group-hover:bg-blue-400/20 group-active:bg-blue-500/30 transition-colors`} />
        <div className={`absolute ${direction === 'horizontal' ? 'inset-y-0 left-0 right-0' : 'inset-x-0 top-0 bottom-0'} bg-slate-200 group-hover:bg-blue-400 group-active:bg-blue-600 transition-colors`} />
    </PanelResizeHandle>
);

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
        // Split Container using react-resizable-panels
        return (
            <PanelGroup
                direction={node.direction}
                onLayout={(sizes) => resizeSplit(node.id, sizes)}
                className="h-full w-full"
            >
                {node.children.map((child, i) => {
                    const size = node.sizes[i];
                    const totalSize = node.sizes.reduce((a, b) => a + b, 0);
                    const percentage = totalSize > 0 ? (size / totalSize) * 100 : 100 / node.children.length;

                    return (
                        <React.Fragment key={child.id}>
                            {i > 0 && <SplitResizeHandle direction={node.direction} />}
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
        );
    }
};
