import { geoArea, geoBounds, geoCentroid, geoDistance } from 'd3-geo';
import type { Feature, Geometry, Polygon } from 'geojson';

/** Διαστάσεις σκηνής (μονάδες viewBox): πίνακας πάνω, δίσκος κομματιών κάτω. */
export const BOARD = { x0: 14, y0: 14, x1: 346, y1: 280 };
export const TRAY_TOP = 302;
export const STAGE_H = TRAY_TOP + 270 + 4;
/** Απόσταση (km) από την κύρια ξηρά πέρα από την οποία ένα νησί/έδαφος δεν μπαίνει στο παζλ. */
export const REMOTE_KM = 450;

/**
 * Κρατά μόνο τα πολύγωνα κοντά στην κύρια ξηρά της χώρας. Χωρίς αυτό η Γαλλία φέρνει μαζί
 * Γουιάνα/Ρεϊνιόν και η Ιβηρική Κανάρια/Αζόρες/Μαδέρα, και ο πίνακας γίνεται ολόκληρος ωκεανός.
 */
export function trimRemote(f: Feature<Geometry>): Feature<Geometry> {
  const g = f.geometry;
  if (!g || g.type !== 'MultiPolygon' || g.coordinates.length < 2) return f;
  const polys = g.coordinates.map(c => ({ c, poly: { type: 'Polygon', coordinates: c } as Polygon }));
  const main = polys.reduce((a, b) => geoArea(b.poly) > geoArea(a.poly) ? b : a);
  const [[x0, y0], [x1, y1]] = geoBounds(main.poly);
  if (x0 > x1) return f; // περνά τον αντιμεσημβρινό — δεν συμβαίνει στα παζλ μας
  const keep = polys.filter(p => {
    const [lon, lat] = geoCentroid(p.poly);
    const nearest: [number, number] = [Math.min(Math.max(lon, x0), x1), Math.min(Math.max(lat, y0), y1)];
    return geoDistance([lon, lat], nearest) * 6371 <= REMOTE_KM;
  });
  return { ...f, geometry: { type: 'MultiPolygon', coordinates: keep.map(p => p.c) } };
}
