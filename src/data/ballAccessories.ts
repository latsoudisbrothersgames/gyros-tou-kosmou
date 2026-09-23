/** Country specific character props. No clothing with religious meaning or human caricatures. */
export type AccessoryPosition = 'hat' | 'held' | 'badge';
export interface BallAccessory {
  kind: string;
  label: string;
  position: AccessoryPosition;
  motif: string;
  color: string;
  accent: string;
  landmark?: string;
}

// One recipe per country. The landmark column uses every miniature from landmarks.ts.
const recipes: Record<string, [AccessoryPosition, string, string, string, string, string?]> = {
  gr: ['hat','cap','ψαράδικο κασκέτο','#286e9b','#f1cf78','acropolis'],
  it: ['held','pizza','κομμάτι πίτσας','#f7c76a','#d85841','colosseum'],
  es: ['held','fan','βεντάλια φλαμένκο','#db5c67','#f3d37a','sagrada'],
  pt: ['held','tile','πλακάκι αζουλέζο','#f8faf2','#3672b0'],
  fr: ['hat','beret','μπερές','#304e8a','#e9c374','eiffel'],
  de: ['held','pretzel','πρέτσελ','#b46d39','#f7dc9d','brandenburg'],
  nl: ['hat','tulip-crown','στεφάνι με τουλίπες','#ee687c','#6bb879','windmill'],
  be: ['held','chocolate','σοκολάτα','#8b4d35','#e8b67b'],
  ch: ['held','cowbell','κουδούνι αγελάδας','#d9a453','#a95f48','matterhorn'],
  at: ['hat','alpine-cap','αλπικό καπέλο','#529177','#dfbf73'],
  no: ['held','skis','σταυρωτά σκι','#6c9dbd','#e86e61'],
  se: ['held','horse','ξύλινο αλογάκι','#db6554','#f4d27e'],
  fi: ['held','snowshoe','χιονοπέδιλο','#b5d9e1','#608c9f'],
  is: ['held','volcano','ηφαίστειο','#77838c','#f18858'],
  ie: ['held','harp','μικρή άρπα','#d6a85b','#79ba83'],
  gb: ['held','umbrella','ομπρέλα','#d65f6b','#f2d68b','bigben'],
  ca: ['held','maple','φύλλο σφενδάμου','#e76857','#f6bc6c','cntower'],
  us: ['hat','cowboy','καουμπόικο καπέλο','#b9804e','#e8cf92','liberty'],
  mx: ['hat','sombrero','σομπρέρο','#e2aa54','#df6864','chichen'],
  cr: ['held','frog','δεντροβάτραχος','#61b778','#f2c970'],
  cu: ['held','maracas','μαράκες','#e8ae5f','#da675a'],
  jm: ['held','drum','μικρό τύμπανο','#e9a75c','#69a77c'],
  br: ['held','football','μπάλα ποδοσφαίρου','#f8faf1','#64a97c','redeemer'],
  ar: ['held','football','μπάλα ποδοσφαίρου με γαλάζιες ραφές','#f8faf1','#6daacb'],
  cl: ['held','landmark','μικρό μοάι','#b49b80','#766d69','moai'],
  pe: ['hat','knit','πλεκτός σκούφος των Άνδεων','#dc6759','#f2c76f','machu'],
  co: ['held','coffee','κούπα καφέ','#f4dcc0','#9a5f3e'],
  ec: ['held','tortoise','χελώνα των Γκαλαπάγκος','#82a971','#d2b67b'],
  uy: ['held','football','μπάλα ποδοσφαίρου με ήλιο','#f8faf1','#e7bc55'],
  py: ['held','cat','λούτρινο τζάγκουαρ','#edbd72','#9d7150'],
  za: ['held','protea','άνθος πρωτέας','#eaa3a0','#6aa873'],
  ke: ['held','acacia','δέντρο ακακίας','#78aa70','#a97a52'],
  tz: ['held','mountain','χιονισμένο Κιλιμάντζαρο','#a6c7c7','#7a9c74'],
  eg: ['held','landmark','μικρή πυραμίδα','#e4bf70','#c39050','pyramids'],
  ma: ['held','lantern','πολύχρωμο φανάρι','#d09a54','#76a7a1'],
  tn: ['held','basket','καλαθάκι με ελιές','#be925e','#779b66'],
  gh: ['held','cocoa','καρπός κακάο','#b87950','#e3a568'],
  et: ['held','bean','καρπός καφέ','#a76946','#dfab76'],
  mg: ['held','lemur','λούτρινος λεμούριος','#a8a6a0','#e7d5b7'],
  ng: ['held','talking-drum','τύμπανο με κορδόνια','#b87b50','#e9c477'],
  jp: ['held','cherry','κλαδί κερασιάς','#eda9bc','#91b589','fuji'],
  cn: ['held','panda','λούτρινο πάντα','#faf7ec','#333b43','greatwall'],
  in: ['held','lotus','άνθος λωτού','#f3a6aa','#70a77e','tajmahal'],
  np: ['held','mountain','χιονισμένη κορυφή','#c5d5e1','#768fa9'],
  th: ['held','elephant','λούτρινος ελέφαντας','#b0afc7','#ecb2a5'],
  vn: ['hat','conical','κωνικό ψάθινο καπέλο nón lá','#dfbd78','#9a7856'],
  id: ['held','lizard','μικρός δράκος του Κομόντο','#9dae75','#d5b77e'],
  ph: ['held','shell','κοχύλι με μαργαριτάρι','#f3c9ae','#f7f7e7'],
  kr: ['held','paper-lantern','χάρτινο φανάρι','#eb8e79','#edd4a1'],
  sg: ['held','merlion','λιοντάρι με ουρά ψαριού','#ebdbbc','#88b5bf'],
  au: ['hat','cork-hat','καπέλο με φελλούς','#c29562','#e9c586','opera'],
  nz: ['held','kiwi','πουλί κίβι','#a27f62','#e5b679'],
  ru: ['held','matryoshka','ματριόσκα','#da736d','#f1c77f','stbasil'],
  tr: ['held','tea','ποτήρι τσαγιού','#ce7958','#e6c082','hagia'],
  jo: ['held','landmark','μικρογραφία της Πέτρας','#ce9474','#a66d60','petra'],
  ae: ['held','landmark','μικρογραφία Μπουρτζ Χαλίφα','#9bbbc2','#e4c690','burj'],
  kh: ['held','landmark','μικρογραφία Ανγκόρ Βατ','#ad9479','#d5bb87','angkor'],
  bo: ['hat','knit-bolivia','πλεκτός σκούφος των Άνδεων','#72ad9b','#ebbf69'],
  pl: ['held','pierogi','μικρό πιερόγκι','#e9d3a5','#b48666'],
  dk: ['held','turbine','ανεμογεννήτρια','#d9e8e1','#74a7b1'],
};

export const BALL_ACCESSORIES: Readonly<Record<string, BallAccessory>> = Object.fromEntries(
  Object.entries(recipes).map(([iso2, [position, motif, label, color, accent, landmark]]) => [
    iso2, { kind: `${iso2}-${motif}`, position, motif, label, color, accent, landmark },
  ]),
);
