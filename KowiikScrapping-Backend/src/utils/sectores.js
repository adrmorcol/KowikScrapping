import { GRUPOS } from "../data/sectores.js";

const SECTORES = Object.fromEntries(
    Object.entries(GRUPOS).flatMap(([sector, valores]) => valores.map(valor => [valor, sector]))
);

export function devolverSector(sectorInicial) {
    return SECTORES[sectorInicial] ?? 'Otros';    
}