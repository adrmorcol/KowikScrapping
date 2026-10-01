import { config } from '../config.js';
import { distanciaMetros } from '../utils/distancia.js';
import { devolverSector } from '../utils/sectores.js';

/** @returns {Promise<import('../types.js').Empresa[]>} */
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

  let ultimoError;

  for (const url of config.overpassUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': config.userAgent
        },
        body: 'data=' + encodeURIComponent(query)
      });

      if (!res.ok) {
        ultimoError = new Error(`${url} respondió ${res.status}`);
        console.warn(ultimoError.message);
        continue;
      }

      const json = await res.json();

        return json.elements
          .map(el => {
            const latEmpresa = el.lat ?? el.center.lat;
            const lngEmpresa = el.lon ?? el.center.lon;

            return {
              id: `${el.type}/${el.id}`,
              nombre: el.tags.name,
              lat: latEmpresa,
              lng: lngEmpresa,
              distancia: Math.round(distanciaMetros(lat, lng, latEmpresa, lngEmpresa)),
              localidad: el.tags['addr:city'] ?? null,
              provincia: el.tags['addr:province'] ?? null,
              sector: devolverSector(el.tags.office || el.tags.shop || el.tags.craft || el.tags.industrial || el.tags.amenity),
              telefono: el.tags.phone || el.tags['contact:phone'] || null,
              web: el.tags.website || el.tags['contact:website'] || null,
              email: el.tags.email || el.tags['contact:email'] || null,
              cif: null,
              razonSocial: null,
              tamanyo: null,
              estado: 'pendiente',
              decisor: null
            };
          })
          .sort((a, b) => a.distancia - b.distancia);

    } catch (err) {
      ultimoError = err;
      console.warn(`${url} falló:`, err.cause?.code ?? err.message);
    }
  }

  throw new Error('Ningún servidor de Overpass ha respondido', { cause: ultimoError });
}