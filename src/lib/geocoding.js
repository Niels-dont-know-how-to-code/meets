let lastRequestTime = 0;
const MIN_INTERVAL = 1100; // 1.1 seconds between requests (Nominatim rate limit)

export async function searchAddress(query) {
  if (!query || query.trim().length < 3) return [];
  if (query.length > 256) return [];

  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL - elapsed));
  }
  lastRequestTime = Date.now();

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'User-Agent': 'Meets-App/1.0 (student project)',
        },
        signal: controller.signal,
      }
    )
    clearTimeout(timeout)
    const data = await response.json()
    return data.map((item) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }))
  } catch (error) {
    console.error('Geocoding error:', error)
    return []
  }
}
