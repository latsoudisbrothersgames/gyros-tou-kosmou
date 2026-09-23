import { useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { mesh } from 'topojson-client';
import { getCountryByIsoCode, getCountryByIsoNumeric } from '../../data/countries';
import { CENTROIDS } from '../../data/centroids';
import { useWorldTopology } from '../WorldMap/useWorldTopology';

interface Props {
  iso2s: string[]; frameIso2s?: string[]; host?: string; revealed?: boolean; highlighted?: string[];
  route?: string[]; travelRoute?: string[]; travelKinds?: ('land' | 'sea' | 'air')[]; moving?: boolean; onCountry?: (iso2: string) => void; minTouch?: boolean;
}
/** Μικρός χάρτης από την ήδη φορτωμένη τοπολογία. Δεν αποδίδει απαντήσεις πριν το reveal. */
export function RegionalMap({ iso2s, frameIso2s = iso2s, host, revealed = false, highlighted = [], route, travelRoute, travelKinds = [], moving = false, onCountry, minTouch = false }: Props) {
  const { topology } = useWorldTopology();
  const map = useMemo(() => {
    if (!topology) return null;
    const points = frameIso2s.map(id => CENTROIDS[id]).filter((p): p is [number, number] => !!p);
    if (!points.length) return null;
    // Center the projection on the framing set; wrapping around the date line stays local.
    const anchor = Math.atan2(points.reduce((sum, [lon]) => sum + Math.sin(lon * Math.PI / 180), 0),
      points.reduce((sum, [lon]) => sum + Math.cos(lon * Math.PI / 180), 0)) * 180 / Math.PI;
    const unit = geoMercator().rotate([-anchor, 0]).scale(1).translate([0, 0]);
    const xy = points.map(point => unit(point)!).filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]));
    const xs = xy.map(p => p[0]), ys = xy.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    // 25% breathing room on each side and a roughly 1,500 km minimum width.
    const width = Math.max(x1 - x0, 1500 / 6371);
    const height = Math.max(y1 - y0, (1500 / 6371) * 220 / 360);
    const scale = Math.min(328 / (width * 1.5), 192 / (height * 1.5));
    const projection = geoMercator().rotate([-anchor, 0]).scale(scale)
      .translate([180 - scale * (x0 + x1) / 2, 110 - scale * (y0 + y1) / 2]);
    const path = geoPath(projection);
    const visible = topology.countries.map(c => ({ ...c, d: path(c.feature) })).filter(c => c.d);
    const getCenter = (iso: string) => CENTROIDS[iso] ? projection(CENTROIDS[iso]) : null;
    const borders = revealed && host && highlighted.length ? mesh(topology.raw, topology.raw.objects.countries,
      (a, b) => {
        const x = getCountryByIsoNumeric(String(a.id))?.iso2;
        const y = getCountryByIsoNumeric(String(b.id))?.iso2;
        return x === host && !!y && highlighted.includes(y) || y === host && !!x && highlighted.includes(x);
      }) : null;
    return { visible, path, getCenter, borderPath: borders ? path(borders) : null, fallback: iso2s.includes('tv') ? projection(CENTROIDS.tv) : null };
  }, [topology, iso2s, frameIso2s, host, revealed, highlighted]);
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
    {onCountry && map.visible.filter(c => c.iso2 && iso2s.includes(c.iso2)).map(c => {
      const center = map.getCenter(c.iso2!);
      if (!center || !Number.isFinite(center[0])) return null;
      const [[x0, y0], [x1, y1]] = map.path.bounds(c.feature);
      if (x1 < -28 || x0 > 388 || y1 < -28 || y0 > 248) return null;
      return <g key={`tap-${c.iso2}`} onClick={() => onCountry(c.iso2!)} role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onCountry(c.iso2!); }} aria-label={c.nameGreek}>
        <path d={c.d!} fill="transparent" stroke="none" />
        {minTouch && (x1 - x0 < 44 || y1 - y0 < 44) && <circle cx={center[0]} cy={center[1]} r="28" fill="transparent" />}
      </g>;
    })}
  </svg>;
}
