import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
// Απαραίτητο: προσθέτει το .transition() στα selections του d3
import 'd3-transition';
import { useWorldTopology, type CountryFeature } from './useWorldTopology';
import { getCountryByIsoCode } from '../../data/countries';
import { continentMapFillVars } from '../../theme/continents';
import './WorldMap.css';

const VIEW_W = 1000;
const VIEW_H = 500;
const MIN_ZOOM = 1;
const MAX_ZOOM = 10;

let cachedProjection: ReturnType<typeof geoNaturalEarth1> | null = null;

/**
 * Προβολή γεωγραφικών συντεταγμένων (lon, lat) στις συντεταγμένες του
 * χάρτη — ίδια προβολή με τις χώρες, ώστε overlay στοιχεία (γεγονότα)
 * να «κάθονται» σωστά και να ακολουθούν το ζουμ.
 */
export function projectToMap(lon: number, lat: number): [number, number] | null {
  if (!cachedProjection) {
    cachedProjection = geoNaturalEarth1().fitSize([VIEW_W, VIEW_H], { type: 'Sphere' });
  }
  const p = cachedProjection([lon, lat]);
  return p ? [p[0], p[1]] : null;
}

export interface WorldMapHandle {
  /** Ζουμ στη χώρα με το συγκεκριμένο iso2 */
  zoomToCountry: (iso2: string) => void;
  resetZoom: () => void;
}

interface WorldMapProps {
  selectedIso2?: string | null;
  onSelectCountry?: (iso2: string) => void;
  /** Χρωματισμός ανατροφοδότησης για το παιχνίδι χάρτη */
  correctIso2?: string | null;
  wrongIso2?: string | null;
  /** Απενεργοποίηση κλικ (π.χ. μετά την απάντηση) */
  interactionDisabled?: boolean;
  ariaLabel?: string;
  /** SVG στοιχεία που ζωγραφίζονται ΜΕΣΑ στην ομάδα ζουμ (π.χ. γεγονότα) */
  overlay?: ReactNode;
  /**
   * Πλήρωση όλου του γονικού ύψους: ο χάρτης «κόβεται» στα πλάγια αντί
   * να μικραίνει — για πλήρη οθόνη σε κινητό (κατακόρυφη οθόνη)
   */
  fill?: boolean;
}

interface TooltipState {
  x: number;
  y: number;
  name: string;
}

/**
 * Διαδραστικός παγκόσμιος χάρτης SVG: hover με ελληνικό όνομα, κλικ
 * επιλογής, ζουμ/μετακίνηση (ποντίκι και αφή). Η σύνδεση γεωμετρίας-χώρας
 * γίνεται αποκλειστικά με ISO κωδικούς.
 */
export const WorldMap = forwardRef<WorldMapHandle, WorldMapProps>(function WorldMap(
  {
    selectedIso2 = null,
    onSelectCountry,
    correctIso2 = null,
    wrongIso2 = null,
    interactionDisabled = false,
    ariaLabel = 'Παγκόσμιος χάρτης',
    overlay,
    fill = false,
  },
  ref,
) {
  const { topology, error } = useWorldTopology();
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const { pathById } = useMemo(() => {
    if (!topology) return { pathById: new Map<string, string>() };
    const projection = geoNaturalEarth1().fitSize(
      [VIEW_W, VIEW_H],
      { type: 'Sphere' },
    );
    const pathGen = geoPath(projection);
    const pathById = new Map<string, string>();
    for (const c of topology.countries) {
      const d = pathGen(c.feature);
      if (d) pathById.set(c.isoNumeric, d);
    }
    return { pathById };
  }, [topology]);

  const boundsByIso2 = useMemo(() => {
    const map = new Map<string, [[number, number], [number, number]]>();
    if (!topology) return map;
    const projection = geoNaturalEarth1().fitSize([VIEW_W, VIEW_H], { type: 'Sphere' });
    const pathGen = geoPath(projection);
    for (const c of topology.countries) {
      if (c.iso2) map.set(c.iso2, pathGen.bounds(c.feature));
    }
    return map;
  }, [topology]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const gEl = gRef.current;
    if (!svgEl || !gEl || !topology) return;
    const svgSel = select(svgEl);
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .translateExtent([
        [-60, -60],
        [VIEW_W + 60, VIEW_H + 60],
      ])
      .on('zoom', (event) => {
        select(gEl).attr('transform', event.transform.toString());
      });
    svgSel.call(behavior);
    zoomRef.current = behavior;
    return () => {
      svgSel.on('.zoom', null);
      zoomRef.current = null;
    };
  }, [topology]);

  const zoomToCountry = useCallback(
    (iso2: string) => {
      const bounds = boundsByIso2.get(iso2);
      const svgEl = svgRef.current;
      const behavior = zoomRef.current;
      if (!bounds || !svgEl || !behavior) return;
      const [[x0, y0], [x1, y1]] = bounds;
      const w = Math.max(x1 - x0, 1);
      const h = Math.max(y1 - y0, 1);
      const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, 0.5 / Math.max(w / VIEW_W, h / VIEW_H)));
      const tx = VIEW_W / 2 - scale * (x0 + x1) / 2;
      const ty = VIEW_H / 2 - scale * (y0 + y1) / 2;
      select(svgEl)
        .transition()
        .duration(650)
        .call(behavior.transform, zoomIdentity.translate(tx, ty).scale(scale));
    },
    [boundsByIso2],
  );

  const resetZoom = useCallback(() => {
    const svgEl = svgRef.current;
    const behavior = zoomRef.current;
    if (!svgEl || !behavior) return;
    select(svgEl).transition().duration(500).call(behavior.transform, zoomIdentity);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const svgEl = svgRef.current;
    const behavior = zoomRef.current;
    if (!svgEl || !behavior) return;
    select(svgEl).transition().duration(250).call(behavior.scaleBy, factor);
  }, []);

  useImperativeHandle(ref, () => ({ zoomToCountry, resetZoom }), [zoomToCountry, resetZoom]);

  const handleMove = useCallback((e: React.PointerEvent, c: CountryFeature) => {
    if (!c.nameGreek || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      name: c.nameGreek,
    });
  }, []);

  if (error) {
    return (
      <div className="worldmap__error card">
        <p>⚠️ Ο χάρτης δεν μπόρεσε να φορτώσει. Δοκίμασε να ανανεώσεις τη σελίδα.</p>
      </div>
    );
  }

  if (!topology) {
    return (
      <div className="worldmap__loading" role="status">
        <span className="worldmap__spinner" aria-hidden="true">🌍</span>
        <p>Φόρτωση χάρτη...</p>
      </div>
    );
  }

  return (
    <div
      className={`worldmap ${fill ? 'worldmap--fill' : ''}`}
      ref={wrapRef}
      style={continentMapFillVars()}
    >
      <svg
        ref={svgRef}
        className="worldmap__svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio={fill ? 'xMidYMid slice' : 'xMidYMid meet'}
        role="group"
        aria-label={ariaLabel}
      >
        <rect className="worldmap__ocean" x="0" y="0" width={VIEW_W} height={VIEW_H} rx="14" />
        <g ref={gRef}>
          {topology.countries.map((c) => {
            const d = pathById.get(c.isoNumeric);
            if (!d) return null;
            const known = Boolean(c.iso2);
            const isSelected = known && c.iso2 === selectedIso2;
            const isCorrect = known && c.iso2 === correctIso2;
            const isWrong = known && c.iso2 === wrongIso2;
            // Παστέλ ατμόσφαιρα ηπείρου — το χρώμα ορίζεται κεντρικά
            // στο theme/continents.ts και φτάνει εδώ ως CSS μεταβλητή
            const continent = known ? getCountryByIsoCode(c.iso2!)?.continent : undefined;
            const cls = [
              'worldmap__country',
              known ? 'worldmap__country--known' : 'worldmap__country--unknown',
              continent ? `worldmap__country--cont-${continent}` : '',
              isSelected ? 'worldmap__country--selected' : '',
              isCorrect ? 'worldmap__country--correct' : '',
              isWrong ? 'worldmap__country--wrong' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <path
                key={`${c.isoNumeric}-${c.iso2 ?? 'x'}`}
                data-iso2={c.iso2}
                d={d}
                className={cls}
                tabIndex={-1}
                aria-label={c.nameGreek}
                onClick={() => {
                  if (known && !interactionDisabled && onSelectCountry) {
                    onSelectCountry(c.iso2!);
                  }
                }}
                onPointerMove={(e) => handleMove(e, c)}
                onPointerLeave={() => setTooltip(null)}
              />
            );
          })}
          {overlay}
        </g>
      </svg>
      {tooltip && (
        <div
          className="worldmap__tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
          aria-hidden="true"
        >
          {tooltip.name}
        </div>
      )}
      <div className="worldmap__zoom-controls">
        <button
          type="button"
          className="worldmap__zoom-btn"
          aria-label="Μεγέθυνση"
          onClick={() => zoomBy(1.6)}
        >
          +
        </button>
        <button
          type="button"
          className="worldmap__zoom-btn"
          aria-label="Σμίκρυνση"
          onClick={() => zoomBy(1 / 1.6)}
        >
          −
        </button>
        <button
          type="button"
          className="worldmap__zoom-btn"
          aria-label="Επαναφορά ζουμ"
          onClick={resetZoom}
        >
          ⤾
        </button>
      </div>
    </div>
  );
});
