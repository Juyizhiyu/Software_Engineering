import { describe, expect, it, vi } from 'vitest'
import { useOperations } from '../useOperations'
import { getOperationsSnapshot } from '@/api/operations'

vi.mock('@/api/operations', () => ({
  getOperationsSnapshot: vi.fn<typeof getOperationsSnapshot>(),
}))

describe('useOperations', () => {
  it('loads the operations snapshot', async () => {
    vi.mocked(getOperationsSnapshot).mockResolvedValueOnce({
      success: true,
      data: {
        inventory: [],
        suppliers: [],
        logistics: [],
        costs: [],
      },
    })

    const operations = useOperations()

    await operations.fetchSnapshot()

    expect(operations.loading.value).toBe(false)
    expect(operations.snapshot.value).toEqual({
      inventory: [],
      suppliers: [],
      logistics: [],
      costs: [],
    })
  })

  it('restores loading state when the API fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(getOperationsSnapshot).mockRejectedValueOnce(new Error('network down'))

    const operations = useOperations()

    await operations.fetchSnapshot()

    expect(operations.loading.value).toBe(false)
    expect(operations.snapshot.value).toBeNull()
    expect(consoleError).toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
