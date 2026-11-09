import type { Directive } from 'vue';

export const focus: Directive<HTMLElement, boolean | undefined> = {
    mounted: (el, shouldFocus) => {
        if (shouldFocus.value !== false) {
            el.focus();
        }
    },
};
