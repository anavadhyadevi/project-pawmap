// Free reverse geocoding using OpenStreetMap Nominatim
export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    // extract neighbourhood/suburb/road for a clean short name
    const addr = data.address
    if (!addr) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    
    const name = addr.neighbourhood
      || addr.suburb
      || addr.village
      || addr.town
      || addr.road
      || addr.county
      || 'Bengaluru'
    return name
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  }
}
