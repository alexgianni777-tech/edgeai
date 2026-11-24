# AG Invest – Investor B MACD 30 minuter (forskningsmodul)

**Status:** FRISTÅENDE FORSKNING, INGEN LIVE-HANDEL, INGA TELEGRAM-SIGNALER. Den här koden ändrar inte EdgeAI:s dagliga OMXS30-motor, resultatfiler, Replit-sajt eller Avanza.

## Varför separat?
EdgeAI:s ordinarie datainsamling arbetar med `interval: "1d"`. Den här modulen hämtar i stället Yahoo Finance 30-minutersstaplar för `INVE-B.ST`. Det är en separat strategi: en befintlig EdgeAI-backtest eller win rate kan **inte** användas som bevis för denna strategi.

## Fast förregistrerad första hypotes
- MACD 12/26/9 korsar upp, på stängd 30-minutersstapel.
- Kurs över EMA200, EMA200 stigande under 5 staplar.
- Inträde vid **nästa** 30-minutersstapels öppning; aldrig på signalstapelns historiskt kända stängning.
- Stop = 1,5 × ATR14; planerat brutto-R:R = 1:4.
- Long Investor B, högst en öppen position, minst 2 handelsdagar mellan affärsstart, max 50 staplar.
- 12 000 kr startkapital utan hävstång, max 1 % planerad kontorisk (exklusive stora kursgap), minimalt nominellt ordervärde 1 000 kr.
- 19 kr courtage per order och antagen spread/slippage om 5 baspunkter **per sida**. Verkliga Avanza-kostnader och fyllnader kan avvika.

## Hantering av informationsläckage och gaps
Signalen skapas av föregående **helt avslutade** stapel. Inträdet sker på nästa stapel. Ofullständiga staplar kastas bort. Stopp och mål simuleras med OHLC; om båda kan ha nåtts samma stapel antas **stopp först**. Öppningsgap fylls till öppningskurs, inte önskad stopnivå. Ingen återöppning på samma stapel som ett avslut.

Resultaten redovisas separat för de första 70 % (in-sample) och sista 30 % (out-of-sample) av tillgängliga staplar, utan parameteroptimering. Färre än 30 OOS-avslut ger status `INSUFFICIENT_OOS_TRADES`. Även 30 avslut är **inte** ett bevis för lönsamhet.

## Test och körning
Efter `npm install` i EdgeAI-projektet:

```bash
node --test research/investor-macd30.test.js
node research/investor-macd30.js
# valfritt: lokal, privat arkivering mellan körningar
node research/investor-macd30.js --archive=research/archive/inve-b-30m.json
```

30-minutershistorik från Yahoo är tidsbegränsad (vanligen omkring 60 kalenderdagar). Arkivet kan växa **om** scriptet körs regelbundet på en beständig maskin och samma fil behålls mellan körningar; GitHub Actions har inte beständig lokal lagring mellan jobb. Scriptet lägger **inte** upp Yahoo-kurser i en publik repository och har ännu ingen schemaläggning. Kontrollera datakällans användningsvillkor innan en lösning för långsiktig arkivering eller redistribution införs.

## Beslutsspärrar
Ingen produktionsintegrering, publicering, Telegram-köpsignal eller Avanza-order får ske automatiskt. Först behövs verklig körning mot Yahoo, granskning av datans färskhet, längre historik, robust OOS-validering, avgifts-/gap-känslighet och uttryckligt styrelsebeslut. Separat verifiering av att Asset Screen endast använder indexmedlemmar krävs; den publicerade Replit-appen är ännu inte renodlad.
