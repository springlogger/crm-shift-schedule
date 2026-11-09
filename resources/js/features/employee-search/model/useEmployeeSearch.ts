import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import fuzzysort from 'fuzzysort'
import type { Employee } from '@/entities/employee'

// fuzzysort не знает, что «ё» и «е» — одна буква: «Артем» должен находить «Артём»
const normalize = (value: string) => value.toLowerCase().replace(/ё/g, 'е')

export function useEmployeeSearch(employees: MaybeRefOrGetter<Employee[]>) {
  const query = ref('')

  const filtered = computed(() => {
    const list = toValue(employees)
    const normalizedQuery = normalize(query.value.trim())

    if (!normalizedQuery) {
      return list
    }

    const searchTargets = list.map(employee => ({
      id: employee.id,
      fullName: normalize(`${employee.surname} ${employee.name}`),
    }))

    const results = fuzzysort.go(normalizedQuery, searchTargets, {
      key: 'fullName',
      threshold: -1000,
    })

    // фильтруем исходный список, чтобы сохранить алфавитный порядок строк
    const matchedIds = new Set(results.map(result => result.obj.id))
    return list.filter(employee => matchedIds.has(employee.id))
  })

  return { query, filtered }
}
