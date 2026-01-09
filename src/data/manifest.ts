import type { Manifest } from './types'

export async function loadManifest(baseUrl: string): Promise<Manifest> {
  const url = new URL('scans/manifest.json', baseUrl).toString()
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Manifest load failed (${response.status})`)
  }
  const data = (await response.json()) as Manifest
  return data
}
