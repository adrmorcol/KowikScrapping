export const config = {
  puerto: process.env.PORT || 3000,
  overpassUrls: process.env.OVERPASS_URLS.split(','),
  userAgent: process.env.USER_AGENT || 'KowiikScrapping/1.0',
  nominatimUrl: process.env.NOMINATIM_URL,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'kowiik',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'kowiik',
  },
  // Días que una ficha guardada se considera válida antes de volver a hacer scraping
  diasValidezFicha: Number(process.env.DIAS_VALIDEZ_FICHA || 30),
};
