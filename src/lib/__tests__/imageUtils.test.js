import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock browser-image-compression
const mockImageCompression = vi.fn()
vi.mock('browser-image-compression', () => ({
  default: (...args) => mockImageCompression(...args),
}))

// Mock Supabase
const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()
const mockRemove = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      }),
    },
  },
}))

import { compressImage, uploadEventImage, deleteEventImage } from '../imageUtils'

describe('imageUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('compressImage', () => {
    it('calls imageCompression with correct options', async () => {
      const fakeFile = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' })
      const compressedFile = new File(['small'], 'photo.jpg', { type: 'image/jpeg' })
      mockImageCompression.mockResolvedValue(compressedFile)

      const result = await compressImage(fakeFile)

      expect(mockImageCompression).toHaveBeenCalledWith(fakeFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })
      expect(result).toBe(compressedFile)
    })
  })

  describe('uploadEventImage', () => {
    it('compresses, uploads to correct path, returns public URL', async () => {
      const fakeFile = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' })
      const compressedFile = new File(['small'], 'photo.jpg', { type: 'image/jpeg' })
      Object.defineProperty(compressedFile, 'name', { value: 'photo.jpg' })

      mockImageCompression.mockResolvedValue(compressedFile)
      mockUpload.mockResolvedValue({ error: null })
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/event-images/events/evt-1/123.jpg' },
      })

      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const result = await uploadEventImage(fakeFile, 'evt-1')

      expect(mockImageCompression).toHaveBeenCalled()
      expect(mockUpload).toHaveBeenCalledWith(
        `events/evt-1/${now}.jpg`,
        compressedFile,
        { cacheControl: '3600', upsert: false }
      )
      expect(result).toBe('https://example.com/event-images/events/evt-1/123.jpg')

      vi.restoreAllMocks()
    })

    it('throws on upload error', async () => {
      const fakeFile = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' })
      const compressedFile = new File(['small'], 'photo.jpg', { type: 'image/jpeg' })

      mockImageCompression.mockResolvedValue(compressedFile)
      mockUpload.mockResolvedValue({ error: { message: 'Upload failed' } })

      await expect(uploadEventImage(fakeFile, 'evt-1')).rejects.toEqual({ message: 'Upload failed' })
    })
  })

  describe('deleteEventImage', () => {
    it('extracts path and calls remove', async () => {
      mockRemove.mockResolvedValue({ error: null })

      await deleteEventImage(
        'https://example.supabase.co/storage/v1/object/public/event-images/events/evt-1/123.jpg'
      )

      expect(mockRemove).toHaveBeenCalledWith(['events/evt-1/123.jpg'])
    })

    it('handles null gracefully', async () => {
      await deleteEventImage(null)
      expect(mockRemove).not.toHaveBeenCalled()
    })

    it('handles undefined gracefully', async () => {
      await deleteEventImage(undefined)
      expect(mockRemove).not.toHaveBeenCalled()
    })
  })
})
