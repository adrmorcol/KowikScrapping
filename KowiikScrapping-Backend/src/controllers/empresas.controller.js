import { buscarEmpresasOSM } from '../services/overpass.service.js';

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