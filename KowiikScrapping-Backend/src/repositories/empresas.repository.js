import { db } from '../db.js';
import { config } from '../config.js';

// Columnas de la tabla "empresas" (en el mismo orden que los valores de filaDesde)
const COLUMNAS = [
  'id', 'nombre', 'lat', 'lng', 'sector', 'localidad', 'provincia', 'cif', 'razon_social',
  'telefono', 'email', 'web', 'tamanyo',
  'decisor_nombre', 'decisor_cargo', 'decisor_email', 'decisor_telefono',
];

/** Fila de la base de datos → objeto Empresa (el mismo formato que usa el frontend). */
function empresaDesde(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    lat: Number(fila.lat),
    lng: Number(fila.lng),
    sector: fila.sector,
    localidad: fila.localidad,
    provincia: fila.provincia,
    cif: fila.cif,
    razonSocial: fila.razon_social,
    telefono: fila.telefono,
    email: fila.email,
    web: fila.web,
    tamanyo: fila.tamanyo,
    estado: fila.estado ?? 'pendiente',
    decisor: fila.decisor_nombre || fila.decisor_cargo || fila.decisor_email || fila.decisor_telefono
      ? {
          nombre: fila.decisor_nombre,
          cargo: fila.decisor_cargo,
          email: fila.decisor_email,
          telefono: fila.decisor_telefono,
        }
      : null,
  };
}

/** Objeto Empresa → valores para guardar, en el orden de COLUMNAS. */
function filaDesde(e) {
  return [
    e.id, e.nombre, e.lat, e.lng, e.sector ?? null, e.localidad ?? null, e.provincia ?? null,
    e.cif ?? null, e.razonSocial ?? null, e.telefono ?? null, e.email ?? null, e.web ?? null,
    e.tamanyo ?? null,
    e.decisor?.nombre ?? null, e.decisor?.cargo ?? null, e.decisor?.email ?? null, e.decisor?.telefono ?? null,
  ];
}

/**
 * Devuelve la ficha guardada de una empresa si se analizó hace menos de config.diasValidezFicha días
 * o si se ha editado a mano (en ese caso no se vuelve a hacer scraping, para no pisar los cambios).
 * Si no existe o está caducada, devuelve null.
 */
export async function obtenerFichaGuardada(id) {
  const [filas] = await db.query(
    `SELECT * FROM empresas
     WHERE id = ? AND (editada_en IS NOT NULL OR analizada_en >= NOW() - INTERVAL ? DAY)`,
    [id, config.diasValidezFicha]
  );
  return filas[0] ? empresaDesde(filas[0]) : null;
}

/**
 * Devuelve un Map id → { empresa, analizada } con las empresas de la lista que ya están en la base de datos.
 * "analizada" es false si solo se guardó su estado (verificada / no apta) pero aún no se hizo el scraping
 * ni se editó a mano.
 */
export async function obtenerGuardadas(ids) {
  if (!ids.length) return new Map();
  const [filas] = await db.query('SELECT * FROM empresas WHERE id IN (?)', [ids]);
  return new Map(filas.map(f => [f.id, { empresa: empresaDesde(f), analizada: f.analizada_en !== null || f.editada_en !== null }]));
}

/** Guarda (o actualiza, si ya existe) la ficha completa de una empresa y la marca como analizada ahora. */
export async function guardarFicha(empresa) {
  const actualizar = COLUMNAS
    .filter(c => c !== 'id')
    .map(c => `${c} = VALUES(${c})`)
    .join(', ');

  await db.query(
    `INSERT INTO empresas (${COLUMNAS.join(', ')}, analizada_en)
     VALUES (?, NOW())
     ON DUPLICATE KEY UPDATE ${actualizar}, analizada_en = NOW()`,
    [filaDesde(empresa)]
  );
}

export const ESTADOS = ['pendiente', 'verificada', 'no_apta'];

/**
 * Cambia el estado de una empresa (pendiente / verificada / no_apta).
 * Si la empresa aún no está en la base de datos, la guarda con los datos que tenemos de OSM.
 * No toca el resto de columnas ni la fecha de análisis.
 */
export async function cambiarEstado(empresa, estado) {
  await db.query(
    `INSERT INTO empresas (${COLUMNAS.join(', ')}, estado, estado_cambiado_en)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE estado = VALUES(estado), estado_cambiado_en = NOW()`,
    [filaDesde(empresa), estado]
  );
}

// ---------------------------------------------------------------------------
// Registro: todas las empresas guardadas y edición manual
// ---------------------------------------------------------------------------

/** Como empresaDesde, pero con las fechas (para la tabla del registro). */
function registroDesde(fila) {
  return {
    ...empresaDesde(fila),
    analizadaEn: fila.analizada_en,
    editadaEn: fila.editada_en,
    actualizadaEn: fila.actualizada_en,
  };
}

/** Todas las empresas de la base de datos, las últimas tocadas primero. */
export async function obtenerTodas() {
  const [filas] = await db.query('SELECT * FROM empresas ORDER BY actualizada_en DESC');
  return filas.map(registroDesde);
}

/** Una empresa por id (con fechas), o null si no existe. */
export async function obtenerPorId(id) {
  const [filas] = await db.query('SELECT * FROM empresas WHERE id = ?', [id]);
  return filas[0] ? registroDesde(filas[0]) : null;
}

/**
 * Guarda los cambios hechos a mano. "datos" ya viene validado por el controlador.
 * Devuelve false si la empresa no existe.
 */
export async function editarEmpresa(id, datos) {
  const [resultado] = await db.query(
    `UPDATE empresas SET
       -- va antes que "estado": en MySQL cada asignación ve los valores de las anteriores
       estado_cambiado_en = IF(estado <> ?, NOW(), estado_cambiado_en),
       nombre = ?, sector = ?, localidad = ?, provincia = ?, cif = ?, razon_social = ?,
       telefono = ?, email = ?, web = ?, tamanyo = ?,
       decisor_nombre = ?, decisor_cargo = ?, decisor_email = ?, decisor_telefono = ?,
       estado = ?, editada_en = NOW()
     WHERE id = ?`,
    [
      datos.estado,
      datos.nombre, datos.sector, datos.localidad, datos.provincia, datos.cif, datos.razonSocial,
      datos.telefono, datos.email, datos.web, datos.tamanyo,
      datos.decisor?.nombre ?? null, datos.decisor?.cargo ?? null, datos.decisor?.email ?? null, datos.decisor?.telefono ?? null,
      datos.estado,
      id,
    ]
  );
  return resultado.affectedRows > 0;
}

// ---------------------------------------------------------------------------
// Preparar la base de datos al arrancar
// ---------------------------------------------------------------------------

// Definición de cada columna. Si falta alguna (por ejemplo, porque la tabla se creó con una
// versión antigua del proyecto), se añade sola al arrancar el backend.
const DEFINICION_COLUMNAS = {
  nombre: 'VARCHAR(255) NOT NULL',
  lat: 'DECIMAL(9,6) NOT NULL',
  lng: 'DECIMAL(9,6) NOT NULL',
  sector: 'VARCHAR(100) NULL',
  localidad: 'VARCHAR(150) NULL',
  provincia: 'VARCHAR(100) NULL',
  cif: 'VARCHAR(9) NULL',
  razon_social: 'VARCHAR(255) NULL',
  telefono: 'VARCHAR(50) NULL',
  email: 'VARCHAR(255) NULL',
  web: 'VARCHAR(500) NULL',
  tamanyo: 'INT NULL',
  decisor_nombre: 'VARCHAR(255) NULL',
  decisor_cargo: 'VARCHAR(150) NULL',
  decisor_email: 'VARCHAR(255) NULL',
  decisor_telefono: 'VARCHAR(50) NULL',
  estado: "VARCHAR(20) NOT NULL DEFAULT 'pendiente'",
  estado_cambiado_en: 'DATETIME NULL',
  analizada_en: 'DATETIME NULL',
  editada_en: 'DATETIME NULL',
  creada_en: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
  actualizada_en: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
};

/** Crea la tabla si no existe y añade las columnas que le falten. */
export async function prepararBaseDeDatos() {
  const columnas = Object.entries(DEFINICION_COLUMNAS)
    .map(([nombre, tipo]) => `${nombre} ${tipo}`)
    .join(',\n  ');

  await db.query(`
    CREATE TABLE IF NOT EXISTS empresas (
      id VARCHAR(30) PRIMARY KEY,
      ${columnas},
      INDEX idx_cif (cif)
    )
  `);

  const [existentes] = await db.query(
    `SELECT COLUMN_NAME AS nombre FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empresas'`
  );
  const tiene = new Set(existentes.map(c => c.nombre.toLowerCase()));

  for (const [nombre, tipo] of Object.entries(DEFINICION_COLUMNAS)) {
    if (!tiene.has(nombre)) {
      // Las columnas NOT NULL sin valor por defecto se añaden como NULL para no romper filas antiguas
      const tipoSeguro = tipo.includes('NOT NULL') && !tipo.includes('DEFAULT') ? tipo.replace('NOT NULL', 'NULL') : tipo;
      await db.query(`ALTER TABLE empresas ADD COLUMN ${nombre} ${tipoSeguro}`);
      console.log(`[bd] columna añadida: ${nombre}`);
    }
  }
}
