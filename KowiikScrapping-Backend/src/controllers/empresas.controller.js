import { buscarEmpresasOSM } from '../services/overpass.service.js';
import { scrapearWeb } from '../services/scraping.service.js';
import { buscarEnRegistro } from '../services/registro.service.js';
import { buscarWeb } from '../services/buscarWeb.service.js';
import {
  obtenerFichaGuardada, obtenerGuardadas, guardarFicha, cambiarEstado, ESTADOS,
  obtenerTodas, obtenerPorId, editarEmpresa,
} from '../repositories/empresas.repository.js';

const CARGOS_DECISOR = /adm\.|administrador|consejero delegado|director|gerente|ceo|presidente/i;

export async function buscarEmpresas(req, res) {
  const { lat, lng, radio } = req.body ?? {};

  if ([lat, lng, radio].some(v => typeof v !== 'number')) {
    return res.status(400).json({ error: 'lat, lng y radio tienen que ser números' });
  }

  if (radio > 10000 || radio < 500) {
    return res.status(400).json({ error: 'El radio debe estar entre 500 metros y 10 km' });
  }

  const empresas = await buscarEmpresasOSM(lat, lng, radio);

  // Las empresas que ya están en la base de datos salen con lo guardado:
  // todos los datos si ya se analizaron, o solo su estado si únicamente se marcaron
  const guardadas = await obtenerGuardadas(empresas.map(e => e.id)).catch(err => {
    console.warn(`[buscar] no se ha podido leer la base de datos: ${err.message}`);
    return new Map();
  });

  res.json(empresas.map(e => {
    const guardada = guardadas.get(e.id);
    if (!guardada) return e;
    return guardada.analizada
      ? { ...guardada.empresa, distancia: e.distancia }
      : { ...e, estado: guardada.empresa.estado };
  }));
}

export async function obtenerFicha(req, res) {
  /** @type {import('../types.js').Empresa} */
  const empresa = req.body;
  if (!empresa?.id) return res.status(400).json({ error: 'Falta la empresa' });

  // 0. Si ya la analizamos hace poco, la devolvemos de la base de datos sin repetir el scraping
  const guardada = await obtenerFichaGuardada(empresa.id).catch(err => {
    console.warn(`[ficha] no se ha podido leer la base de datos: ${err.message}`);
    return null;
  });
  if (guardada) {
    console.log(`[ficha] ${empresa.nombre}: desde la base de datos`);
    return res.json({ ...guardada, distancia: empresa.distancia });
  }

  console.log(`[ficha] ${empresa.nombre}: analizando (web OSM: ${empresa.web ?? 'no'})`);

  // 1. Si OSM no tiene la web, intentamos encontrarla
  if (!empresa.web) {
    empresa.web = await buscarWeb(empresa).catch(err => {
      console.warn(`[ficha] buscarWeb falló: ${err.message}`);
      return null;
    });
  }

  // 2. Scraping de la web, si la hay
  const datos = empresa.web
    ? await scrapearWeb(empresa.web).catch(err => {
        console.warn(`[ficha] scraping falló: ${err.message}`);
        return null;
      })
    : null;

  // 3. Registro mercantil: por el CIF de la web o, si no, por el nombre
  const registro = await buscarEnRegistro({
    cif: datos?.cifs?.[0] ?? null,
    razonSocial: datos?.razonesSociales?.[0] ?? null,
    nombre: empresa.nombre,
    localidad: empresa.localidad,
  }).catch(err => {
    console.warn(`[ficha] registro falló: ${err.message}`);
    return null;
  });

  const cargos = registro?.cargos ?? [];
  const cargo = cargos.find(c => CARGOS_DECISOR.test(c.cargo ?? '')) ?? cargos[0];

  const completa = {
    ...empresa,
    web: datos?.web ?? empresa.web ?? null,
    cif: registro?.cif ?? datos?.cifs?.[0] ?? empresa.cif ?? null,
    // Razón social: la del registro si la hay; si no, la del aviso legal de su web
    razonSocial: registro?.razonSocial ?? datos?.razonesSociales?.[0] ?? null,
    // Lo que pone la propia web de la empresa es más fiable que OSM
    email: datos?.email?.[0] ?? empresa.email ?? datos?.emailsExternos?.[0] ?? null,
    telefono: datos?.telefono?.[0] ?? empresa.telefono ?? null,
    tamanyo: registro?.trabajadores ?? empresa.tamanyo ?? null,
    estado: empresa.estado ?? 'pendiente',
    decisor: cargo
      ? { nombre: cargo.nombre, cargo: cargo.cargo, email: null, telefono: null }
      : empresa.decisor ?? null,
  };

  // 4. La guardamos para la próxima vez
  await guardarFicha(completa).catch(err => {
    console.warn(`[ficha] no se ha podido guardar en la base de datos: ${err.message}`);
  });

  res.json(completa);
}

export async function cambiarEstadoEmpresa(req, res) {
  const { empresa, estado } = req.body ?? {};

  if (!empresa?.id || !empresa?.nombre || typeof empresa.lat !== 'number' || typeof empresa.lng !== 'number') {
    return res.status(400).json({ error: 'Falta la empresa' });
  }
  if (!ESTADOS.includes(estado)) {
    return res.status(400).json({ error: `El estado tiene que ser uno de: ${ESTADOS.join(', ')}` });
  }

  await cambiarEstado(empresa, estado);
  console.log(`[estado] ${empresa.nombre}: ${estado}`);
  res.json({ id: empresa.id, estado });
}

// ---------------------------------------------------------------------------
// Registro: tabla con todas las empresas guardadas
// ---------------------------------------------------------------------------

export async function listarGuardadas(req, res) {
  res.json(await obtenerTodas());
}

// Campos de texto que se pueden editar y su longitud máxima (la de la columna en la BD)
const TEXTOS = {
  nombre: 255, sector: 100, localidad: 150, provincia: 100, razonSocial: 255,
  telefono: 50, email: 255, web: 500,
};
const TEXTOS_DECISOR = { nombre: 255, cargo: 150, email: 255, telefono: 50 };
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Texto limpio: sin espacios a los lados y, si queda vacío, null (= "No disponible"). */
function texto(valor) {
  if (valor === null || valor === undefined) return null;
  const limpio = String(valor).trim();
  return limpio === '' ? null : limpio;
}

/** Valida y limpia lo que llega del formulario. Devuelve { datos } o { error }. */
function validarEdicion(body) {
  const datos = {};

  for (const [campo, maximo] of Object.entries(TEXTOS)) {
    datos[campo] = texto(body[campo]);
    if (datos[campo] && datos[campo].length > maximo) return { error: `${campo}: máximo ${maximo} caracteres` };
  }
  if (!datos.nombre) return { error: 'El nombre no puede quedar vacío' };
  if (datos.email && !REGEX_EMAIL.test(datos.email)) return { error: 'El email no es válido' };

  // CIF: en mayúsculas y sin espacios, guiones ni puntos
  datos.cif = texto(body.cif)?.toUpperCase().replace(/[\s.-]/g, '') || null;
  if (datos.cif && !/^[A-Z0-9]{9}$/.test(datos.cif)) return { error: 'El CIF tiene que tener 9 letras o números' };

  if (body.tamanyo === null || body.tamanyo === undefined || body.tamanyo === '') {
    datos.tamanyo = null;
  } else {
    datos.tamanyo = Number(body.tamanyo);
    if (!Number.isInteger(datos.tamanyo) || datos.tamanyo < 0) return { error: 'El tamaño tiene que ser un número entero de empleados' };
  }

  datos.estado = body.estado ?? 'pendiente';
  if (!ESTADOS.includes(datos.estado)) return { error: `El estado tiene que ser uno de: ${ESTADOS.join(', ')}` };

  const decisor = {};
  for (const [campo, maximo] of Object.entries(TEXTOS_DECISOR)) {
    decisor[campo] = texto(body.decisor?.[campo]);
    if (decisor[campo] && decisor[campo].length > maximo) return { error: `decisor.${campo}: máximo ${maximo} caracteres` };
  }
  if (decisor.email && !REGEX_EMAIL.test(decisor.email)) return { error: 'El email del decisor no es válido' };
  datos.decisor = Object.values(decisor).some(Boolean) ? decisor : null;

  return { datos };
}

export async function editarGuardada(req, res) {
  const body = req.body ?? {};
  if (!body.id) return res.status(400).json({ error: 'Falta el id de la empresa' });

  const { datos, error } = validarEdicion(body);
  if (error) return res.status(400).json({ error });

  const existe = await editarEmpresa(body.id, datos);
  if (!existe) return res.status(404).json({ error: 'Esa empresa no está en la base de datos' });

  console.log(`[registro] ${datos.nombre}: editada a mano`);
  res.json(await obtenerPorId(body.id));
}
