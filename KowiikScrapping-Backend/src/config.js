export const config = {
  puerto: process.env.PORT || 3000,
  overpassUrl: process.env.OVERPASS_URL || 'https://overpass.kumi.systems/api/interpreter',
  userAgent: process.env.USER_AGENT || 'KowiikScrapping/1.0'
};