import { config } from '../config.js';

export async function buscarEmpresasOSM(lat, lng, radio) {
  const zona = `around:${radio},${lat},${lng}`;
  const query = `
    [out:json][timeout:25];
    (
      nwr(${zona})["name"]["office"];
      nwr(${zona})["name"]["shop"];
      nwr(${zona})["name"]["craft"];
      nwr(${zona})["name"]["industrial"];
      nwr(${zona})["name"]["man_made"="works"];
      nwr(${zona})["name"]["building"~"industrial|commercial|warehouse|office"];
      nwr(${zona})["name"]["amenity"~"restaurant|cafe|bar|pharmacy|clinic|dentist|bank|fuel"];
    );
    out center tags;
  `;

  const res = await fetch(config.overpassUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': config.userAgent
    },
    body: 'data=' + encodeURIComponent(query)
  });

  if (!res.ok) throw new Error(`Overpass respondió ${res.status}`);
  const json = await res.json();

  return json.elements.map(el => ({
    id: `${el.type}/${el.id}`,
    nombre: el.tags.name,
    lat: el.lat ?? el.center.lat,
    lng: el.lon ?? el.center.lon,
    sector: el.tags.office || el.tags.shop || el.tags.craft || el.tags.industrial || el.tags.amenity || null,
    telefono: el.tags.phone || el.tags['contact:phone'] || null,
    web: el.tags.website || el.tags['contact:website'] || null,
    email: el.tags.email || el.tags['contact:email'] || null
  }));
}