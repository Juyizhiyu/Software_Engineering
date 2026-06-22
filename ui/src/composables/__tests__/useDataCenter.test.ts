import { describe, expect, it, vi } from 'vitest'
import { useDataCenter } from '../useDataCenter'
import { getEntityData, getSchemas, createEntityData } from '@/api/data'

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn<() => void>(),
    error: vi.fn<() => void>(),
  },
}))

vi.mock('@/api/data', () => ({
  getSchemas: vi.fn<typeof getSchemas>(),
  getEntityData: vi.fn<typeof getEntityData>(),
  createEntityData: vi.fn<typeof createEntityData>(),
}))

describe('useDataCenter', () => {
  it('loads entity records from the metadata response shape', async () => {
    vi.mocked(getEntityData).mockResolvedValueOnce({
      success: true,
      data: {
        items: [{ order_id: 'O001' }],
        metadata: {
          source: 'json',
          updatedAt: '2026-06-20T00:00:00.000Z',
          quality: {
            status: 'complete',
            recordCounts: { orders: 1 },
            emptyEntities: [],
          },
        },
      },
    })

    const dataCenter = useDataCenter()

    await dataCenter.fetchEntityData()

    expect(dataCenter.loading.value).toBe(false)
    expect(dataCenter.records.value).toEqual([{ order_id: 'O001' }])
    expect(dataCenter.metadata.value?.source).toBe('json')
    expect(dataCenter.error.value).toBe('')
  })

  it('keeps compatibility with the legacy array response shape', async () => {
    vi.mocked(getEntityData).mockResolvedValueOnce({
      success: true,
      data: [{ order_id: 'O002' }],
    })

    const dataCenter = useDataCenter()

    await dataCenter.fetchEntityData()

    expect(dataCenter.records.value).toEqual([{ order_id: 'O002' }])
    expect(dataCenter.metadata.value).toBeNull()
  })

  it('stores a load error without leaving stale records', async () => {
    vi.mocked(getEntityData).mockRejectedValueOnce(new Error('network down'))

    const dataCenter = useDataCenter()
    dataCenter.records.value = [{ order_id: 'stale' }]

    await dataCenter.fetchEntityData()

    expect(dataCenter.records.value).toEqual([])
    expect(dataCenter.error.value).toBe('network down')
  })
})
