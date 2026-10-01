const RADIO_TIERRA = 6371000;

const aRadianes = grados => grados * Math.PI / 180;

export function distanciaMetros(lat1, lng1, lat2, lng2) {
  const dLat = aRadianes(lat2 - lat1);
  const dLng = aRadianes(lng2 - lng1);

  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * RADIO_TIERRA * Math.asin(Math.sqrt(a));
}