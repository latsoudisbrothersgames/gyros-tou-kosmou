import { useMemo } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { mesh } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import { getCountryByIsoNumeric } from '../../data/countries';
import { useWorldTopology } from '../WorldMap/useWorldTopology';

interface Props {
  iso2s: string[]; host?: string; revealed?: boolean; highlighted?: string[];
  route?: string[]; onCountry?: (iso2: string) => void; minTouch?: boolean;
}
/** Μικρός χάρτης από την ήδη φορτωμένη τοπολογία. Δεν αποδίδει απαντήσεις πριν το reveal. */
export function RegionalMap({ iso2s, host, revealed = false, highlighted = [], route, onCountry, minTouch = false }: Props) {
  const { topology } = useWorldTopology();
  const map = useMemo(() => {
    if (!topology) return null;
    const chosen = topology.countries.filter(c => c.iso2 && iso2s.includes(c.iso2));
    if (!chosen.length) return null;
    const collection: FeatureCollection<Geometry> = { type: 'FeatureCollection', features: chosen.map(c => c.feature) };
    const projection = geoNaturalEarth1().fitExtent([[16, 14], [344, 206]], collection);
    const path = geoPath(projection);
    const visible = topology.countries.map(c => ({ ...c, d: path(c.feature) })).filter(c => c.d);
    const getCenter = (iso: string) => {
      const f = topology.countries.find(c => c.iso2 === iso);
      return f ? path.centroid(f.feature) : null;
    };
    const borders = revealed && host && highlighted.length ? mesh(topology.raw, topology.raw.objects.countries,
      (a, b) => {
        const x = getCountryByIsoNumeric(String(a.id))?.iso2;
        const y = getCountryByIsoNumeric(String(b.id))?.iso2;
        return x === host && !!y && highlighted.includes(y) || y === host && !!x && highlighted.includes(x);
      }) : null;
    return { visible, path, getCenter, borderPath: borders ? path(borders) : null };
  }, [topology, iso2s, host, revealed, highlighted]);
  if (!map) return <div className="regional-map regional-map--loading">Ο χάρτης φορτώνει…</div>;
  const routePoints = revealed && route ? route.map(map.getCenter).filter((p): p is [number, number] => !!p && Number.isFinite(p[0])) : [];
  return <svg className="regional-map" viewBox="0 0 360 220" role="img" aria-label="Περιφερειακός χάρτης χωρίς ονόματα">
    <rect width="360" height="220" rx="16" fill="#e6f5fa" />
    {map.visible.map(c => <path key={c.isoNumeric} d={c.d!} fill={c.iso2 === host ? '#ffdc80' : '#d4e8ce'}
      stroke={revealed ? '#9ab7a5' : 'none'} strokeWidth=".45" />)}
    {map.borderPath && <path d={map.borderPath} fill="none" stroke="#f06049" strokeWidth="3" />}
    {routePoints.length > 1 && <polyline points={routePoints.map(p => p.join(',')).join(' ')} fill="none" stroke="#eb8e56" strokeWidth="2" strokeDasharray="5 5" />}
    {onCountry && map.visible.filter(c => c.iso2).map(c => {
      const center = map.getCenter(c.iso2!);
      if (!center || !Number.isFinite(center[0])) return null;
      return <g key={`tap-${c.iso2}`} onClick={() => onCountry(c.iso2!)} role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onCountry(c.iso2!); }} aria-label={c.nameGreek}>
        <path d={c.d!} fill="transparent" stroke="none" />
        {minTouch && <circle cx={center[0]} cy={center[1]} r="22" fill="transparent" />}
      </g>;
    })}
  </svg>;
}
