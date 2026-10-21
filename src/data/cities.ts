// Bundled city list: used as search locations and to decide which countries a search circle
// reaches. Coordinates are approximate city centres; postcodes are a central one.

export interface City {
  id: string;
  name: string;
  country: string; // ISO 3166-1 alpha-2
  postcode: string;
  lat: number;
  lon: number;
}

type Row = [name: string, postcode: string, lat: number, lon: number];

function country(code: string, rows: Row[]): City[] {
  return rows.map(([name, postcode, lat, lon]) => ({
    id: `${code.toLowerCase()}-${slug(name)}`,
    name,
    country: code,
    postcode,
    lat,
    lon,
  }));
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const CITIES: City[] = [
  ...country("SI", [
    ["Ljubljana", "1000", 46.0569, 14.5058],
    ["Maribor", "2000", 46.5547, 15.6459],
    ["Celje", "3000", 46.2309, 15.2604],
    ["Kranj", "4000", 46.2389, 14.3556],
    ["Koper", "6000", 45.5481, 13.7302],
    ["Novo mesto", "8000", 45.8034, 15.1689],
    ["Nova Gorica", "5000", 45.9560, 13.6481],
    ["Murska Sobota", "9000", 46.6625, 16.1664],
    ["Ptuj", "2250", 46.4199, 15.8697],
    ["Velenje", "3320", 46.3592, 15.1103],
  ]),
  ...country("AT", [
    ["Wien", "1010", 48.2082, 16.3738],
    ["Graz", "8010", 47.0707, 15.4395],
    ["Linz", "4020", 48.3069, 14.2858],
    ["Salzburg", "5020", 47.8095, 13.0550],
    ["Innsbruck", "6020", 47.2692, 11.4041],
    ["Klagenfurt", "9020", 46.6249, 14.3050],
    ["Villach", "9500", 46.6103, 13.8558],
    ["St. Pölten", "3100", 48.2047, 15.6256],
    ["Bregenz", "6900", 47.5031, 9.7471],
    ["Wiener Neustadt", "2700", 47.8151, 16.2432],
  ]),
  ...country("DE", [
    ["München", "80331", 48.1374, 11.5755],
    ["Rosenheim", "83022", 47.8571, 12.1181],
    ["Passau", "94032", 48.5665, 13.4312],
    ["Regensburg", "93047", 49.0134, 12.1016],
    ["Augsburg", "86150", 48.3705, 10.8978],
    ["Ingolstadt", "85049", 48.7665, 11.4258],
    ["Nürnberg", "90402", 49.4521, 11.0767],
    ["Würzburg", "97070", 49.7913, 9.9534],
    ["Ulm", "89073", 48.4011, 9.9876],
    ["Stuttgart", "70173", 48.7758, 9.1829],
    ["Freiburg", "79098", 47.9990, 7.8421],
    ["Karlsruhe", "76133", 49.0069, 8.4037],
    ["Mannheim", "68159", 49.4875, 8.4660],
    ["Saarbrücken", "66111", 49.2402, 6.9969],
    ["Frankfurt am Main", "60311", 50.1109, 8.6821],
    ["Kassel", "34117", 51.3127, 9.4797],
    ["Erfurt", "99084", 50.9848, 11.0299],
    ["Leipzig", "04109", 51.3397, 12.3731],
    ["Dresden", "01067", 51.0504, 13.7373],
    ["Köln", "50667", 50.9375, 6.9603],
    ["Düsseldorf", "40213", 51.2277, 6.7735],
    ["Dortmund", "44135", 51.5136, 7.4653],
    ["Münster", "48143", 51.9607, 7.6261],
    ["Bielefeld", "33602", 52.0302, 8.5325],
    ["Hannover", "30159", 52.3759, 9.7320],
    ["Magdeburg", "39104", 52.1205, 11.6276],
    ["Berlin", "10115", 52.5200, 13.4050],
    ["Bremen", "28195", 53.0793, 8.8017],
    ["Hamburg", "20095", 53.5511, 9.9937],
    ["Kiel", "24103", 54.3233, 10.1228],
    ["Rostock", "18055", 54.0924, 12.0991],
  ]),
  ...country("HR", [
    ["Zagreb", "10000", 45.8150, 15.9819],
    ["Varaždin", "42000", 46.3044, 16.3378],
    ["Čakovec", "40000", 46.3844, 16.4339],
    ["Karlovac", "47000", 45.4929, 15.5553],
    ["Rijeka", "51000", 45.3271, 14.4422],
    ["Pula", "52100", 44.8666, 13.8496],
    ["Osijek", "31000", 45.5550, 18.6955],
    ["Slavonski Brod", "35000", 45.1603, 18.0156],
    ["Zadar", "23000", 44.1194, 15.2314],
    ["Šibenik", "22000", 43.7350, 15.8952],
    ["Split", "21000", 43.5081, 16.4402],
    ["Dubrovnik", "20000", 42.6507, 18.0944],
  ]),
  ...country("IT", [
    ["Trieste", "34121", 45.6495, 13.7768],
    ["Udine", "33100", 46.0711, 13.2346],
    ["Venezia", "30121", 45.4408, 12.3155],
    ["Padova", "35121", 45.4064, 11.8768],
    ["Verona", "37121", 45.4384, 10.9916],
    ["Bolzano", "39100", 46.4983, 11.3548],
    ["Trento", "38122", 46.0748, 11.1217],
    ["Milano", "20121", 45.4642, 9.1900],
    ["Torino", "10121", 45.0703, 7.6869],
    ["Bologna", "40121", 44.4949, 11.3426],
    ["Firenze", "50121", 43.7696, 11.2558],
    ["Roma", "00118", 41.9028, 12.4964],
    ["Napoli", "80121", 40.8518, 14.2681],
  ]),
  ...country("HU", [
    ["Budapest", "1051", 47.4979, 19.0402],
    ["Győr", "9021", 47.6875, 17.6504],
    ["Szombathely", "9700", 47.2307, 16.6218],
    ["Zalaegerszeg", "8900", 46.8417, 16.8416],
    ["Pécs", "7621", 46.0727, 18.2323],
    ["Szeged", "6720", 46.2530, 20.1414],
    ["Debrecen", "4024", 47.5316, 21.6273],
  ]),
  ...country("BE", [["Bruxelles", "1000", 50.8503, 4.3517], ["Antwerpen", "2000", 51.2194, 4.4025], ["Liège", "4000", 50.6326, 5.5797]]),
  ...country("NL", [["Amsterdam", "1011", 52.3676, 4.9041], ["Eindhoven", "5611", 51.4416, 5.4697], ["Maastricht", "6211", 50.8514, 5.6910]]),
  ...country("LU", [["Luxembourg", "1009", 49.6116, 6.1319]]),
  ...country("FR", [["Strasbourg", "67000", 48.5734, 7.7521], ["Lyon", "69001", 45.7640, 4.8357], ["Nice", "06000", 43.7102, 7.2620], ["Paris", "75001", 48.8566, 2.3522]]),
  ...country("ES", [["Barcelona", "08001", 41.3874, 2.1686], ["Madrid", "28001", 40.4168, -3.7038]]),
];

// Towns a few km inside a border, not offered as search locations. They make "does the circle
// reach this country?" measure the distance to the border rather than to the nearest big city,
// and give mobile.de anchors close to the border (the cheapest cars to bring home).
export const BORDER_TOWNS: City[] = [
  ...country("DE", [
    ["Lörrach", "79539", 47.6150, 7.6640],
    ["Konstanz", "78462", 47.6600, 9.1750],
    ["Lindau", "88131", 47.5460, 9.6840],
    ["Kempten", "87435", 47.7260, 10.3150],
    ["Oberstdorf", "87561", 47.4090, 10.2790],
    ["Füssen", "87629", 47.5700, 10.7000],
    ["Garmisch-Partenkirchen", "82467", 47.4920, 11.0950],
    ["Mittenwald", "82481", 47.4420, 11.2610],
    ["Kiefersfelden", "83088", 47.6140, 12.1880],
    ["Traunstein", "83278", 47.8680, 12.6430],
    ["Bad Reichenhall", "83435", 47.7250, 12.8770],
    ["Berchtesgaden", "83471", 47.6310, 13.0020],
    ["Freilassing", "83395", 47.8400, 12.9770],
    ["Burghausen", "84489", 48.1690, 12.8310],
    ["Simbach am Inn", "84359", 48.2660, 13.0230],
    ["Zwiesel", "94227", 49.0170, 13.2360],
    ["Furth im Wald", "93437", 49.3090, 12.8400],
  ]),
  ...country("AT", [
    ["Bleiburg", "9150", 46.5900, 14.7990],
    ["Spielfeld", "8471", 46.7080, 15.6360],
    ["Bad Radkersburg", "8490", 46.6880, 15.9880],
  ]),
  ...country("IT", [
    ["Gorizia", "34170", 45.9410, 13.6220],
    ["Tarvisio", "33018", 46.5050, 13.5780],
  ]),
  ...country("HR", [
    ["Umag", "52470", 45.4340, 13.5200],
    ["Čabar", "51306", 45.5970, 14.6430],
    ["Bregana", "10432", 45.8400, 15.6900],
  ]),
  ...country("HU", [["Lenti", "8960", 46.6240, 16.5390]]),
];

/** Every known place: search locations plus border towns. */
export const PLACES: City[] = [...CITIES, ...BORDER_TOWNS];

export const DEFAULT_CITY_ID = "si-ljubljana";

export function findCity(id?: string): City | undefined {
  return id ? CITIES.find((c) => c.id === id) : undefined;
}
