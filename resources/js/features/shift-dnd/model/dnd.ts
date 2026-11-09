import { useEventListener } from '@vueuse/core';
import { shallowRef } from 'vue';
import type { CellKey } from '@/entities/shift';

const MIME = 'application/x-shift-schedule';

export type DragPayload =
    | { kind: 'template'; templateId: number }
    | { kind: 'shift'; from: CellKey };

export function startDrag(event: DragEvent, payload: DragPayload) {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData(MIME, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'copyMove';
}

// copy — Alt или Ctrl при отпускании: смена копируется, а не переносится
export function useDropTarget(
    onDrop: (payload: DragPayload, target: CellKey, copy: boolean) => void,
) {
    const overKey = shallowRef<CellKey | null>(null);

    function dragOver(event: DragEvent, key: CellKey) {
        // во время dragover dataTransfer в protected mode: getData() пуст, видны только types
        if (!event.dataTransfer?.types.includes(MIME)) return;
        // без preventDefault в dragover браузер не пришлёт drop
        event.preventDefault();
        event.dataTransfer.dropEffect =
            event.altKey || event.ctrlKey ? 'copy' : 'move';
        overKey.value = key;
    }

    function dragLeave(event: DragEvent) {
        const target = event.currentTarget as HTMLElement | null;
        // dragleave прилетает и при переходе на дочерний элемент той же ячейки
        if (target?.contains(event.relatedTarget as Node | null)) return;
        overKey.value = null;
    }

    function drop(event: DragEvent, key: CellKey) {
        const raw = event.dataTransfer?.getData(MIME);
        if (!raw) return;
        event.preventDefault();
        overKey.value = null;
        try {
            onDrop(
                JSON.parse(raw) as DragPayload,
                key,
                event.altKey || event.ctrlKey,
            );
        } catch {
            // чужие данные с тем же MIME — игнорируем
        }
    }

    useEventListener('dragend', () => {
        overKey.value = null;
    });

    return { overKey, dragOver, dragLeave, drop };
}
