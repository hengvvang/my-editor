import { RefObject, useEffect } from "react";
import { GroupState } from "../types";

export function useLayoutResizing(
    resizingGroupIndex: number | null,
    setResizingGroupIndex: (index: number | null) => void,
    groups: GroupState[],
    setGroups: (groups: GroupState[]) => void,
    groupsContainerRef: RefObject<HTMLDivElement>
) {
    useEffect(() => {
        if (resizingGroupIndex === null) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!groupsContainerRef.current) return;

            // We are resizing the split between group[index] and group[index+1]
            // We filter out the splitter divs to get just the group containers
            const children = Array.from(groupsContainerRef.current.children).filter(c => !c.classList.contains("group/resizer")) as HTMLElement[];

            const leftEl = children[resizingGroupIndex];
            const rightEl = children[resizingGroupIndex + 1];

            if (!leftEl || !rightEl) return;

            const leftRect = leftEl.getBoundingClientRect();

            // Calculate new flex ratio
            // We assume the total flex of these two groups is conserved
            const groupLeft = groups[resizingGroupIndex];
            const groupRight = groups[resizingGroupIndex + 1];
            const totalFlex = groupLeft.flex + groupRight.flex;

            // New width for left element
            // e.clientX is current mouse X
            // leftRect.left is the left edge of the left element
            // Width = mouseX - leftEdge
            let newLeftWidth = e.clientX - leftRect.left;

            // Total width of both elements
            const totalWidth = leftEl.offsetWidth + rightEl.offsetWidth;

            // Constrain
            if (newLeftWidth < 50) newLeftWidth = 50;
            if (newLeftWidth > totalWidth - 50) newLeftWidth = totalWidth - 50;

            const newLeftFlex = (newLeftWidth / totalWidth) * totalFlex;
            const newRightFlex = totalFlex - newLeftFlex;

            const newGroups = [...groups];
            newGroups[resizingGroupIndex] = { ...groupLeft, flex: newLeftFlex };
            newGroups[resizingGroupIndex + 1] = { ...groupRight, flex: newRightFlex };

            setGroups(newGroups);
        };

        const handleMouseUp = () => {
            setResizingGroupIndex(null);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizingGroupIndex, groups, setGroups, setResizingGroupIndex, groupsContainerRef]);
}
