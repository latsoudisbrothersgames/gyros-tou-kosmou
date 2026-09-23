import { writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { geoArea, geoCentroid } from 'd3-geo';
import type { FeatureCollection, Geometry, Polygon } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';
import atlas from 'world-atlas/countries-50m.json' with { type: 'json' };
import { getCountryByIsoNumeric } from '../src/data/countries';

const topo = atlas as unknown as Topology<{ countries: GeometryCollection }>;
const world = feature(topo, topo.objects.countries) as FeatureCollection<Geometry>;
const centers: Record<string, [number, number]> = {};
for (const country of world.features) {
  const iso2 = getCountryByIsoNumeric(String(country.id))?.iso2;
  if (!iso2) continue;
  const geometry = country.geometry;
  const polygons: Polygon[] = geometry.type === 'Polygon' ? [geometry]
    : geometry.type === 'MultiPolygon' ? geometry.coordinates.map(coordinates => ({ type: 'Polygon', coordinates })) : [];
  const main = polygons.sort((a, b) => geoArea(b) - geoArea(a))[0];
  if (main) centers[iso2] = geoCentroid(main).map(value => Math.round(value * 1000) / 1000) as [number, number];
}
// The 1:50m atlas omits Tuvalu; keep its charted location available to both games.
centers.tv = [179.2, -8.5];
writeFileSync('src/data/centroids.ts', `/** Main-landmass centroids from world-atlas/countries-50m. Regenerate with scripts/genCentroids.ts. */\nexport const CENTROIDS: Record<string, [number, number]> = ${JSON.stringify(Object.fromEntries(Object.entries(centers).sort(([a], [b]) => a.localeCompare(b))), null, 2)};\n`);
