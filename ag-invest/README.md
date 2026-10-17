# AG Invest – rapportjournal (v1)

Syfte: dokumentera hypoteser före rapport, undvika efterhandskonstruktion och mäta om rapportkedjor har positivt förväntat värde efter kostnader.

## Arbetsflöde
1. Registrera en kandidat **innan** en position tas. Skriv tidpunkt, källa, vad konsensus väntar sig och vad som kan falsifiera tesen.
2. Jämför minst två möjliga utfall (positivt/negativt) och marknadens förväntningar. Markera sektor-korrelation och risk för rapportgap.
3. Kontrollera aktuell kurs/tidsstämpel, IR-rapportdatum och instrumentets ISIN, spread, hävstång, knockout, förfall och likviditet. Om ej verifierat: **AVVAKTA**.
4. Registrera inträde, faktisk insats och **maximal möjlig förlust i kronor**. Ingen affär ska vara beroende av att en stoporder garanteras genom ett rapportgap.
5. Efter exit: registrera faktiskt nettoresultat inklusive avgifter och spread; följ upp om tesen eller bara kursriktningen var korrekt.
6. Granska resultaten i grupper: sektor, long/short, rapport före/efter, signaltyp och hävstång. Undvik att välja bort förlorande affärer i statistiken.

## Mätetal
- Träffsäkerhet = antal positiva nettoaffärer / alla stängda affärer.
- Genomsnittlig vinst, genomsnittlig förlust och expectancy = vinstfrekvens × genomsnittlig vinst − förlustfrekvens × genomsnittlig förlust.
- Profit factor = summa vinster / absolut summa förluster.
- Maximal drawdown på **hela portföljen** med daterade kapitalvärden.
- Exponering per sektor och korrelation mellan samtidiga positioner.
- Jämför även mot en enkel referensstrategi och mot perioder utan affärer.

## Risk och tolkning
20 % per vecka är ett **aspirationsmål**, inte en statistiskt verifierad förväntan. 100 % är ett extremt scenario, inte en normalbudget. Att en aktie rör sig 10 % och ett instrument ger 100 % betyder inte att hela portföljen gör det. Stoppar, warranter och mini futures kan ge förlust av hela insatsen. Ingen automatisk orderläggning. Ingen Replit.

## Journalformat
Använd `ag-invest/trades-template.csv`. En rad per idé/affär. Lämna okända fält tomma, aldrig påhittade värden. `status`: WATCH, READY, OPEN, CLOSED, REJECTED. `direction`: LONG eller SHORT. `decision`: AVVAKTA, KÖP, SHORT, BEHÅLL, STÄNG.
