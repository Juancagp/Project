import { Satellite } from "../models/Satellite";

export function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371; // radio tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distancia en km
}

export function calcularSenal(lat: number, lng: number, satellites: Satellite[]) {
  let senal = 0;

  satellites.forEach((sat) => {
    const dist = calcularDistancia(lat, lng, sat.position.lat, sat.position.long);
    const s = Math.max(0, 1 - dist / sat.power);
    senal += s;
  });

  return senal;
}
