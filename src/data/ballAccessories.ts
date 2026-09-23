/** Προαιρετικά φυσικά, αθλητικά και πολιτιστικά σύμβολα για κερδισμένες φιγούρες. */
export type AccessoryKind = 'olive' | 'maple' | 'cherry' | 'leaf' | 'mountain' | 'flower' | 'football' | 'sun' | 'wave' | 'tree' | 'coffee' | 'tulip' | 'kiwi' | 'star';
export interface BallAccessory { kind: AccessoryKind; label: string }
export const BALL_ACCESSORIES: Readonly<Record<string, BallAccessory>> = {
  gr: { kind: 'olive', label: 'κλαδί ελιάς' }, it: { kind: 'olive', label: 'κλαδί ελιάς' }, es: { kind: 'olive', label: 'κλαδί ελιάς' }, pt: { kind: 'wave', label: 'κύμα του Ατλαντικού' },
  fr: { kind: 'flower', label: 'λουλούδι κήπου' }, de: { kind: 'tree', label: 'δέντρο δρυός' }, nl: { kind: 'tulip', label: 'τουλίπα' }, be: { kind: 'flower', label: 'λουλούδι κήπου' },
  ch: { kind: 'mountain', label: 'αλπική κορυφή' }, at: { kind: 'mountain', label: 'αλπική κορυφή' }, no: { kind: 'mountain', label: 'σκανδιναβικό βουνό' }, se: { kind: 'tree', label: 'σκανδιναβικό δέντρο' },
  fi: { kind: 'tree', label: 'δέντρο σημύδας' }, is: { kind: 'mountain', label: 'ηφαιστειακό βουνό' }, ie: { kind: 'leaf', label: 'πράσινο φύλλο' }, gb: { kind: 'flower', label: 'λουλούδι κήπου' },
  ca: { kind: 'maple', label: 'φύλλο σφενδάμου' }, us: { kind: 'star', label: 'αστέρι' }, mx: { kind: 'sun', label: 'ηλιόλουστο τοπίο' }, cr: { kind: 'leaf', label: 'τροπικό φύλλο' },
  cu: { kind: 'sun', label: 'ήλιος της Καραϊβικής' }, jm: { kind: 'wave', label: 'κύμα της Καραϊβικής' }, br: { kind: 'football', label: 'μπάλα ποδοσφαίρου' }, ar: { kind: 'football', label: 'μπάλα ποδοσφαίρου' },
  cl: { kind: 'mountain', label: 'κορυφή των Άνδεων' }, pe: { kind: 'mountain', label: 'κορυφή των Άνδεων' }, co: { kind: 'coffee', label: 'καρπός καφέ' }, ec: { kind: 'mountain', label: 'κορυφή των Άνδεων' },
  uy: { kind: 'football', label: 'μπάλα ποδοσφαίρου' }, py: { kind: 'flower', label: 'λουλούδι κήπου' }, za: { kind: 'flower', label: 'λουλούδι του Κέιπ' }, ke: { kind: 'tree', label: 'δέντρο σαβάνας' },
  tz: { kind: 'mountain', label: 'Κιλιμάντζαρο' }, eg: { kind: 'sun', label: 'ήλιος της ερήμου' }, ma: { kind: 'mountain', label: 'Όρη Άτλας' }, tn: { kind: 'olive', label: 'κλαδί ελιάς' },
  gh: { kind: 'tree', label: 'τροπικό δέντρο' }, et: { kind: 'coffee', label: 'καρπός καφέ' }, mg: { kind: 'tree', label: 'δέντρο μπαομπάμπ' }, ng: { kind: 'flower', label: 'λουλούδι κήπου' },
  jp: { kind: 'cherry', label: 'άνθος κερασιάς' }, cn: { kind: 'mountain', label: 'ορεινό τοπίο' }, in: { kind: 'flower', label: 'άνθος λωτού' }, np: { kind: 'mountain', label: 'κορυφή Ιμαλαΐων' },
  th: { kind: 'flower', label: 'τροπικό λουλούδι' }, vn: { kind: 'flower', label: 'άνθος λωτού' }, id: { kind: 'leaf', label: 'τροπικό φύλλο' }, ph: { kind: 'wave', label: 'θαλάσσιο κύμα' },
  kr: { kind: 'flower', label: 'λουλούδι κήπου' }, sg: { kind: 'tree', label: 'δέντρο κήπου' }, au: { kind: 'leaf', label: 'φύλλο ευκαλύπτου' }, nz: { kind: 'kiwi', label: 'πουλί κίβι' },
};
