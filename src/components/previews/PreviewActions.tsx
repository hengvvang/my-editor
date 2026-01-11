import React, { useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { Copy, Download, Check, ZoomIn, ZoomOut, RefreshCw, Link, Link2Off, FileDown } from 'lucide-react';

interface PreviewActionsProps {
    targetRef: React.RefObject<HTMLDivElement>;
    fileName?: string;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetZoom?: () => void;
    scale?: number;
    isSyncScroll?: boolean;
    onToggleSyncScroll?: () => void;
    onExportPdf?: () => void;
}

export const PreviewActions: React.FC<PreviewActionsProps> = ({
    targetRef,
    fileName,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    scale = 1,
    isSyncScroll,
    onToggleSyncScroll,
    onExportPdf
}) => {
    const [copied, setCopied] = useState(false);

    const handleCapture = useCallback(async (action: 'copy' | 'download') => {
        if (!targetRef.current) return;

        try {
            const node = targetRef.current;

            // Configuration to capture full scrollable content
            const options = {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                width: node.scrollWidth,
                height: node.scrollHeight,
                style: {
                    overflow: 'visible',
                    height: 'auto',
                    maxHeight: 'none',
                    transform: 'none' // Reset any transforms that might clip
                }
            };

            const dataUrl = await toPng(node, options);

            if (action === 'copy') {
                const blob = await (await fetch(dataUrl)).blob();
                await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else {
                const suggestedName = `preview-${fileName ? fileName.replace(/\.[^/.]+$/, "") : 'export'}-${Date.now()}.png`;
                const filePath = await save({
                    filters: [{
                        name: 'PNG Image',
                        extensions: ['png'],
                    }],
                    defaultPath: suggestedName
                });

                if (filePath) {
                    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
                    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                    await writeFile(filePath, binaryData);
                }
            }
        } catch (err) {
            console.error(`Failed to ${action} preview:`, err);
            alert(`Failed to ${action} image. The content might be too large or contain unsupported elements.`);
        }
    }, [targetRef, fileName]);

    return (
        <div className="preview-actions absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 backdrop-blur-sm p-1 rounded-md shadow-sm border border-slate-200">
            <button
                onClick={() => handleCapture('copy')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                title={copied ? "Copied!" : "Copy as Image"}
            >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
            <button
                onClick={() => handleCapture('download')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                title="Save as PNG"
            >
                <Download size={14} />
            </button>

            {onExportPdf && (
                <button
                    onClick={onExportPdf}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                    title="Export to PDF"
                >
                    <FileDown size={14} />
                </button>
            )}

            {onToggleSyncScroll && (
                <button
                    onClick={onToggleSyncScroll}
                    className={`p-1.5 hover:bg-slate-100 rounded transition-colors ${isSyncScroll ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' : 'text-slate-400'}`}
                    title={isSyncScroll ? "Sync Scroll On" : "Sync Scroll Off"}
                >
                    {isSyncScroll ? <Link size={14} /> : <Link2Off size={14} />}
                </button>
            )}

            {(onZoomIn || onZoomOut) && (
                <>
                    <div className="w-[1px] h-4 bg-slate-200 my-auto mx-0.5" />

                    <button
                        onClick={onZoomOut}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut size={14} />
                    </button>

                    <span className="text-[10px] text-slate-400 font-mono flex items-center min-w-[32px] justify-center select-none">
                        {Math.round(scale * 100)}%
                    </span>

                    <button
                        onClick={onZoomIn}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn size={14} />
                    </button>

                    <button
                        onClick={onResetZoom}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                        title="Reset Zoom"
                    >
                        <RefreshCw size={12} />
                    </button>
                </>
            )}
        </div>
    );
};
