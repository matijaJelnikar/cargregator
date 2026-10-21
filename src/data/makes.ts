// Canonical make/model taxonomy. Site adapters map these ids to each site's own codes.
// Model ids are `${makeId}-${slug}`.

export interface Model {
  id: string;
  name: string;
  /** English series name ("3 Series", "C-Class") that local sites don't use; keyword/name sites skip it. */
  series?: true;
}

export interface Make {
  id: string;
  name: string;
  models: Model[];
}

function make(id: string, name: string, models: [slug: string, name: string][]): Make {
  return {
    id,
    name,
    models: models.map(([slug, n]) => ({
      id: `${id}-${slug}`,
      name: n,
      ...(/ Series$|-Class$/.test(n) ? { series: true as const } : {}),
    })),
  };
}

export const MAKES: Make[] = [
  make("alfa-romeo", "Alfa Romeo", [["147", "147"], ["156", "156"], ["159", "159"], ["giulia", "Giulia"], ["giulietta", "Giulietta"], ["mito", "MiTo"], ["stelvio", "Stelvio"], ["tonale", "Tonale"]]),
  make("audi", "Audi", [["a1", "A1"], ["a2", "A2"], ["a3", "A3"], ["a4", "A4"], ["a4-allroad", "A4 Allroad"], ["a5", "A5"], ["a6", "A6"], ["a6-allroad", "A6 Allroad"], ["a7", "A7"], ["a8", "A8"], ["q2", "Q2"], ["q3", "Q3"], ["q4-e-tron", "Q4 e-tron"], ["q5", "Q5"], ["q7", "Q7"], ["q8", "Q8"], ["e-tron", "e-tron"], ["e-tron-gt", "e-tron GT"], ["rs3", "RS3"], ["rs4", "RS4"], ["rs6", "RS6"], ["s3", "S3"], ["tt", "TT"]]),
  make("bmw", "BMW", [["1-series", "1 Series"], ["2-series", "2 Series"], ["3-series", "3 Series"], ["4-series", "4 Series"], ["5-series", "5 Series"], ["6-series", "6 Series"], ["7-series", "7 Series"], ["8-series", "8 Series"], ["x1", "X1"], ["x2", "X2"], ["x3", "X3"], ["x4", "X4"], ["x5", "X5"], ["x6", "X6"], ["x7", "X7"], ["z4", "Z4"], ["i3", "i3"], ["i4", "i4"], ["ix", "iX"], ["ix3", "iX3"], ["m3", "M3"], ["m5", "M5"]]),
  make("byd", "BYD", [["atto-3", "Atto 3"], ["dolphin", "Dolphin"], ["seal", "Seal"], ["seal-u", "Seal U"]]),
  make("chevrolet", "Chevrolet", [["aveo", "Aveo"], ["camaro", "Camaro"], ["captiva", "Captiva"], ["corvette", "Corvette"], ["cruze", "Cruze"], ["spark", "Spark"]]),
  make("citroen", "Citroën", [["berlingo", "Berlingo"], ["c1", "C1"], ["c3", "C3"], ["c3-aircross", "C3 Aircross"], ["c4", "C4"], ["c4-picasso", "C4 Picasso"], ["c5", "C5"], ["c5-aircross", "C5 Aircross"], ["c5-x", "C5 X"], ["ds3", "DS3"], ["jumper", "Jumper"], ["jumpy", "Jumpy"], ["spacetourer", "SpaceTourer"]]),
  make("cupra", "Cupra", [["ateca", "Ateca"], ["born", "Born"], ["formentor", "Formentor"], ["leon", "Leon"], ["tavascan", "Tavascan"]]),
  make("dacia", "Dacia", [["duster", "Duster"], ["jogger", "Jogger"], ["lodgy", "Lodgy"], ["logan", "Logan"], ["sandero", "Sandero"], ["spring", "Spring"]]),
  make("ds", "DS", [["ds-3", "DS 3"], ["ds-4", "DS 4"], ["ds-7", "DS 7"]]),
  make("fiat", "Fiat", [["500", "500"], ["500x", "500X"], ["500l", "500L"], ["bravo", "Bravo"], ["doblo", "Doblò"], ["ducato", "Ducato"], ["grande-punto", "Grande Punto"], ["panda", "Panda"], ["punto", "Punto"], ["qubo", "Qubo"], ["stilo", "Stilo"], ["tipo", "Tipo"]]),
  make("ford", "Ford", [["b-max", "B-Max"], ["c-max", "C-Max"], ["ecosport", "EcoSport"], ["edge", "Edge"], ["explorer", "Explorer"], ["fiesta", "Fiesta"], ["focus", "Focus"], ["galaxy", "Galaxy"], ["ka", "Ka"], ["kuga", "Kuga"], ["mondeo", "Mondeo"], ["mustang", "Mustang"], ["mustang-mach-e", "Mustang Mach-E"], ["puma", "Puma"], ["ranger", "Ranger"], ["s-max", "S-Max"], ["tourneo-connect", "Tourneo Connect"], ["tourneo-custom", "Tourneo Custom"], ["transit", "Transit"], ["transit-connect", "Transit Connect"], ["transit-custom", "Transit Custom"]]),
  make("honda", "Honda", [["accord", "Accord"], ["civic", "Civic"], ["cr-v", "CR-V"], ["e", "e"], ["hr-v", "HR-V"], ["jazz", "Jazz"], ["zr-v", "ZR-V"]]),
  make("hyundai", "Hyundai", [["bayon", "Bayon"], ["getz", "Getz"], ["i10", "i10"], ["i20", "i20"], ["i30", "i30"], ["i40", "i40"], ["ix20", "ix20"], ["ix35", "ix35"], ["ioniq", "Ioniq"], ["ioniq-5", "Ioniq 5"], ["ioniq-6", "Ioniq 6"], ["kona", "Kona"], ["santa-fe", "Santa Fe"], ["tucson", "Tucson"]]),
  make("jaguar", "Jaguar", [["e-pace", "E-Pace"], ["f-pace", "F-Pace"], ["f-type", "F-Type"], ["i-pace", "I-Pace"], ["xe", "XE"], ["xf", "XF"], ["xj", "XJ"]]),
  make("jeep", "Jeep", [["avenger", "Avenger"], ["cherokee", "Cherokee"], ["compass", "Compass"], ["grand-cherokee", "Grand Cherokee"], ["renegade", "Renegade"], ["wrangler", "Wrangler"]]),
  make("kia", "Kia", [["carens", "Carens"], ["ceed", "Ceed"], ["ev6", "EV6"], ["ev9", "EV9"], ["niro", "Niro"], ["optima", "Optima"], ["picanto", "Picanto"], ["proceed", "ProCeed"], ["rio", "Rio"], ["sorento", "Sorento"], ["soul", "Soul"], ["sportage", "Sportage"], ["stonic", "Stonic"], ["venga", "Venga"], ["xceed", "XCeed"]]),
  make("lancia", "Lancia", [["delta", "Delta"], ["musa", "Musa"], ["ypsilon", "Ypsilon"]]),
  make("land-rover", "Land Rover", [["defender", "Defender"], ["discovery", "Discovery"], ["discovery-sport", "Discovery Sport"], ["freelander", "Freelander"], ["range-rover", "Range Rover"], ["range-rover-evoque", "Range Rover Evoque"], ["range-rover-sport", "Range Rover Sport"], ["range-rover-velar", "Range Rover Velar"]]),
  make("lexus", "Lexus", [["ct", "CT"], ["es", "ES"], ["is", "IS"], ["nx", "NX"], ["rx", "RX"], ["ux", "UX"]]),
  make("mazda", "Mazda", [["2", "2"], ["3", "3"], ["5", "5"], ["6", "6"], ["cx-3", "CX-3"], ["cx-30", "CX-30"], ["cx-5", "CX-5"], ["cx-60", "CX-60"], ["mx-30", "MX-30"], ["mx-5", "MX-5"]]),
  make("mercedes-benz", "Mercedes-Benz", [["a-class", "A-Class"], ["b-class", "B-Class"], ["c-class", "C-Class"], ["e-class", "E-Class"], ["s-class", "S-Class"], ["v-class", "V-Class"], ["cla", "CLA"], ["cls", "CLS"], ["eqa", "EQA"], ["eqb", "EQB"], ["eqc", "EQC"], ["eqe", "EQE"], ["g-class", "G-Class"], ["gla", "GLA"], ["glb", "GLB"], ["glc", "GLC"], ["gle", "GLE"], ["glk", "GLK"], ["gls", "GLS"], ["ml", "ML"], ["sl", "SL"], ["slk", "SLK"], ["sprinter", "Sprinter"], ["vito", "Vito"]]),
  make("mg", "MG", [["hs", "HS"], ["mg4", "MG4"], ["mg5", "MG5"], ["zs", "ZS"]]),
  make("mini", "MINI", [["cabrio", "Cabrio"], ["clubman", "Clubman"], ["cooper", "Cooper"], ["cooper-s", "Cooper S"], ["countryman", "Countryman"], ["one", "One"], ["paceman", "Paceman"]]),
  make("mitsubishi", "Mitsubishi", [["asx", "ASX"], ["colt", "Colt"], ["eclipse-cross", "Eclipse Cross"], ["l200", "L200"], ["lancer", "Lancer"], ["outlander", "Outlander"], ["pajero", "Pajero"], ["space-star", "Space Star"]]),
  make("nissan", "Nissan", [["ariya", "Ariya"], ["juke", "Juke"], ["leaf", "Leaf"], ["micra", "Micra"], ["navara", "Navara"], ["note", "Note"], ["pathfinder", "Pathfinder"], ["qashqai", "Qashqai"], ["x-trail", "X-Trail"]]),
  make("opel", "Opel", [["adam", "Adam"], ["agila", "Agila"], ["astra", "Astra"], ["combo", "Combo"], ["corsa", "Corsa"], ["crossland", "Crossland"], ["frontera", "Frontera"], ["grandland", "Grandland"], ["insignia", "Insignia"], ["karl", "Karl"], ["meriva", "Meriva"], ["mokka", "Mokka"], ["vectra", "Vectra"], ["vivaro", "Vivaro"], ["zafira", "Zafira"]]),
  make("peugeot", "Peugeot", [["107", "107"], ["108", "108"], ["206", "206"], ["207", "207"], ["208", "208"], ["306", "306"], ["307", "307"], ["308", "308"], ["407", "407"], ["508", "508"], ["2008", "2008"], ["3008", "3008"], ["5008", "5008"], ["partner", "Partner"], ["rifter", "Rifter"], ["expert", "Expert"], ["boxer", "Boxer"]]),
  make("polestar", "Polestar", [["2", "2"], ["3", "3"], ["4", "4"]]),
  make("porsche", "Porsche", [["718", "718"], ["911", "911"], ["boxster", "Boxster"], ["cayenne", "Cayenne"], ["cayman", "Cayman"], ["macan", "Macan"], ["panamera", "Panamera"], ["taycan", "Taycan"]]),
  make("renault", "Renault", [["arkana", "Arkana"], ["austral", "Austral"], ["captur", "Captur"], ["clio", "Clio"], ["espace", "Espace"], ["grand-scenic", "Grand Scénic"], ["kadjar", "Kadjar"], ["kangoo", "Kangoo"], ["koleos", "Koleos"], ["laguna", "Laguna"], ["master", "Master"], ["megane", "Mégane"], ["scenic", "Scénic"], ["talisman", "Talisman"], ["trafic", "Trafic"], ["twingo", "Twingo"], ["zoe", "Zoe"]]),
  make("saab", "Saab", [["9-3", "9-3"], ["9-5", "9-5"]]),
  make("seat", "SEAT", [["alhambra", "Alhambra"], ["altea", "Altea"], ["arona", "Arona"], ["ateca", "Ateca"], ["exeo", "Exeo"], ["ibiza", "Ibiza"], ["leon", "Leon"], ["mii", "Mii"], ["tarraco", "Tarraco"], ["toledo", "Toledo"]]),
  make("skoda", "Škoda", [["citigo", "Citigo"], ["elroq", "Elroq"], ["enyaq", "Enyaq"], ["fabia", "Fabia"], ["kamiq", "Kamiq"], ["karoq", "Karoq"], ["kodiaq", "Kodiaq"], ["octavia", "Octavia"], ["rapid", "Rapid"], ["roomster", "Roomster"], ["scala", "Scala"], ["superb", "Superb"], ["yeti", "Yeti"]]),
  make("smart", "smart", [["forfour", "forfour"], ["fortwo", "fortwo"], ["1", "#1"]]),
  make("subaru", "Subaru", [["brz", "BRZ"], ["forester", "Forester"], ["impreza", "Impreza"], ["legacy", "Legacy"], ["levorg", "Levorg"], ["outback", "Outback"], ["solterra", "Solterra"], ["wrx", "WRX"], ["xv", "XV"], ["crosstrek", "Crosstrek"]]),
  make("suzuki", "Suzuki", [["across", "Across"], ["baleno", "Baleno"], ["grand-vitara", "Grand Vitara"], ["ignis", "Ignis"], ["jimny", "Jimny"], ["s-cross", "S-Cross"], ["sx4", "SX4"], ["swace", "Swace"], ["swift", "Swift"], ["vitara", "Vitara"]]),
  make("tesla", "Tesla", [["model-3", "Model 3"], ["model-s", "Model S"], ["model-x", "Model X"], ["model-y", "Model Y"]]),
  make("toyota", "Toyota", [["auris", "Auris"], ["avensis", "Avensis"], ["aygo", "Aygo"], ["aygo-x", "Aygo X"], ["bz4x", "bZ4X"], ["c-hr", "C-HR"], ["camry", "Camry"], ["corolla", "Corolla"], ["gr86", "GR86"], ["hilux", "Hilux"], ["land-cruiser", "Land Cruiser"], ["prius", "Prius"], ["proace", "Proace"], ["rav4", "RAV4"], ["supra", "Supra"], ["verso", "Verso"], ["yaris", "Yaris"], ["yaris-cross", "Yaris Cross"]]),
  make("volkswagen", "Volkswagen", [["amarok", "Amarok"], ["arteon", "Arteon"], ["caddy", "Caddy"], ["california", "California"], ["crafter", "Crafter"], ["golf", "Golf"], ["golf-plus", "Golf Plus"], ["golf-sportsvan", "Golf Sportsvan"], ["id-3", "ID.3"], ["id-4", "ID.4"], ["id-5", "ID.5"], ["id-buzz", "ID. Buzz"], ["jetta", "Jetta"], ["multivan", "Multivan"], ["passat", "Passat"], ["polo", "Polo"], ["scirocco", "Scirocco"], ["sharan", "Sharan"], ["t-cross", "T-Cross"], ["t-roc", "T-Roc"], ["taigo", "Taigo"], ["tiguan", "Tiguan"], ["touareg", "Touareg"], ["touran", "Touran"], ["transporter", "Transporter"], ["up", "up!"]]),
  make("volvo", "Volvo", [["c30", "C30"], ["c40", "C40"], ["ex30", "EX30"], ["s60", "S60"], ["s90", "S90"], ["v40", "V40"], ["v50", "V50"], ["v60", "V60"], ["v70", "V70"], ["v90", "V90"], ["xc40", "XC40"], ["xc60", "XC60"], ["xc70", "XC70"], ["xc90", "XC90"]]),
];

export function findMake(id?: string): Make | undefined {
  return id ? MAKES.find((m) => m.id === id) : undefined;
}

export function findModel(makeId?: string, modelId?: string): Model | undefined {
  return modelId ? findMake(makeId)?.models.find((m) => m.id === modelId) : undefined;
}

/** "bmw-3-series" → "3-series" */
export function modelSlug(makeId: string, modelId: string): string {
  return modelId.slice(makeId.length + 1);
}
