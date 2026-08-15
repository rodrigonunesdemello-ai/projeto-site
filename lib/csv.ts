export type CsvColumn<T> = {
  header: string
  accessor: (row: T) => string | number | null | undefined
}

export function exportToCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  rows: T[],
) {
  const escape = (val: string | number | null | undefined) => {
    const s = String(val ?? '')
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const header = columns.map((c) => escape(c.header)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escape(c.accessor(row))).join(','))
    .join('\n')

  const csv = `${header}\n${body}`
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
