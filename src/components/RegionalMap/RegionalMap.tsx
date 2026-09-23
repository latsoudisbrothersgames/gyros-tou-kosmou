import { useMemo } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { mesh } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import { getCountryByIsoCode, getCountryByIsoNumeric } from '../../data/countries';
import { useWorldTopology } from '../WorldMap/useWorldTopology';

interface Props {
  iso2s: string[]; host?: string; revealed?: boolean; highlighted?: string[];
  route?: string[]; travelRoute?: string[]; travelKinds?: ('land' | 'sea' | 'air')[]; moving?: boolean; onCountry?: (iso2: string) => void; minTouch?: boolean;
}
/** Μικρός χάρτης από την ήδη φορτωμένη τοπολογία. Δεν αποδίδει απαντήσεις πριν το reveal. */
export function RegionalMap({ iso2s, host, revealed = false, highlighted = [], route, travelRoute, travelKinds = [], moving = false, onCountry, minTouch = false }: Props) {
  const { topology } = useWorldTopology();
  const map = useMemo(() => {
    if (!topology) return null;
    const chosen = topology.countries.filter(c => c.iso2 && iso2s.includes(c.iso2));
    if (!chosen.length) return null;
    // Το Τουβαλού δεν υπάρχει στη γεωμετρία 1:50m. Το σημείο του κρατά τον χάρτη και την αφή λειτουργικά.
    const fallback = iso2s.includes('tv') ? { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [179.2, -8.5] }, properties: {} } : null;
    const collection: FeatureCollection<Geometry> = { type: 'FeatureCollection', features: [...chosen.map(c => c.feature), ...(fallback ? [fallback] : [])] };
    const projection = geoNaturalEarth1().fitExtent([[16, 14], [344, 206]], collection);
    const path = geoPath(projection);
    const visible = topology.countries.map(c => ({ ...c, d: path(c.feature) })).filter(c => c.d);
    const getCenter = (iso: string) => {
      const f = topology.countries.find(c => c.iso2 === iso);
      return f ? path.centroid(f.feature) : iso === 'tv' ? projection([179.2, -8.5]) : null;
    };
    const borders = revealed && host && highlighted.length ? mesh(topology.raw, topology.raw.objects.countries,
      (a, b) => {
        const x = getCountryByIsoNumeric(String(a.id))?.iso2;
        const y = getCountryByIsoNumeric(String(b.id))?.iso2;
        return x === host && !!y && highlighted.includes(y) || y === host && !!x && highlighted.includes(x);
      }) : null;
    return { visible, path, getCenter, borderPath: borders ? path(borders) : null, fallback: fallback ? projection([179.2, -8.5]) : null };
  }, [topology, iso2s, host, revealed, highlighted]);
  if (!map) return <div className="regional-map regional-map--loading">Ο χάρτης φορτώνει…</div>;
  const routePoints = revealed && route ? route.map(map.getCenter).filter((p): p is [number, number] => !!p && Number.isFinite(p[0])) : [];
  const travelPoints = travelRoute ? travelRoute.map(map.getCenter).filter((p): p is [number, number] => !!p && Number.isFinite(p[0])) : [];

  return <svg className="regional-map" viewBox="0 0 360 220" role="img" aria-label="Περιφερειακός χάρτης χωρίς ονόματα">
    <rect width="360" height="220" rx="16" fill="#e6f5fa" />
    {map.visible.map(c => <path key={c.isoNumeric} d={c.d!} fill={c.iso2 === host ? '#ffdc80' : '#d4e8ce'}
      stroke={revealed ? '#9ab7a5' : 'none'} strokeWidth=".45" />)}
    {map.borderPath && <path d={map.borderPath} fill="none" stroke="#f06049" strokeWidth="3" />}
    {routePoints.length > 1 && <polyline points={routePoints.map(p => p.join(',')).join(' ')} fill="none" stroke="#eb8e56" strokeWidth="2" strokeDasharray="5 5" />}
    {travelPoints.length > 1 && <polyline points={travelPoints.map(p => p.join(',')).join(' ')} fill="none" stroke="#167e9c" strokeWidth="3" />}
    {moving && travelPoints.slice(1).map((point, i) => {
      const from = travelPoints[i];
      const kind = travelKinds[i] ?? 'land';
      return <g key={i}
        style={{ offsetPath: `path('M${from[0]} ${from[1]} L${point[0]} ${point[1]}')`,
          offsetRotate: '0deg', animation: `post-motion .65s linear ${i * .65}s both` }}>
          {kind === 'land' ? <circle r="6" fill="#e56536" stroke="white" strokeWidth="2" /> :
            kind === 'sea' ? <path d="M-10 1 L10 1 L7 6 L-7 6 Z M-1 -7 L-1 1 M-1 -7 L5 0 Z" fill="#167e9c" stroke="white" strokeWidth="1.5" /> :
              <path d="M0 -10 L3 -1 L10 3 L10 5 L2 3 L2 8 L-2 8 L-2 3 L-10 5 L-10 3 L-3 -1 Z" fill="#167e9c" stroke="white" strokeWidth="1.5" />}
        </g>;
    })}
    {map.fallback && <g role={onCountry ? 'button' : undefined} tabIndex={onCountry ? 0 : undefined}
      aria-label={getCountryByIsoCode('tv')?.nameGreek} onClick={() => onCountry?.('tv')}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onCountry?.('tv'); }}>
      <circle cx={map.fallback[0]} cy={map.fallback[1]} r="28" fill="transparent" />
      <circle cx={map.fallback[0]} cy={map.fallback[1]} r="5" fill="#e56536" />
    </g>}
    {onCountry && map.visible.filter(c => c.iso2).map(c => {
      const center = map.getCenter(c.iso2!);
      if (!center || !Number.isFinite(center[0])) return null;
      return <g key={`tap-${c.iso2}`} onClick={() => onCountry(c.iso2!)} role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onCountry(c.iso2!); }} aria-label={c.nameGreek}>
        <path d={c.d!} fill="transparent" stroke="none" />
        {minTouch && (() => { const [[x0, y0], [x1, y1]] = map.path.bounds(c.feature); return x1 - x0 < 44 || y1 - y0 < 44 ? <circle cx={center[0]} cy={center[1]} r="28" fill="transparent" /> : null; })()}
      </g>;
    })}
  </svg>;
}
