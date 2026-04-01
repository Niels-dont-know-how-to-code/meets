import imageCompression from 'browser-image-compression'
import { supabase } from './supabase'

const MAX_SIZE_MB = 1
const MAX_WIDTH = 1200

export async function compressImage(file) {
  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH,
    useWebWorker: true,
  }
  return imageCompression(file, options)
}

export async function uploadEventImage(file, eventId) {
  const compressed = await compressImage(file)
  const ext = compressed.name?.split('.').pop() || 'jpg'
  const path = `events/${eventId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('event-images')
    .upload(path, compressed, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('event-images')
    .getPublicUrl(path)

  return data.publicUrl
}

export async function deleteEventImage(imageUrl) {
  if (!imageUrl) return
  // Extract path from URL: everything after /object/public/event-images/
  const match = imageUrl.match(/event-images\/(.+)$/)
  if (!match) return

  const { error } = await supabase.storage
    .from('event-images')
    .remove([match[1]])

  if (error) console.error('Failed to delete image:', error)
}
