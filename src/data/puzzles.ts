/** Χειροκίνητες εκπαιδευτικές περιοχές, χωρίς αμφισβητούμενη γεωμετρία. */
export interface AtlasPuzzle { id: string; title: string; countries: readonly string[] }
export const ATLAS_PUZZLES: AtlasPuzzle[] = [
  { id: 'balkans', title: 'Βαλκάνια', countries: ['gr','al','mk','bg','rs','me'] },
  { id: 'iberia', title: 'Ιβηρική και Γαλλία', countries: ['pt','es','fr','ad'] },
  { id: 'nordic', title: 'Βόρεια Ευρώπη', countries: ['no','se','fi','dk'] },
  { id: 'benelux', title: 'Μπενελούξ και Γερμανία', countries: ['be','nl','lu','de'] },
  { id: 'alps', title: 'Οι Άλπεις', countries: ['fr','ch','at','it','si'] },
  { id: 'baltic', title: 'Η Βαλτική', countries: ['ee','lv','lt','pl'] },
  { id: 'east-africa', title: 'Ανατολική Αφρική', countries: ['ke','ug','tz','rw','bi'] },
  { id: 'west-africa', title: 'Δυτική Αφρική', countries: ['sn','gm','gn','gw','ml'] },
  { id: 'indochina', title: 'Ινδοκίνα', countries: ['th','la','kh','vn','mm'] },
  { id: 'south-cone', title: 'Νότιος Κώνος', countries: ['ar','cl','uy','py','bo'] },
  { id: 'central-america', title: 'Κεντρική Αμερική', countries: ['gt','hn','sv','ni','cr','pa'] },
  { id: 'arabian', title: 'Αραβική Χερσόνησος', countries: ['sa','om','ae','qa','bh'] },
  { id: 'central-asia', title: 'Κεντρική Ασία', countries: ['kz','kg','uz','tj','tm'] },
  { id: 'south-asia', title: 'Νότια Ασία', countries: ['in','pk','np','bt','bd','lk'] },
];
export function puzzleForRound(index: number, focus?: string): AtlasPuzzle {
  if (index === 0 && focus) return ATLAS_PUZZLES.find(p => p.countries.includes(focus)) ?? ATLAS_PUZZLES[0];
  return ATLAS_PUZZLES[index % ATLAS_PUZZLES.length];
}
