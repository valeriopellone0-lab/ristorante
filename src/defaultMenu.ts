import { MenuItem } from './types';

export const DEFAULT_MENU: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // --- PRIMI PIATTI ---
  {
    name: "Pasta e patate con provola",
    description: "Pasta mista tirata a cottura lenta con patate saporite, scorza di Parmigiano e provola filante affumicata.",
    price: 9.00,
    category: "primi",
    available: true
  },
  {
    name: "Pasta e cavolo con provola",
    description: "Tubetti rigati cotti con cavolo nero saporito e provola fresca affumicata.",
    price: 9.00,
    category: "primi",
    available: true
  },
  {
    name: "Pasta e ceci",
    description: "Abbinamento classico e cremoso di pasta corta con ceci biologici, profumato al rosmarino e olio d'oliva EVO.",
    price: 8.50,
    category: "primi",
    available: true
  },
  {
    name: "Pasta e Lenticchie",
    description: "Lenticchie campagnole saporite cotte lentamente con aromi freschi dell'orto e pasta corta.",
    price: 8.50,
    category: "primi",
    available: true
  },
  {
    name: "Pasta e piselli",
    description: "Primo piatto della tradizione con piselli dolci saltati con cipolla ramata e un tocco saporito.",
    price: 8.50,
    category: "primi",
    available: true
  },
  {
    name: "Pasta e zucca",
    description: "Cremoso incontro di pasta corta con zucca dolce nostrana e spezie della nonna.",
    price: 8.50,
    category: "primi",
    available: true
  },
  {
    name: "Pasta e fagioli",
    description: "La tradizionale minestra di fagioli cannellini cotti lentamente in pentola di coccio con pasta mista.",
    price: 8.50,
    category: "primi",
    available: true
  },
  {
    name: "Bolognese",
    description: "Pasta della tradizione condita con saporito ragù a cottura lenta con carne scelta di manzo e maiale.",
    price: 9.50,
    category: "primi",
    available: true
  },
  {
    name: "Siciliana",
    description: "Mezzi rigatoni con salsa di pomodoro San Marzano, melanzane fritte croccanti, basilico e provola filante.",
    price: 9.50,
    category: "primi",
    available: true
  },
  {
    name: "Carbonara",
    description: "Spaghetti conditi con uovo cremoso, pecorino romano D.O.P. e guanciale croccante pepato.",
    price: 10.00,
    category: "primi",
    available: true
  },
  {
    name: "Amatriciana",
    description: "Rigatoni serviti con salsa di pomodoro, guanciale croccante sfumato e abbondante pecorino.",
    price: 9.50,
    category: "primi",
    available: true
  },
  {
    name: "Genovese",
    description: "Tipico condimento napoletano cotto per ore con abbondante cipolla ramata dolce e carne di manzo tenerissima.",
    price: 11.00,
    category: "primi",
    available: true
  },
  {
    name: "Puttanesca",
    description: "Spaghetti conditi con pomodorini freschi, olive nere salate, capperi di Pantelleria ed alici.",
    price: 9.50,
    category: "primi",
    available: true
  },
  {
    name: "Lardiata",
    description: "Piatto rustico campano condito con lardo di colonnata finemente battuto, pomodoro fresco e pecorino.",
    price: 9.50,
    category: "primi",
    available: true
  },
  {
    name: "Pomodoro Fresco",
    description: "Un classico intramontabile: passata di pomodoro San Marzano cotta con olio EVO e basilico fresco profumato.",
    price: 7.50,
    category: "primi",
    available: true
  },
  {
    name: "Paccheri ai frutti di mare",
    description: "Paccheri di Gragnano saltati in padella con cozze, vongole, gamberi, calamari freschi e pomodorini saporiti.",
    price: 14.00,
    category: "primi",
    available: true
  },
  {
    name: "Gnocchi alla Sorrentina",
    description: "Gnocchi di patate fatti in casa cotti al forno in tegamino di terracotta con pomodoro, provola filante e basilico.",
    price: 9.50,
    category: "primi",
    available: true
  },

  // --- SECONDI PIATTI & PIATTO RICCO ---
  {
    name: "Polpette fritte",
    description: "Sfiziose polpette nostrane di carne macinata mista frullata ed insaporita, fritte fino a perfetta doratura.",
    price: 11.50,
    category: "secondi",
    available: true
  },
  {
    name: "Polpette al sugo",
    description: "Polpette della tradizione cotte dolcemente nella nostra salsa ricca di pomodoro San Marzano fresco.",
    price: 12.00,
    category: "secondi",
    available: true
  },
  {
    name: "Cotoletta (Manzo, Pollo o Maiale)",
    description: "Cotoletta panata e dorata, preparata fresca con carne tenera a scelta dei nostri ospiti.",
    price: 12.50,
    category: "secondi",
    available: true
  },
  {
    name: "Scaloppina al limone",
    description: "Teneri straccetti saltati in burro e succo fresco di limone con carne a scelta (manzo, pollo o maiale).",
    price: 12.50,
    category: "secondi",
    available: true
  },
  {
    name: "Scaloppina al vino",
    description: "Fettina di carne a scelta (manzo, pollo o maiale) sfumata in padella con pregiato vino bianco aromatico.",
    price: 12.50,
    category: "secondi",
    available: true
  },
  {
    name: "Carne di manzo cotta ai ferri",
    description: "Fetta di manzo scelta grigliata semplicemente alla piastra caldissima e servita con olio e limone.",
    price: 14.00,
    category: "secondi",
    available: true
  },
  {
    name: "Costoletta di maiale ai ferri",
    description: "Saporita braciola di maiale con osso cotta sulla brace e speziata al rosmarino rustico.",
    price: 13.00,
    category: "secondi",
    available: true
  },
  {
    name: "Costoletta di maiale fritta con papaccelle",
    description: "Costoletta di maiale fritta in paranza e servita con le tipiche papaccelle campane sott'aceto (dolci o piccanti).",
    price: 14.50,
    category: "secondi",
    available: true
  },
  {
    name: "Salsiccia con papaccelle",
    description: "Saporite salsicce rustiche di maiale saltate in padella con le tradizionali e carnose papaccelle campane.",
    price: 13.50,
    category: "secondi",
    available: true
  },
  {
    name: "Petto di pollo alla griglia",
    description: "Tenero petto di pollo magro cotto alla piastra con aromi mediterranei ed erbette finissime.",
    price: 11.00,
    category: "secondi",
    available: true
  },
  {
    name: "Salsiccia ai ferri",
    description: "Saporite salsicce nostrane cotte sulla griglia bollente e profumate con pepe nero macinato.",
    price: 11.55,
    category: "secondi",
    available: true
  },
  {
    name: "Calamari alla griglia",
    description: "Calamari freschi cotti alla brace e rifiniti con un filo di salmoriglio di aglio, olio EVO e limone di costa.",
    price: 15.00,
    category: "secondi",
    available: true
  },
  {
    name: "Calamari fritti",
    description: "Anelli di calamari freschi leggermente infarinati e fritti in olio bollente, caldi e fragranti.",
    price: 15.00,
    category: "secondi",
    available: true
  },
  {
    name: "Pesce Spada alla griglia",
    description: "Pregiato trancio di pesce spada del Mediterraneo scottato sapientemente sulla piastra aromatica.",
    price: 16.00,
    category: "secondi",
    available: true
  },
  {
    name: "Salmone alla griglia",
    description: "Fetta di salmone atlantico cotta sulla griglia, ricca di gusto, croccante fuori e morbida all'interno.",
    price: 15.00,
    category: "secondi",
    available: true
  },
  {
    name: "Seppia alla brace",
    description: "Seppia fresca intera tenerissima, cotta alla brace e condita con prezzemolo fresco trito.",
    price: 15.00,
    category: "secondi",
    available: true
  },
  {
    name: "Tonno alla brace",
    description: "Filetto di tonno pinna gialla scottato sui ferri con crosta aromatica di sesamo.",
    price: 16.00,
    category: "secondi",
    available: true
  },
  {
    name: "Baccalà fritto",
    description: "Teneri e spessi pezzi di baccalà dissalato fritti in pastella croccante dorata della casa.",
    price: 14.00,
    category: "secondi",
    available: true
  },
  {
    name: "Baccalà alla Siciliana",
    description: "Filetto di baccalà in umido cotto stufato con pomodorini del Vesuvio, olive nere saporite, capperi e patate novelle.",
    price: 15.00,
    category: "secondi",
    available: true
  },
  {
    name: "Alici fritte croccanti",
    description: "Freschissime alici sfilettate a mano e fritte dorate in paranza calda di trattoria.",
    price: 12.00,
    category: "secondi",
    available: true
  },
  {
    name: "Alici in tortiera al forno",
    description: "Alici fresche disposte a raggiera e cotte al forno con aglio, origano fresco, limone e prezzemolo.",
    price: 12.50,
    category: "secondi",
    available: true
  },
  {
    name: "Bucatini al Coniglio (Piatto Ricco)",
    description: "Bucatini rustici conditi con il leggendario sughetto concentrato di coniglio stufato all'ischitana.",
    price: 13.50,
    category: "secondi",
    available: true
  },
  {
    name: "Linguine con Gamberoni (Piatto Ricco)",
    description: "Linguine trafilate al bronzo cotte con gamberoni succulenti sfumati al cognac e pomodorini del Golfo.",
    price: 15.00,
    category: "secondi",
    available: true
  },
  {
    name: "Paccheri al Baccalà (Piatto Ricco)",
    description: "Paccheri saltati con filetti di baccalà tenero sfilacciato, olive saporite, capperi nostrani ed erbette.",
    price: 14.50,
    category: "secondi",
    available: true
  },
  {
    name: "Paccheri alla Pescatrice (Piatto Ricco)",
    description: "Paccheri rustici mantecati con polpa fresca di rana pescatrice ricca di sapore, pomodorini e basilico.",
    price: 15.00,
    category: "secondi",
    available: true
  },
  {
    name: "Linguine con Polipetti (Piatto Ricco)",
    description: "Saporite linguine condite con sughetto ristretto di piccoli polipetti affogati e pomodoro fresco saporito.",
    price: 14.00,
    category: "secondi",
    available: true
  },
  {
    name: "Bistecca ai Ferri (Piatto Ricco)",
    description: "Taglio di bistecca accuratamente scelta frollata e cotta alla griglia con sale grosso ed olio d'oliva EVO.",
    price: 17.50,
    category: "secondi",
    available: true
  },
  {
    name: "Spigola o Orata alla griglia (Piatto Ricco)",
    description: "Spigola o Orata sfilettata e arrostita intera alla brace semplicemente con erbe aromatiche e sale marino.",
    price: 18.00,
    category: "secondi",
    available: true
  },
  {
    name: "Spigola o Orata all'acqua pazza (Piatto Ricco)",
    description: "Spigola o Orata freschissime stufate in umido con pomodorini del Vesuvio, aglio, peperoncino, prezzemolo e vino bianco.",
    price: 19.50,
    category: "secondi",
    available: true
  },

  // --- CONTORNI ---
  {
    name: "Melanzane a funghetto",
    description: "Cubetti di melanzane paesane fritte e poi saltate in padella con pomodorini freschi, aglio e basilico.",
    price: 4.50,
    category: "antipasti",
    available: true
  },
  {
    name: "Melanzane sale e pepe",
    description: "Sottili fette di melanzane grigliate sulla piastra, finite con un condimento delicato di sale, pepe nero e mentuccia cotta.",
    price: 4.00,
    category: "antipasti",
    available: true
  },
  {
    name: "Melanzane alla Parmigiana",
    description: "Genuina millefoglie di melanzane fritte, salsa di pomodoro genuina, provola affumicata campana e parmigiano.",
    price: 6.50,
    category: "antipasti",
    available: true
  },
  {
    name: "Peperoni in padella",
    description: "Peperoni gialli e rossi cotti lentamente in padella con olive nere campane, capperi ed un velo di pane grattugiato.",
    price: 4.50,
    category: "antipasti",
    available: true
  },
  {
    name: "Zucchine alla Scapece",
    description: "Zucchine tonde tagliate sottili, fritte in padella e marinate con aceto di vino, spicchi d'aglio e fresca menta piperita.",
    price: 4.50,
    category: "antipasti",
    available: true
  },
  {
    name: "Friarielli saltati",
    description: "Le tipiche cime di rapa campane saltate a fuoco vivo in padella con aglio selvatico, olio d'oliva EVO e peperoncino.",
    price: 5.00,
    category: "antipasti",
    available: true
  },
  {
    name: "Verdura all'agro (Spinaci, bietole e broccoli)",
    description: "Verdure freschissime dell'orto raccolte di stagione, bollite e servite calde con succo di limone fresco ed olio EVO.",
    price: 4.00,
    category: "antipasti",
    available: true
  },

  // --- BEVANDE / BIBITE ---
  {
    name: "Coca Cola in vetro 33cl",
    description: "La frizzante bevanda per eccellenza, servita ghiacciata in bottiglia classica di vetro.",
    price: 2.50,
    category: "bevande",
    available: true
  },
  {
    name: "Coca Cola Zero in vetro 33cl",
    description: "Il gusto inconfondibile di sempre ma con zero calorie, servita fresca in vetro.",
    price: 2.50,
    category: "bevande",
    available: true
  },
  {
    name: "Fanta in vetro 33cl",
    description: "Iconica bibita frizzante all'arancia dal sapore irresistibile saporito.",
    price: 2.50,
    category: "bevande",
    available: true
  },
  {
    name: "Sprite in vetro 33cl",
    description: "Bibita rinfrescante gassata al piacevole gusto di limone e lime, in vetro.",
    price: 2.50,
    category: "bevande",
    available: true
  },
  {
    name: "Acqua Frizzante 50cl",
    description: "Bottiglia d'acqua minerale frizzante microfiltrata fresca.",
    price: 1.50,
    category: "bevande",
    available: true
  },
  {
    name: "Acqua Naturale 50cl",
    description: "Bottiglia d'acqua minerale naturale liscia freschissima.",
    price: 1.50,
    category: "bevande",
    available: true
  },
  {
    name: "Birra Nastro Azzurro 33cl",
    description: "La celebre lagerプレミアム premium bionda italiana, dal sapore luppolato secco.",
    price: 3.00,
    category: "bevande",
    available: true
  },
  {
    name: "Birra Nastro Azzurro 66cl",
    description: "Formato grande da condividere della classica birra bionda lager rinfrescante.",
    price: 4.50,
    category: "bevande",
    available: true
  },

  // --- DOLCI ---
  {
    name: "Tiramisù della Casa",
    description: "Soffice dolce al cucchiaio con crema pasticcera al mascarpone fresca e savoiardi inzuppati nel caffè espresso napoletano.",
    price: 5.50,
    category: "dolci",
    available: true
  },
  {
    name: "Caprese al Cioccolato e Mandorle",
    description: "Torta tipica napoletana con cioccolato fondente fuso di prima scelta e finissime mandorle tostate, servita tiepida.",
    price: 6.00,
    category: "dolci",
    available: true
  },
  {
    name: "Panna Cotta al Limoncello",
    description: "Golosa panna cotta alla vaniglia selvatica arricchita con caramello concentrato aromatizzato al Limoncello di Sorrento.",
    price: 5.00,
    category: "dolci",
    available: true
  }
];
