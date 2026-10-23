# AG Invest | Marknadspsykologi & long/short-radar

## Detta är **inte CNN Fear & Greed**
`market-psychology.js` räknar en tydligt märkt, egen **PRICE_BREADTH_PROXY**, 0–100, från föregående avslutade handelsdags data (samma dag för index och samtliga beståndsdelar). Ingen extern CNN-källa låtsas vara ansluten. En ofullständig marknad eller färre än fem jämförbara aktier ger UNKNOWN i stället för en påhittad siffra.

Sex lika viktade delkomponenter på 0–100:
1. Index 20-dagars momentum.
2. Index drawdown mot senaste 63 handelsdagarnas högsta.
3. Index kortsiktiga volatilitet relativt tidigare 100 dagar.
4. Andel aktier över SMA200.
5. Andel aktier med positiv utveckling senaste 20 handelsdagarna.
6. Indexläge relativt SMA50/SMA200.

Gränser (heuristik, ej optimerade eller validerade): <=25 EXTREME_FEAR, 26–40 FEAR, 41–59 NEUTRAL, 60–74 GREED, >=75 EXTREME_GREED. Siffrorna är **marknadspositionering, inte prediktioner**; jämför inte numeriskt med CNN:s Fear & Greed.

### Hur påverkar psykologi idéerna?
- **Fear + short:** varning för att jaga ett redan stort kursfall. Invänd en ny rekyl mot motstånd eller en färsk bekräftad setup.
- **Fear + long:** mottrend och rebound-fälla; kräv trendvändning, inte bara låg RSI.
- **Greed + long:** varning för FOMO / utsträckt rally; köp inte utan plan för stop/target.
- **Greed + short:** squeezrisk; hög värdering är inte en entry.
- >8% positiv rörelse på fem sessioner för long: jaga inte styrka utan entrybekräftelse. >8% negativ rörelse inför short: jaga inte fallet.
- Signaler som är äldre än två avslutade sessioner exkluderas från **färska radarlistan**. Övriga setups sparas i EdgeAI för statistik och analys.

Separat `ideaRadar.long` och `ideaRadar.short` visar högst tre **färska, icke-dubblerade WATCH-idéer per marknad**. Urvalets ranking är en heuristik, inte backtestad edge. Radar skapar inga köpordrar och höjer inte en underkänd strategi till kvalificerad. Den redan införda 80%/3R-gränsen gäller oförändrat för `validatedEdge`.

### Människans psykologi: manuell kontroll före varje trade
Fyll i eller säg till Atlas före köp: Finns komplett plan (entry, stop, mål, katalysator, rapportdatum och maxtid)? Är jag distraherad, tiltad, revanschsugen eller driven av FOMO? Kan jag följa positionen eller är skyddande order kontrollerad? `assessTraderReadiness(flags)` ger `PAUSE` vid negativa självrapporterade tillstånd. **Inga personliga tillstånd går att avläsa från prisdata**, så detta är inte en automatisk börssignal.

### Ansvar/avgränsningar
- Aktiekursbaserad stop och mål är **inte** mini futurens pris. Kontrollera emittent, köp/säljspread, finansieringsnivå, knock-out, gap och aktuell hävstång manuellt.
- 4–8× normal hävstång och högst 4× på rapporttrade är användarens övre ramar, inte standardstorlekar. Fokusera på 2–4 dagars innehav; maximalt tre veckor.
- Sentimentvarningar **överlagras efter** valideringen och har inte bevisad positiv nettoedge. Testa den inkrementella nyttan i ett separat forward-/OOS-försök och inkludera missade affärer, spread och gap.
- Både Telegram (samma befintliga utskick, inga extra) och `public/data.json` visar psykologin med rätt källa. Ingen Replit-körning krävs för denna kodändring.
