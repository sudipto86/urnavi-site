// client/src/data/cityCoordinates.js
// Static lookup for city + country coordinates (no external geocoding)

export const CITY_COORDS = {
  // -------- SWEDEN --------
  "Stockholm, Sweden":   { lat: 59.3293, lng: 18.0686 },
  "Gothenburg, Sweden":  { lat: 57.7089, lng: 11.9746 },
  "Göteborg, Sweden":    { lat: 57.7089, lng: 11.9746 }, // alt spelling
  "Malmö, Sweden":       { lat: 55.60498, lng: 13.00382 },
  "Uppsala, Sweden":     { lat: 59.8586, lng: 17.6389 },
  "Västerås, Sweden":    { lat: 59.6099, lng: 16.5448 },
  "Örebro, Sweden":      { lat: 59.2753, lng: 15.2134 },
  "Linköping, Sweden":   { lat: 58.4108, lng: 15.6214 },
  "Helsingborg, Sweden": { lat: 56.0465, lng: 12.6945 },
  "Lund, Sweden":        { lat: 55.7047, lng: 13.1910 },
  "Umeå, Sweden":        { lat: 63.8258, lng: 20.2630 },
  "Luleå, Sweden":       { lat: 65.5848, lng: 22.1547 },
  "Gävle, Sweden":       { lat: 60.6749, lng: 17.1413 },
  "Jönköping, Sweden":   { lat: 57.7815, lng: 14.1562 },
  "Karlstad, Sweden":    { lat: 59.3793, lng: 13.5036 },
  "Sundsvall, Sweden":   { lat: 62.3908, lng: 17.3069 },
  "Eskilstuna, Sweden":  { lat: 59.3712, lng: 16.5098 },
  "Norrköping, Sweden":  { lat: 58.5877, lng: 16.1924 },
  "Borås, Sweden":       { lat: 57.7210, lng: 12.9401 },

  // -------- NORWAY --------
  "Oslo, Norway":        { lat: 59.9139, lng: 10.7522 },
  "Bergen, Norway":      { lat: 60.3913, lng: 5.3221 },
  "Trondheim, Norway":   { lat: 63.4305, lng: 10.3951 },
  "Stavanger, Norway":   { lat: 58.9690, lng: 5.7331 },
  "Tromsø, Norway":      { lat: 69.6492, lng: 18.9553 },
  "Kristiansand, Norway":{ lat: 58.1467, lng: 7.9956 },
  "Drammen, Norway":     { lat: 59.7439, lng: 10.2045 },
  "Fredrikstad, Norway": { lat: 59.2181, lng: 10.9298 },
  "Bodø, Norway":        { lat: 67.2804, lng: 14.4049 },
  "Ålesund, Norway":     { lat: 62.4722, lng: 6.1549 },
  "Sandnes, Norway":     { lat: 58.8524, lng: 5.7352 },
  "Narvik, Norway":      { lat: 68.4385, lng: 17.4273 }
};

// Country centroids (fallback if we only know the country)
export const COUNTRY_COORDS = {
  Sweden: { lat: 62.0, lng: 15.0 },
  Norway: { lat: 64.5, lng: 11.0 }
};
