export type EstadoEmpresa = 'pendiente' | 'verificada' | 'no_apta';

export interface EmpresaModel {
    id: string,
    nombre: string,
    lat: number,
    lng: number,
    distancia: number,
    provincia: string | null,
    localidad: string | null,
    cif: string | null,
    razonSocial: string | null,
    sector: string | null,
    telefono: string | null,
    email: string | null,
    web: string | null,
    tamanyo: number | null,
    estado: EstadoEmpresa,
    decisor: {
        nombre: string | null,
        cargo: string | null,
        email: string | null,
        telefono: string | null
    } | null
}

/** Empresa tal y como está guardada en la base de datos (la tabla de "Consultar registro"). */
export interface EmpresaGuardadaModel extends Omit<EmpresaModel, 'distancia'> {
    analizadaEn: string | null,
    editadaEn: string | null,
    actualizadaEn: string
}
