import { useEffect, useState } from 'react';
import { DocState, GroupState } from '../types';

export function useOutline(
    documents: Record<string, DocState>,
    groups: GroupState[],
    activeGroupId: string
) {
    const [outline, setOutline] = useState<{ level: number; text: string; line: number }[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const group = groups.find(g => g.id === activeGroupId);
            if (!group || !group.activePath || !documents[group.activePath]) {
                setOutline([]);
                return;
            }

            const doc = documents[group.activePath];
            const lines = doc.content.split('\n');
            const newOutline: { level: number; text: string; line: number }[] = [];
            for (let i = 0; i < lines.length; i++) {
                const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
                if (match) {
                    newOutline.push({
                        level: match[1].length,
                        text: match[2],
                        line: i
                    });
                }
            }
            setOutline(prev => {
                if (prev.length === newOutline.length && prev.every((item, i) =>
                    item.level === newOutline[i].level &&
                    item.text === newOutline[i].text &&
                    item.line === newOutline[i].line
                )) {
                    return prev;
                }
                return newOutline;
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [documents, activeGroupId, groups]);

    return outline;
}
