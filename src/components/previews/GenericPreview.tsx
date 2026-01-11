import React, { useRef, useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from "@codemirror/view";
import { getLanguageExtension } from '../../utils/languageManager';
import { PreviewActions } from './PreviewActions';

interface Props {
    content: string;
    filePath: string | null;
    onRef?: (el: HTMLDivElement | null) => void;
    isSyncScroll?: boolean;
    onToggleSyncScroll?: () => void;
}

export const GenericPreview: React.FC<Props> = ({ content, filePath, onRef, isSyncScroll, onToggleSyncScroll }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // We need to capture the scroll element of CodeMirror
    const cmScrollRef = useRef<HTMLElement | null>(null);

    const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 3));
    const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.5));
    const handleReset = () => setScale(1);

    // Expose ref - specifically the scrolling element
    useEffect(() => {
        if (onRef && cmScrollRef.current) {
            // CodeMirror's scroll element is typically .cm-scroller
            onRef(cmScrollRef.current as HTMLDivElement);
        }
    }, [onRef, cmScrollRef.current]);

    return (
        <div className="h-full relative group bg-slate-50" ref={containerRef}>
            <PreviewActions
                targetRef={containerRef} // For screenshot
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleReset}
                scale={scale}
                isSyncScroll={isSyncScroll}
                onToggleSyncScroll={onToggleSyncScroll}
            />
            <div style={{ zoom: scale, height: '100%' }}>
                <CodeMirror
                    value={content}
                    height="100%"
                    extensions={[
                        ...getLanguageExtension(filePath),
                        EditorView.editable.of(false),
                        EditorView.lineWrapping
                    ]}
                    theme="light"
                    basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
                        highlightActiveLine: false,
                    }}
                    className="h-full text-sm"
                    readOnly
                    onCreateEditor={(view) => {
                        cmScrollRef.current = view.scrollDOM;
                        if (onRef) onRef(view.scrollDOM as HTMLDivElement);
                    }}
                />
            </div>
        </div>
    );
};
