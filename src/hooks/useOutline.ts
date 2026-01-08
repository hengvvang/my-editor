import { useEffect, useState } from 'react';
import { DocState, GroupState } from '../types';

export function useOutline(
    documents: Record<string, DocState>,
    groups: GroupState[],
    activeGroupId: string
) {
    const [outline, setOutline] = useState<{ level: number; text: string; line: number }[]>([]);

    useEffect(() => {
        const group = groups.find(g => g.id === activeGroupId);
        if (!group || !group.activePath || !documents[group.activePath]) {
            setOutline([]);
            return;
        }

        const doc = documents[group.activePath];
        const lines = doc.content.split('\n');
        const newOutline = [];
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
        setOutline(newOutline);
    }, [documents, activeGroupId, groups]);

    return outline;
}
