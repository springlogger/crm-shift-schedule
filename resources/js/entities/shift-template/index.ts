export { default as TemplateCard } from './ui/TemplateCard.vue';
export type { ShiftTemplate } from './model/types';
export {
    fetchShiftTemplates,
    shiftTemplateKeys,
    useShiftTemplatesQuery,
} from './api/shift-templates';
