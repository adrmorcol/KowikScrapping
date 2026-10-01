export interface EmpresaModel {
    id: string,
    nombre: string,
    lat: number,
    lng: number,
    distancia: number,
    provincia: string | null,
    localidad: string | null,
    cif: string | null,
    sector: string | null,
    telefono: string | null,
    email: string | null,
    web: string | null,
    tamanyo: number | null,
    decisor: {
        nombre: string | null,
        cargo: string | null,
        email: string | null,
        telefono: string | null
    } | null
}
