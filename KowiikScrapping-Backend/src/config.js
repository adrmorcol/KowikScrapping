export const config = {
  puerto: process.env.PORT || 3000,
  overpassUrls: process.env.OVERPASS_URLS.split(','),
  userAgent: process.env.USER_AGENT || 'KowiikScrapping/1.0',
  nominatimUrl: process.env.NOMINATIM_URL,
};