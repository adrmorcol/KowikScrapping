import { buscarEmpresasOSM } from '../services/overpass.service.js';
import { scrapearWeb } from '../services/scraping.service.js';

export async function buscarEmpresas(req, res) {
    const { lat, lng, radio } = req.body ?? {};

    if ([lat, lng, radio].some(v => typeof v !== 'number')) {
        return res.status(400).json({ error: 'lat, lng y radio tienen que ser números'});
    }

    if (radio > 10000 || radio < 500) {
        return res.status(400).json({ error: 'El radio debe estar entre 500 metros y 10 km' });
    }

    const empresas = await buscarEmpresasOSM(lat, lng, radio);
    res.json(empresas);
}

export async function obtenerFicha(req, res) {
  const empresa = req.body;
  if (!empresa?.id) return res.status(400).json({ error: 'Falta la empresa' });
  if (!empresa.web) return res.json(empresa);

  const datos = await scrapearWeb(empresa.web);
  const cif = datos.cifs[0] ?? null;
  const registro = cif ? await buscarEnRegistro(cif).catch(() => null) : null;

  const cargo = registro?.cargos.find(c => CARGOS_DECISOR.test(c.role)) ?? registro?.cargos[0];

  res.json({
    ...empresa,
    cif: registro?.cif ?? cif,
    email: empresa.email ?? datos.email[0] ?? null,
    telefono: empresa.telefono ?? datos.telefono[0] ?? null,
    tamanyo: Number(registro?.trabajadores) || null,
    decisor: cargo
      ? { nombre: cargo.name, cargo: cargo.role, email: null, telefono: null }
      : null,
  });
}