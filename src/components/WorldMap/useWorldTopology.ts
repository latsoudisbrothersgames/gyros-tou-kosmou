import { useEffect, useState } from 'react';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { getCountryByIsoNumeric } from '../../data/countries';

export interface CountryFeature {
  /** GeoJSON feature της χώρας */
  feature: GeoJSON.Feature<Geometry>;
  /** ISO numeric id από το Natural Earth */
  isoNumeric: string;
  /** iso2 αν η χώρα υπάρχει στο dataset μας */
  iso2?: string;
  nameGreek?: string;
}

export interface WorldTopology {
  countries: CountryFeature[];
  raw: Topology<{ countries: GeometryCollection }>;
  /** iso2 όλων των χωρών που έχουν γεωμετρία στον χάρτη */
  availableIso2: Set<string>;
}

let cached: WorldTopology | null = null;
let pending: Promise<WorldTopology> | null = null;

/**
 * Φορτώνει (lazy, με cache) το TopoJSON του world-atlas και το ενώνει
 * με το dataset μας μέσω ISO numeric κωδικών — όχι ονομάτων.
 */
async function loadTopology(): Promise<WorldTopology> {
  const topoModule = await import('world-atlas/countries-50m.json');
  const topo = topoModule.default as unknown as Topology<{
    countries: GeometryCollection;
  }>;
  const collection = feature(topo, topo.objects.countries) as FeatureCollection<Geometry>;

  const countries: CountryFeature[] = [];
  const availableIso2 = new Set<string>();

  for (const f of collection.features) {
    const isoNumeric = String(f.id ?? '');
    // Η Ανταρκτική δεν είναι χώρα του παιχνιδιού
    if (isoNumeric === '010') continue;
    const match = getCountryByIsoNumeric(isoNumeric);
    if (match) availableIso2.add(match.iso2);
    countries.push({
      feature: f,
      isoNumeric,
      iso2: match?.iso2,
      nameGreek: match?.nameGreek,
    });
  }

  return { countries, availableIso2, raw: topo };
}

export function getWorldTopology(): Promise<WorldTopology> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = loadTopology().then((result) => {
      cached = result;
      return result;
    });
  }
  return pending;
}

export function useWorldTopology(): { topology: WorldTopology | null; error: boolean } {
  const [topology, setTopology] = useState<WorldTopology | null>(cached);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (topology) return;
    let cancelled = false;
    getWorldTopology()
      .then((t) => {
        if (!cancelled) setTopology(t);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [topology]);

  return { topology, error };
}
