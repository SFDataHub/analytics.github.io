import type { ManifestSnapshot, NormalizedSnapshot, RawToNormalizedAdapter } from '../types'

export const demoAdapter: RawToNormalizedAdapter = {
  id: 'demo-normalized',
  label: 'Demo Normalized',
  supportsFormat: (format: string) => format === 'normalized-demo' || format === 'normalized',
  normalize: (raw: unknown, meta: ManifestSnapshot): NormalizedSnapshot => {
    const snapshot = raw as NormalizedSnapshot
    if (!snapshot?.scannedAt || !Array.isArray(snapshot.guilds)) {
      throw new Error(`Invalid normalized snapshot for ${meta.id}`)
    }
    return snapshot
  },
}
