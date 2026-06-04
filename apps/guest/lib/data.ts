import type { Loc } from './i18n';

/** Unsplash photo URL helper. */
export const IMG = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

export const PH = {
  beach: '1507525428034-b723cf961d3e',
  yoga: '1506126613408-eca07ce68773',
  diningPlate: '1414235077428-338989a2e8c0',
  spaLotion: '1540555700478-4be289fbecef',
  spaMassage: '1544161515-4ab6ce6db874',
  resortSea: '1571896349842-33c89424de2d',
  resortPool: '1582719478250-c89cae4dc85b',
  restMarina: '1551632436-cbf8dd35adfa',
  diving: '1544551763-46a013bb70d5',
  cocktail: '1470337458703-46ad1756a187',
  loungeNight: '1578474846511-04ba529f0b88',
  vineyard: '1537640538966-79f369143f8f',
  suite: '1611892440504-42a792e24d32',
  resortBldg: '1455587734955-081b22074882',
  restCandle: '1559339352-11d035aa65de',
  wineCellar: '1514933651103-005eec06c04b',
  concert: '1493225457124-a3eb161ffa5f',
  wineGlass: '1510812431401-41d2bd2722f3',
  foodPlate: '1551218808-94e220e084d2',
};

export interface Brand {
  name: string;
  sub: Loc;
  monogram: string;
  primary: string;
  primary700: string;
  secondary: string;
  accent: string;
}

export const AIDA_BRANDS: Record<string, Brand> = {
  aida: {
    name: 'AIDA Bay',
    sub: { en: 'Resort & Spa', tr: 'Resort & Spa', de: 'Resort & Spa', ru: 'Резорт и Спа' },
    monogram: 'AB',
    primary: '#A85C3C', primary700: '#8A4A30', secondary: '#2E5E58', accent: '#C2A05B',
  },
  azure: {
    name: 'Azure Sands',
    sub: { en: 'Private Resort', tr: 'Özel Resort', de: 'Private Resort', ru: 'Частный резорт' },
    monogram: 'AS',
    primary: '#2F6E78', primary700: '#235862', secondary: '#B5894E', accent: '#C9A86A',
  },
};

export const AIDA_TONIGHT = {
  id: 'tonight', photo: PH.loungeNight, ph: '--ph-night',
  eyebrow: { en: 'Tonight at the resort', tr: 'Bu akşam resortta', de: 'Heute Abend im Resort', ru: 'Сегодня в отеле' },
  title: { en: 'Sunset Jazz on the Terrace', tr: 'Terasta Gün Batımı Caz', de: 'Sunset-Jazz auf der Terrasse', ru: 'Закатный джаз на террасе' },
  sub: { en: 'A live quartet under the stars, with signature cocktails from our mixologist.', tr: 'Yıldızların altında canlı dörtlü ve miksolojistimizden imza kokteyller.', de: 'Ein Live-Quartett unter den Sternen, mit Signature-Cocktails von unserem Mixologen.', ru: 'Живой квартет под звёздами и авторские коктейли от нашего бармена.' },
  time: '21:00', place: { en: 'Horizon Terrace', tr: 'Horizon Terası', de: 'Horizon-Terrasse', ru: 'Терраса Horizon' },
  kind: 'event',
};

export interface Dining {
  id: string; type: 'restaurant' | 'bar'; photo: string; ph: string;
  cuisine: Loc; name: string; open: boolean; until: string; price: string; desc: Loc;
}
export const AIDA_DINING: Dining[] = [
  { id: 'd1', type: 'restaurant', photo: PH.restMarina, ph: '--ph-wine', cuisine: { en: 'Aegean fine dining', tr: 'Ege fine dining', de: 'Ägäische Küche', ru: 'Эгейская кухня' }, name: 'Marea', open: true, until: '23:00', price: '€€€€', desc: { en: 'Seafood and seasonal Aegean plates at the water’s edge.', tr: 'Su kenarında deniz ürünleri ve mevsimlik Ege tabakları.', de: 'Meeresfrüchte und saisonale ägäische Gerichte am Wasser.', ru: 'Морепродукты и сезонные эгейские блюда у воды.' } },
  { id: 'd2', type: 'restaurant', photo: PH.restCandle, ph: '--ph-sand', cuisine: { en: 'Anatolian grill', tr: 'Anadolu mangal', de: 'Anatolischer Grill', ru: 'Анатолийский гриль' }, name: 'Ocak', open: true, until: '22:30', price: '€€€', desc: { en: 'Wood-fire kebabs and mezze in a candle-lit courtyard.', tr: 'Mum ışığında avluda odun ateşinde kebaplar ve mezeler.', de: 'Holzfeuer-Kebabs und Mezze im kerzenbeleuchteten Innenhof.', ru: 'Кебабы на дровах и мезе во дворе при свечах.' } },
  { id: 'd3', type: 'restaurant', photo: PH.diningPlate, ph: '--ph-spa', cuisine: { en: 'Garden & raw bar', tr: 'Bahçe & raw bar', de: 'Garten & Raw Bar', ru: 'Сад и raw-бар' }, name: 'Vera', open: false, until: '12:00', price: '€€€', desc: { en: 'Plant-forward plates and cold-pressed juices among the herbs.', tr: 'Otların arasında bitki ağırlıklı tabaklar ve soğuk sıkım meyve suları.', de: 'Pflanzenbetonte Gerichte und Kaltpresssäfte zwischen Kräutern.', ru: 'Растительные блюда и свежие соки среди трав.' } },
  { id: 'd4', type: 'bar', photo: PH.cocktail, ph: '--ph-night', cuisine: { en: 'Rooftop cocktail bar', tr: 'Çatı kokteyl barı', de: 'Rooftop-Cocktailbar', ru: 'Коктейль-бар на крыше' }, name: 'Lumen', open: true, until: '01:00', price: '€€€', desc: { en: 'Signature cocktails and a horizon that melts into the sea.', tr: 'İmza kokteyller ve denize karışan bir ufuk.', de: 'Signature-Cocktails und ein Horizont, der ins Meer übergeht.', ru: 'Авторские коктейли и горизонт, тающий в море.' } },
];

export interface Spa {
  id: string; photo: string; ph: string; kind: 'treatment' | 'package'; min: number; from: number; name: Loc; desc: Loc;
}
export const AIDA_SPA: Spa[] = [
  { id: 's1', photo: PH.spaLotion, ph: '--ph-spa', kind: 'treatment', min: 80, from: 160, name: { en: 'Golden Hour Hammam Ritual', tr: 'Altın Saat Hamam Ritüeli', de: 'Golden-Hour-Hammam-Ritual', ru: 'Ритуал хаммам «Золотой час»' }, desc: { en: 'Traditional Turkish hammam, kese exfoliation and warm marble rest.', tr: 'Geleneksel Türk hamamı, kese peelingi ve sıcak mermer dinlenme.', de: 'Traditioneller türkischer Hammam, Kese-Peeling und warmer Marmor.', ru: 'Турецкий хаммам, пилинг кесе и тёплый мрамор.' } },
  { id: 's2', photo: PH.spaMassage, ph: '--ph-sand', kind: 'treatment', min: 60, from: 130, name: { en: 'Aegean Aroma Massage', tr: 'Ege Aroma Masajı', de: 'Ägäische Aroma-Massage', ru: 'Эгейский аромамассаж' }, desc: { en: 'Olive-oil massage with rosemary and lavender from our gardens.', tr: 'Bahçemizden biberiye ve lavanta ile zeytinyağı masajı.', de: 'Olivenöl-Massage mit Rosmarin und Lavendel aus unserem Garten.', ru: 'Массаж на оливковом масле с розмарином и лавандой.' } },
  { id: 's3', photo: PH.resortPool, ph: '--ph-night', kind: 'package', min: 150, from: 320, name: { en: 'Couples Retreat', tr: 'Çift Kaçamağı', de: 'Couples Retreat', ru: 'Ретрит для двоих' }, desc: { en: 'Private suite, dual massage, hammam and sparkling on the terrace.', tr: 'Özel süit, çift masaj, hamam ve terasta köpüklü.', de: 'Private Suite, Paarmassage, Hammam und Prosecco auf der Terrasse.', ru: 'Приватный сьют, парный массаж, хаммам и игристое на террасе.' } },
  { id: 's4', photo: PH.resortSea, ph: '--ph-sea', kind: 'package', min: 120, from: 240, name: { en: 'Marine Renewal', tr: 'Deniz Yenilenmesi', de: 'Marine Renewal', ru: 'Морское обновление' }, desc: { en: 'Sea-mineral wrap, thalasso pool and a guided breath session.', tr: 'Deniz minerali sargısı, talasso havuzu ve rehberli nefes seansı.', de: 'Meeresmineral-Wrap, Thalasso-Pool und geführte Atemsession.', ru: 'Обёртывание морскими минералами, талассо-бассейн и дыхательная практика.' } },
];

export interface AidaEvent {
  id: string; photo: string; ph: string; cat: string; day: string; time: string; title: Loc; place: Loc; desc: Loc;
}
export const AIDA_EVENTS: AidaEvent[] = [
  { id: 'e1', photo: PH.yoga, ph: '--ph-spa', cat: 'wellness', day: 'today', time: '07:30', title: { en: 'Sunrise Yoga by the Sea', tr: 'Deniz Kenarında Gün Doğumu Yogası', de: 'Sonnenaufgangs-Yoga am Meer', ru: 'Йога на рассвете у моря' }, place: { en: 'Beach Deck', tr: 'Plaj Güvertesi', de: 'Strand-Deck', ru: 'Пляжный дек' }, desc: { en: 'Greet the day with a slow vinyasa flow as the sun lifts over the bay. Mats and herbal tea provided.', tr: 'Güneş körfezin üzerinde yükselirken yavaş bir vinyasa akışıyla güne başlayın. Mat ve bitki çayı ikram edilir.', de: 'Begrüßen Sie den Tag mit einem ruhigen Vinyasa-Flow, während die Sonne über der Bucht aufgeht. Matten und Kräutertee inklusive.', ru: 'Встретьте день с медленной виньясой, пока солнце поднимается над заливом. Коврики и травяной чай включены.' } },
  { id: 'e2', photo: PH.diving, ph: '--ph-sea', cat: 'experience', day: 'today', time: '11:00', title: { en: 'Guided Reef Snorkel', tr: 'Rehberli Resif Şnorkeli', de: 'Geführtes Riff-Schnorcheln', ru: 'Снорклинг у рифа с гидом' }, place: { en: 'Dive Centre', tr: 'Dalış Merkezi', de: 'Tauchzentrum', ru: 'Дайв-центр' }, desc: { en: 'Explore the bay’s coves with a marine guide. All equipment included.', tr: 'Bir deniz rehberiyle körfezin koylarını keşfedin. Tüm ekipman dahildir.', de: 'Erkunden Sie die Buchten mit einem Meeresführer. Ausrüstung inklusive.', ru: 'Исследуйте бухты залива с морским гидом. Всё снаряжение включено.' } },
  { id: 'e3', photo: PH.loungeNight, ph: '--ph-night', cat: 'music', day: 'today', time: '21:00', title: { en: 'Sunset Jazz on the Terrace', tr: 'Terasta Gün Batımı Caz', de: 'Sunset-Jazz auf der Terrasse', ru: 'Закатный джаз на террасе' }, place: { en: 'Horizon Terrace', tr: 'Horizon Terası', de: 'Horizon-Terrasse', ru: 'Терраса Horizon' }, desc: { en: 'A live quartet plays standards under the stars. Signature cocktails from our mixologist all evening.', tr: 'Canlı dörtlü, yıldızların altında standartlar çalıyor. Akşam boyunca miksolojistimizden imza kokteyller.', de: 'Ein Live-Quartett spielt Standards unter den Sternen.', ru: 'Живой квартет играет джаз под звёздами. Авторские коктейли весь вечер.' } },
  { id: 'e4', photo: PH.beach, ph: '--ph-sunset', cat: 'experience', day: 'tomorrow', time: '17:30', title: { en: 'Private Sunset Catamaran', tr: 'Özel Gün Batımı Katamaranı', de: 'Privater Sunset-Katamaran', ru: 'Закатный катамаран' }, place: { en: 'Marina Pier', tr: 'Marina İskelesi', de: 'Marina-Pier', ru: 'Причал марины' }, desc: { en: 'Sail the bay as the sky turns gold. Chilled rosé and Aegean mezze on board.', tr: 'Gökyüzü altına dönerken körfezde yelken açın. Teknede soğuk rosé ve Ege mezeleri.', de: 'Segeln Sie durch die Bucht, während der Himmel golden wird.', ru: 'Прокатитесь по заливу, пока небо золотится. Охлаждённое розе и эгейские мезе на борту.' } },
  { id: 'e5', photo: PH.vineyard, ph: '--ph-wine', cat: 'culinary', day: 'tomorrow', time: '19:00', title: { en: 'Aegean Wine Tasting', tr: 'Ege Şarap Tadımı', de: 'Ägäische Weinprobe', ru: 'Дегустация эгейских вин' }, place: { en: 'Cellar Marea', tr: 'Marea Mahzeni', de: 'Weinkeller Marea', ru: 'Винный погреб Marea' }, desc: { en: 'Six regional wines guided by our sommelier, paired with artisan cheeses.', tr: 'Sommelier eşliğinde altı yöresel şarap, el yapımı peynirlerle.', de: 'Sechs regionale Weine, begleitet von unserem Sommelier und Käsespezialitäten.', ru: 'Шесть региональных вин с сомелье и ремесленными сырами.' } },
];

export interface Experience { id: string; photo: string; tag: Loc; title: Loc; meta: Loc; ref: string }
export const AIDA_EXPERIENCES: Experience[] = [
  { id: 'x1', photo: PH.beach, tag: { en: 'For you', tr: 'Size özel', de: 'Für Sie', ru: 'Для вас' }, title: { en: 'Private Sunset Catamaran', tr: 'Özel Gün Batımı Katamaranı', de: 'Privater Sunset-Katamaran', ru: 'Закатный катамаран' }, meta: { en: '2.5 hrs · from €180', tr: '2.5 saat · €180’den', de: '2,5 Std · ab €180', ru: '2.5 ч · от €180' }, ref: 'e4' },
  { id: 'x2', photo: PH.diningPlate, tag: { en: 'Chef’s table', tr: 'Şefin masası', de: 'Chef’s Table', ru: 'Стол шефа' }, title: { en: 'Aegean Tasting Menu', tr: 'Ege Tadım Menüsü', de: 'Ägäisches Degustationsmenü', ru: 'Дегустационное меню' }, meta: { en: 'Marea · 7 courses', tr: 'Marea · 7 tabak', de: 'Marea · 7 Gänge', ru: 'Marea · 7 блюд' }, ref: 'd1' },
  { id: 'x3', photo: PH.spaLotion, tag: { en: 'Spa', tr: 'Spa', de: 'Spa', ru: 'Спа' }, title: { en: 'Golden Hour Hammam', tr: 'Altın Saat Hamam', de: 'Golden-Hour-Hammam', ru: 'Хаммам «Золотой час»' }, meta: { en: '80 min · from €160', tr: '80 dk · €160’dan', de: '80 Min · ab €160', ru: '80 мин · от €160' }, ref: 's1' },
  { id: 'x4', photo: PH.vineyard, tag: { en: 'Tasting', tr: 'Tadım', de: 'Verkostung', ru: 'Дегустация' }, title: { en: 'Aegean Wine Cellar', tr: 'Ege Şarap Mahzeni', de: 'Ägäischer Weinkeller', ru: 'Винный погреб' }, meta: { en: 'Tomorrow · 19:00', tr: 'Yarın · 19:00', de: 'Morgen · 19:00', ru: 'Завтра · 19:00' }, ref: 'e5' },
];

export interface ExploreCat { id: string; photo: string; tkey: string; count: number; go: string | null; blurb: Loc }
export const AIDA_EXPLORE: ExploreCat[] = [
  { id: 'dining', photo: PH.restMarina, tkey: 'ex_dining', count: 8, go: 'dining', blurb: { en: 'Eight restaurants & bars, from Aegean fine dining to a rooftop at dusk.', tr: 'Ege fine dining’den çatıda gün batımına sekiz restoran ve bar.', de: 'Acht Restaurants & Bars, von ägäischer Küche bis Rooftop.', ru: 'Восемь ресторанов и баров — от изысканной кухни до крыши на закате.' } },
  { id: 'spa', photo: PH.spaLotion, tkey: 'ex_spa', count: 12, go: 'spa', blurb: { en: 'Hammam rituals, massages and a thalasso pool above the sea.', tr: 'Hamam ritüelleri, masajlar ve denizin üstünde talasso havuzu.', de: 'Hammam-Rituale, Massagen und ein Thalasso-Pool über dem Meer.', ru: 'Ритуалы хаммам, массажи и талассо-бассейн над морем.' } },
  { id: 'activities', photo: PH.yoga, tkey: 'ex_activities', count: 24, go: 'events', blurb: { en: 'Sunrise yoga, snorkel trips, workshops and evenings of music.', tr: 'Gün doğumu yogası, şnorkel turları, atölyeler ve müzik geceleri.', de: 'Sonnenaufgangs-Yoga, Schnorcheltrips, Workshops und Musikabende.', ru: 'Йога на рассвете, снорклинг, мастер-классы и музыкальные вечера.' } },
  { id: 'experiences', photo: PH.beach, tkey: 'ex_experiences', count: 9, go: 'events', blurb: { en: 'Private sails, chef’s tables and curated days, arranged for you.', tr: 'Özel yelkenler, şef masaları ve sizin için düzenlenen günler.', de: 'Private Segeltörns, Chef’s Tables und kuratierte Tage.', ru: 'Частные прогулки под парусом, столы шефа и дни по вашему вкусу.' } },
  { id: 'sports', photo: PH.diving, tkey: 'ex_sports', count: 16, go: null, blurb: { en: 'Tennis, padel, water sports and a sea-view fitness studio.', tr: 'Tenis, padel, su sporları ve deniz manzaralı fitness stüdyosu.', de: 'Tennis, Padel, Wassersport und ein Fitnessstudio mit Meerblick.', ru: 'Теннис, падел, водные виды спорта и фитнес-студия с видом на море.' } },
  { id: 'kids', photo: PH.resortPool, tkey: 'ex_kids', count: 11, go: null, blurb: { en: 'A supervised club, pools and play for younger guests.', tr: 'Küçük misafirler için gözetimli kulüp, havuzlar ve oyun.', de: 'Ein betreuter Club, Pools und Spiel für junge Gäste.', ru: 'Клуб под присмотром, бассейны и игры для маленьких гостей.' } },
  { id: 'facilities', photo: PH.resortBldg, tkey: 'ex_facilities', count: 14, go: null, blurb: { en: 'Beaches, pools, the marina and everything in between.', tr: 'Plajlar, havuzlar, marina ve aradaki her şey.', de: 'Strände, Pools, die Marina und alles dazwischen.', ru: 'Пляжи, бассейны, марина и всё остальное.' } },
];

export interface Notif { id: string; when: string; time: string; icon: string; unread: boolean; kind: string; title: Loc; body: Loc }
export const AIDA_NOTIFS: Notif[] = [
  { id: 'n1', when: 'today', time: '09:12', icon: 'bell', unread: true, kind: 'announce', title: { en: 'Welcome to AIDA Bay', tr: 'AIDA Bay’e hoş geldiniz', de: 'Willkommen in der AIDA Bay', ru: 'Добро пожаловать в AIDA Bay' }, body: { en: 'Your room is ready. Tap to discover what’s on today.', tr: 'Odanız hazır. Bugün neler olduğunu keşfetmek için dokunun.', de: 'Ihr Zimmer ist bereit.', ru: 'Ваш номер готов. Нажмите, чтобы узнать о событиях дня.' } },
  { id: 'n2', when: 'today', time: '12:40', icon: 'spa', unread: true, kind: 'reservation', title: { en: 'Spa booking confirmed', tr: 'Spa rezervasyonu onaylandı', de: 'Spa-Buchung bestätigt', ru: 'Спа-запись подтверждена' }, body: { en: 'Aegean Aroma Massage · today 16:00 · Spa Level −1.', tr: 'Ege Aroma Masajı · bugün 16:00 · Spa Kat −1.', de: 'Ägäische Aroma-Massage · heute 16:00.', ru: 'Эгейский аромамассаж · сегодня 16:00.' } },
  { id: 'n3', when: 'today', time: '15:05', icon: 'events', unread: false, kind: 'reminder', title: { en: 'Tonight: Sunset Jazz', tr: 'Bu gece: Gün Batımı Caz', de: 'Heute Abend: Sunset-Jazz', ru: 'Сегодня: закатный джаз' }, body: { en: 'Starts 21:00 at Horizon Terrace. Shall we save you a table?', tr: '21:00’da Horizon Terası’nda başlıyor. Size masa ayıralım mı?', de: 'Beginnt 21:00 auf der Horizon-Terrasse.', ru: 'Начало в 21:00 на террасе Horizon.' } },
  { id: 'n4', when: 'earlier', time: 'Yesterday', icon: 'bell', unread: false, kind: 'announce', title: { en: 'Beach cabanas', tr: 'Plaj kabanaları', de: 'Strand-Cabanas', ru: 'Пляжные кабаны' }, body: { en: 'Reserve a shaded cabana for tomorrow from the beach desk.', tr: 'Yarın için gölgeli bir kabanayı plaj masasından ayırtın.', de: 'Reservieren Sie für morgen eine schattige Cabana.', ru: 'Забронируйте тенистую кабану на завтра.' } },
];

export interface Concierge { id: string; label: Loc }
export const AIDA_CONCIERGE: Concierge[] = [
  { id: 'housekeeping', label: { en: 'Housekeeping', tr: 'Kat hizmetleri', de: 'Zimmerservice', ru: 'Уборка' } },
  { id: 'dining', label: { en: 'In-room dining', tr: 'Odaya servis', de: 'Zimmerservice Essen', ru: 'Ужин в номер' } },
  { id: 'taxi', label: { en: 'Arrange transfer', tr: 'Transfer ayarla', de: 'Transfer buchen', ru: 'Заказать трансфер' } },
  { id: 'amenities', label: { en: 'Bath amenities', tr: 'Banyo malzemeleri', de: 'Bad-Amenities', ru: 'Принадлежности' } },
  { id: 'wakeup', label: { en: 'Wake-up call', tr: 'Uyandırma', de: 'Weckruf', ru: 'Звонок-будильник' } },
  { id: 'dnd', label: { en: 'Do not disturb', tr: 'Rahatsız etmeyin', de: 'Nicht stören', ru: 'Не беспокоить' } },
];

export const AIDA_GUEST = {
  name: 'Elif Yılmaz', initials: 'EY', room: '412',
  roomType: { en: 'Sea View Suite', tr: 'Deniz Manzaralı Süit', de: 'Suite mit Meerblick', ru: 'Сьют с видом на море' } as Loc,
  checkin: 'May 27', checkout: 'May 31', nights: 4, tier: 'Gold', photo: PH.suite,
};

export const AIDA_WEATHER = { temp: 28, feels: 30, sea: 24, wind: 11, humidity: 46, cond: 'w_sunny' };
