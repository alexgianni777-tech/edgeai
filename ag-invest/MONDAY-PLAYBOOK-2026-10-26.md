# AG Invest – måndagsbevakning 26 oktober 2026

## Källor och avgränsning
Filen `monday-cases-2026-10-26.json` innehåller **tre manuella, hypotetiska, villkorade** aktiecase utifrån fredagens **23 oktober** OHLC-data, senast publicerade EdgeAI-screening, bolagens Q3-besked och marknadsklimatet. Detta är **inte tre bevisat lönsamma signaler**: 80/3-gate är inte uppfylld. Det finns inga kopplade köpordrar, inga automatiska exekveringar eller aviseringar.

Måndagens faktiska pris, nyheter, spread, knockout och mini-future-utbud måste kontrolleras innan eventuell order. Om aktien öppnar bortom den tänkta nivån måste vi beräkna om entry, stop, mål, risk/reward och produktstorlek. Order får aldrig läggas baserat på fredagens produktpris som om det var dagsaktuellt.

### Tre bevakningscase
1. **HEXA B – möjlig long efter Q3:** rapport 23/10 organisk tillväxt 13% och förbättrad EBITAC-marginal. Bevaka återtest och nytt köptryck, inte impulsiv re-entry efter tidigare Hexagon-short. Källan är Hexagons officiella Q3-rapport.
2. **EQT – endast shortbevakning vid misslyckad rekyl:** svag relativ styrka och höga finansieringskostnader. Men Q3-uttalandet 15/10 beskrev **stark** kapitalanskaffning – detta är en motkraft och shortmodellerna har negativ OOS. Därför inte godkänt att shorta utan manuell bekräftelse.
3. **XOM – möjlig long i energistyrka:** ökat oljepris ger branschstöd, men kortsiktig vändrisk är hög. Q3-rapport 30/10, avsett avslut senast torsdag 29/10 – inte exponering över rapport utan separat beslut.

### Risk- och psykologi-check
`node ag-invest/risk-card.js` skriver en **illustrativ** beräkning med 12 125 SEK i referenskapital, 20% kontantallokering per trade, maximalt 4% i **planerad** kontoförlust och *exempel* på 6x effektiv hävstång. Det är **inte** en mini-future-prissättningsmodell: produktens finansieringsnivå, spreaddata, spreadförändring, valutarörelser och knockout måste modelleras med faktiska ISIN innan köp. Prisstop i underliggande aktie kan hoppas över av gap.

Innan beslut, fyll i:
- Aktuell aktiekurs och intradagstrigger verifierad?
- Mål, tidsgräns och rapportkalender fortfarande giltiga?
- Verklig mini-future: ISIN, emittent, köp/säljspread, finansiering, faktisk hävstång och knockout?
- Faktiskt stop-avstånd och kronorisk med marknadsgap?
- Tradingkapital och sammanlagd risk i korrelerade positioner?
- Är jag ostörd, fri från FOMO/revansch/tilt och kan jag följa handeln?
- Om **nej** på kritisk punkt: `AVVAKTA`.

## Long/short-konflikter
Raden `ideaRadar.conflicts` listar tickers som samtidigt ger färska long- och shortsignaler. Dessa **tas bort från båda föreslagna topplistorna** och redovisas som konflikter i Telegram. Det är inte en prognos om riktning. Historiska loggar eller färdigutvärderade signaler raderas inte.

## Makrokalender — riskhändelser samma vecka

- **27–28 oktober:** FOMC-möte; amerikanskt räntebesked onsdag 28 oktober enligt Federal Reserve. Officiell källa: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
- **28–29 oktober:** ECB:s penningpolitiska möte, följt av presskonferens torsdag 29 oktober. Officiell källa: https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.SG.html
- **29 oktober:** Boliden Q3. Den redan hållna warranten kräver en separat verifierad exitplan och är inte en ny mini-future-affär.
- **30 oktober:** Exxon Mobil Q3. XOM-caset är avsett att avslutas före rapport, och onsdagens Fed-besked kan ge anledning att avstå eller avsluta tidigare.

**Makrostyrning:** Alla tre måndagscase kräver extra riskgranskning före onsdagens räntebesked. Undvik en oplanerad overnightposition över FOMC/ECB med 4–8× hävstång. Gå hellre miste om en affär än att ta ett gap som inte ryms i riskbudgeten. Katalysatorkalendern är daterad oktober 2026 och måste uppdateras när nya händelser blir kända.

## Nästa vetenskapliga steg
Mät om psykologivarningar förbättrar nettoförväntan out-of-sample jämfört med samma idéer utan psykologivarningar, inklusive falska bortfiltreringar, affärskostnader och tidsram 2–4 dagar. Ingen optimering mot 80/3-målet med gammal data.
