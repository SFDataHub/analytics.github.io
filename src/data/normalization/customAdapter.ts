import type { ManifestSnapshot, NormalizedSnapshot, RawToNormalizedAdapter } from '../types'

export const customAdapter: RawToNormalizedAdapter = {
  id: 'custom-raw',
  label: 'Custom Raw',
  supportsFormat: (format: string) => format === 'custom-raw',
  normalize: (_raw: unknown, _meta: ManifestSnapshot): NormalizedSnapshot => {
    throw new Error(
      'Custom parsing not configured. Implement parsing in src/data/normalization/customAdapter.ts',
    )
  },
}
