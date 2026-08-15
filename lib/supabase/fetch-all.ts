const PAGE_SIZE = 1000

export async function fetchAllRows(
  supabase: any,
  build: (q: any) => any,
  pageSize = PAGE_SIZE
): Promise<any[]> {
  const all: any[] = []
  let from = 0
  while (true) {
    const { data, error } = await build(supabase).range(from, from + pageSize - 1)
    if (error) throw error
    const rows = data || []
    all.push(...rows)
    if (rows.length < pageSize) break
    from += pageSize
  }
  return all
}
