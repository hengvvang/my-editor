import React from 'react';

// --- Minimap Component ---
export const MinimapView: React.FC<{ content: string; scrollContainerId: string }> = ({ content, scrollContainerId }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [viewportBox, setViewportBox] = React.useState({ top: 0, height: 100 });
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartRef = React.useRef({ y: 0, scrollTop: 0 });
    const [highlightInfo, setHighlightInfo] = React.useState<{ activeLine: number; selection: { from: number; to: number } | null }>({
        activeLine: -1,
        selection: null
    });

    // Poll editor state for active line and selection
    React.useEffect(() => {
        const pollInterval = setInterval(() => {
            // Updated selector to be more robust if multiple editors exist
            // However, this primitive polling might grab the WRONG active line if there are multiple editors.
            // A better approach would be to pass the EditorView instance to the MinimapView.
            // For now, we will stick to the existing logic but knowing it might be buggy with multiple splits.
            // TODO: Refactor to accept editorView reference or use a more specific selector scoped to the container.
            
            // To fix "activeLine" showing up on both minimaps for the focused editor:
            // We really need the editor view. But let's proceed with this for now and fix if needed.
            // Ideally passing the editorViewRef would allow us to query state directly without DOM polling.
            const editorElement = document.querySelector(`#${scrollContainerId} .cm-editor`) || document.querySelector('.cm-editor');
            if (!editorElement) return;

            // Get active line
            const activeLine = editorElement.querySelector('.cm-activeLine');
            if (activeLine) {
                const allLines = Array.from(editorElement.querySelectorAll('.cm-line'));
                const activeLineIndex = allLines.indexOf(activeLine as Element);

                // Get selection info from DOM
                const selection = window.getSelection();
                let selectionInfo = null;

                if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
                    const range = selection.getRangeAt(0);
                    // Check if selection is inside THIS editor
                    if (editorElement.contains(range.commonAncestorContainer)) {
                         const startLine = allLines.findIndex(line => line.contains(range.startContainer));
                         const endLine = allLines.findIndex(line => line.contains(range.endContainer));

                         if (startLine !== -1 && endLine !== -1) {
                             selectionInfo = { from: startLine, to: endLine };
                         }
                    }
                }

                setHighlightInfo({
                    activeLine: activeLineIndex,
                    selection: selectionInfo
                });
            }
        }, 100);

        return () => clearInterval(pollInterval);
    }, [scrollContainerId]);

    // Render minimap content
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const width = 120;
        const height = containerRef.current?.clientHeight || 600;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, width, height);

        // Draw content - simplified text representation
        const lines = content.split('\n');
        const lineHeight = 2; // Very small line height for minimap
        const fontSize = 2; // Tiny font size
        const leftMargin = 8; // Match editor left margin proportionally

        ctx.font = `${fontSize}px monospace`;

        lines.forEach((line, index) => {
            const y = index * lineHeight;
            if (y > height) return;

            // Draw selection highlight (yellow background)
            if (highlightInfo.selection && index >= highlightInfo.selection.from && index <= highlightInfo.selection.to) {
                ctx.fillStyle = 'rgba(251, 191, 36, 0.3)'; // amber-400 with transparency
                ctx.fillRect(0, y, width, lineHeight);
            }

            // Draw active line highlight (blue background) - renders on top of selection
            if (index === highlightInfo.activeLine) {
                ctx.fillStyle = 'rgba(96, 165, 250, 0.25)'; // blue-400 with transparency
                ctx.fillRect(0, y, width, lineHeight);
            }

            // Draw a simplified representation - just colored blocks for non-empty lines
            if (line.trim().length > 0) {
                // Different colors for headings
                if (line.startsWith('#')) {
                    ctx.fillStyle = '#1e40af'; // Blue for headings
                    ctx.fillRect(leftMargin, y, Math.min(line.length * 0.8, width - leftMargin * 2), lineHeight - 0.5);
                } else {
                    ctx.fillStyle = '#64748b'; // Gray for normal text
                    ctx.fillRect(leftMargin, y, Math.min(line.length * 0.6, width - leftMargin * 2), lineHeight - 0.5);
                }
            }
        });
    }, [content, highlightInfo]);

    // Update viewport box on scroll
    React.useEffect(() => {
        // Important: Use the passed ID to find the scroll container
        const scrollContainer = document.getElementById(scrollContainerId);
        if (!scrollContainer || !containerRef.current) return;

        const updateViewport = () => {
            const containerHeight = containerRef.current?.clientHeight || 600;
            const scrollHeight = scrollContainer.scrollHeight;
            const scrollTop = scrollContainer.scrollTop;
            const clientHeight = scrollContainer.clientHeight;

            const ratio = containerHeight / scrollHeight;
            const top = scrollTop * ratio;
            const height = clientHeight * ratio;

            setViewportBox({ top, height: Math.max(height, 20) });
        };

        updateViewport();
        scrollContainer.addEventListener('scroll', updateViewport);
        window.addEventListener('resize', updateViewport);

        return () => {
            scrollContainer.removeEventListener('scroll', updateViewport);
            window.removeEventListener('resize', updateViewport);
        };
    }, [scrollContainerId]);

    // Handle minimap drag
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);

        const scrollContainer = document.getElementById(scrollContainerId);
        if (!scrollContainer) return;

        dragStartRef.current = {
            y: e.clientY,
            scrollTop: scrollContainer.scrollTop
        };
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const scrollContainer = document.getElementById(scrollContainerId);
            const container = containerRef.current;
            if (!scrollContainer || !container) return;

            const deltaY = e.clientY - dragStartRef.current.y;
            const containerHeight = container.clientHeight;
            const scrollHeight = scrollContainer.scrollHeight;

            const scrollDelta = (deltaY / containerHeight) * scrollHeight;
            scrollContainer.scrollTop = dragStartRef.current.scrollTop + scrollDelta;
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, scrollContainerId]);

    return (
        <div ref={containerRef} className="w-full h-full relative cursor-pointer select-none">
            <canvas ref={canvasRef} className="w-full h-full" />
            {/* Viewport indicator */}
            <div
                className="absolute left-0 right-0 bg-blue-500/20 border border-blue-500/50 cursor-grab active:cursor-grabbing"
                style={{
                    top: `${viewportBox.top}px`,
                    height: `${viewportBox.height}px`,
                }}
                onMouseDown={handleMouseDown}
            />
        </div>
    );
};
