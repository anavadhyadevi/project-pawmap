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

// Convert a typed address into map coordinates.  The form components call
// this deliberately on blur (rather than each keystroke) to respect
// Nominatim's usage policy and avoid moving the pin while someone is typing.
export async function forwardGeocode(query) {
  const address = query.trim()
  if (!address) return null

  try {
    const params = new URLSearchParams({
      q: address,
      format: 'jsonv2',
      limit: '1',
      'accept-language': 'en',
    })
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
    if (!res.ok) return null
    const matches = await res.json()
    if (!matches.length) return null

    return {
      lat: Number(matches[0].lat),
      lng: Number(matches[0].lon),
      name: matches[0].display_name,
    }
  } catch {
    return null
  }
}
