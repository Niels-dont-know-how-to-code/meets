import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('supabase client initialization', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('throws when VITE_SUPABASE_URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')

    await expect(() => import('../../lib/supabase.js')).rejects.toThrow(
      'Missing Supabase environment variables'
    )

    vi.unstubAllEnvs()
  })

  it('throws when VITE_SUPABASE_ANON_KEY is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    await expect(() => import('../../lib/supabase.js')).rejects.toThrow(
      'Missing Supabase environment variables'
    )

    vi.unstubAllEnvs()
  })
})
