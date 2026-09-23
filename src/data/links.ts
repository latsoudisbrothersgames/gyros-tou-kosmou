/** Εκπαιδευτικό δίκτυο γειτονικών ακτών και υπεραποστάσεων, όχι ταξιδιωτικός οδηγός. */
export interface TravelLink { a: string; b: string; kind: 'sea' | 'air' }
const seaPairs = [
  // Ευρώπη και Μεσόγειος
  'gr-it', 'gr-cy', 'it-al', 'it-hr', 'it-mt', 'it-tn',
  'es-ma', 'fr-gb', 'gb-no',
  'dk-se', 'fi-ee',
  'mt-tn', 'cy-tr', 'cy-lb', 'is-no', 'ru-jp',
  // Αφρική και Ινδικός Ωκεανός
  'ma-cv', 'cv-sn', 'st-ga', 'st-gq', 'mg-mz', 'mg-km', 'km-mz',
  'sc-ke', 'sc-mg', 'mu-mg', 'mu-sc', 'tz-mg', 'dj-ye',
  // Μέση Ανατολή και Ασία
  'sa-bh', 'bh-qa', 'qa-ae', 'ir-ae', 'om-ir', 'ye-er', 'in-lk',
  'in-mv', 'mv-lk', 'lk-id', 'my-sg', 'sg-id',
  'id-au', 'id-ph', 'ph-tw', 'tw-cn', 'tw-jp', 'jp-kr',
  'vn-ph',
  // Ωκεανία: κάθε νησιωτικό κράτος έχει τουλάχιστον μία ακμή
  'au-nz', 'pg-sb', 'sb-vu', 'vu-fj', 'fj-ws', 'fj-to',
  'fj-tv', 'fj-ki', 'ki-mh', 'mh-fm', 'fm-pw', 'pw-ph',
  'nr-ki', 'nr-fm', 'ws-to',
  // Καραϊβική και Αμερική
  'us-bs', 'bs-cu', 'cu-jm', 'do-kn',
  'kn-ag', 'ag-dm', 'dm-lc', 'lc-vc', 'vc-gd', 'gd-tt',
  'bb-lc', 'bb-vc', 'tt-ve', 'tt-gy', 'mx-cu',
  'cl-ar',
] as const;
const airPairs = [
  'us-gb', 'ca-fr', 'br-pt', 'ar-za', 'ma-br', 'eg-in', 'za-au',
  'ke-in', 'in-au', 'cn-us', 'jp-us', 'ru-ca', 'nz-cl', 'mx-es',
  'ng-gb', 'tr-jp',
] as const;
export const TRAVEL_LINKS: TravelLink[] = [
  ...seaPairs.map(pair => { const [a, b] = pair.split('-'); return { a, b, kind: 'sea' as const }; }),
  ...airPairs.map(pair => { const [a, b] = pair.split('-'); return { a, b, kind: 'air' as const }; }),
];
export function travelLink(a: string, b: string): TravelLink | undefined {
  return TRAVEL_LINKS.find(link => link.a === a && link.b === b || link.a === b && link.b === a);
}
