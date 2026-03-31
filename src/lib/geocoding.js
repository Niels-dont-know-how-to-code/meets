export async function searchAddress(query) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'User-Agent': 'Meets-App/1.0 (student project)',
        },
      }
    )
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
