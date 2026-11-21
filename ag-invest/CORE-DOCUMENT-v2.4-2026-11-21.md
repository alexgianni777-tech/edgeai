# AG INVEST — CORE DOCUMENT v2.4
**Datum:** 21 november 2026 · **Giltighet:** till och med bokslutet 2030 · **Status:** beslutad konstitution från v2.3, kompletterad med verifierade tekniska ändringar och uttryckligt åtskilda forskningsregler.

> Great Defence. Stick to what you are good at. Regim före aktie, verklig nettoavkastning före snygga signaler. Inga automatiska affärer.

## 0. Version och styrhierarki

Detta dokument är AG Invests tekniska GitHub-sammanfattning av **Core v2.4**. Det fullständiga styrmandatet, inklusive ägarbeslut och historik, finns i det tidigare Core v2.3 (21 november 2026); v2.4 skärper bara kvalitetsbevis, systemgränser och driftrapportering. Vid konflikt vinner **senaste uttryckliga ägarbeslut → kontorisk/handelsstopp → v2.4:s säkerhetsspärrar → fortsatt giltiga v2.3-regler**. Varken ändrat program eller AI-genererat förslag skapar en ny risktillåtelse utan ägarbeslut.

**Statusetiketter:** **BESLUTAD** = ägarregel; **IMPLEMENTERAD** = kod på GitHub main (inte samma som verifierad produktion); **FORSKNING** = test/hypotes; **BLOCKERAD** = får inte användas som färsk handelsinformation; **PARKERAD** = tidigare eller övergiven metod.

## 1. Mål och verklighetsprövning

**BESLUTAD ambitionsriktning:** sikta på 10 % *netto* per vecka som långsiktig highscore/processambition till 2030. **20–30 % per vecka är ett hypotetiskt högriskutfall, inte en bevisad eller förväntad avkastning.** Strävan berättigar aldrig ökad insats, slopad stop, otestade modeller eller extra risk. Det primära forskningsmåttet är faktisk riskjusterad nettoavkastning och återkommande positiv expectancy i R, inte maximal skärmdumpsavkastning.

Separerat:
1. Historisk OOS-modell på *underliggande aktie* (inklusive antagna kostnader).
2. Fryst, förhandsregistrerat 50-affärers urval av signaler (inklusive AVSTÅ).
3. Verkliga nettoaffärer på mäklarkontot, avstämda mot kvitton och finansieringskostnader.

Ingen av de tre får kallas samma track record. Positiv punktuppskattning räcker inte som bevis, särskilt när osäkerhetsintervallet omfattar 0 eller signalerna är korrelerade.

## 2. Kapitalmodell och instrumentgräns

**BESLUTAD femplatstrappa:** <5 000 kr NAV innebär inga nya positioner enligt standardmodellen; 5–9 999 kr: högst 1; 10–14 999: högst 2; 15–19 999: högst 3; 20–24 999: högst 4; ≥25 000: högst 5. Under 25 000 kr eftersträvas högst cirka 5 000 kr insats per plats, efter likviditets-/courtagebuffert; från 25 000 kr högst 20 % NAV per position. Platser 1–4 avser OMXS30-bolag/index; plats 5 är villkorad och avser högst en aktie från Nasdaq 100. Kassa är tillåtet; antalet platser är ett tak, inte köptvång.

Normal maximal indikativ hävstång för nya derivatpositioner är cirka 4×. Vid NAV ≥25 000 kr är normal målrisk cirka 2 % och absolut planerad förlustrisk **högst 4 % av NAV per ny position**. Exempel: 20 % av NAV i insats × 20 % planerad instrumentsstopp = 4 % av NAV före avgifter och gaprisk. Under 25 000 kr kan ägarens förhöjda startmodell bara hanteras som ett **separat uttryckligt ägarundantag per affär** efter skriftlig riskprövning; styrelsens standardråd är att avstå från sådan koncentration.

**Stop är inte maxförlust:** gap, knockout, avsaknad av market maker, spread, courtage och finansiering kan öka faktisk förlust. Äldre 6–8-positionersmodeller, 8–10× som normal hävstång och rapporttrade-impulser får inte återinföras från äldre text.

## 3. Beslutsrätt och fem obligatoriska kontroller

Endast ägaren placerar order. Simulerade styrelsefunktioner:
- **Atlas Sterling:** tes, marknadsregim, alternativa riktningar och invalidering.
- **Eleanor Blackwood:** stop, KO/likviditet, samrisk, psykologi och riskveto.
- **Dr Victor Chen:** datatid, indikatorer, verifiering, R/R och kostnadsbas.
- **Övriga rådgivare:** invändningar, när de tillför något.
- **Ägaren:** daterad explicit sign-off, genomförande och Avanza-avstämning.

Varje ny trade kräver: tes/riktning; underliggande entry/stop/mål; tidsgräns; instrumentets spread/KO och faktisk kontorisk; korrelation; motargument; FOMO/tilt-kontroll och **uttryckligt styrelsebeslut i chatten före order**. Ingen ny order på mobilen. Ny order utan beslut stoppar nya affärer enligt Core-sanktionsmatrisen. Inga nya rapporttrades före NAV 50 000 kr enligt tidigare kvarstående mandat; manuell rapportkontroll.

## 4. Arkitektur och ansvarsfördelning

| Komponent | Avsedd uppgift | Får INTE göra |
|---|---|---|
| **GitHub / EdgeAI** | Senaste verifierade, avslutade handelsdag; OHLC, indikatorer, historiska OOS-tester, watch/qualified/unknown och 5 long/5 short-radar | Förklara felaktig data som färsk, lova avkastning, lägga order |
| **GitHub / omxs30** | Kompletterande svensk marknads- och legacy-screener | Skrivs över tyst eller blandas i EdgeAI-Top3 statistik |
| **GitHub / omxsscreener** | Källkontrollerad import, journal, faktiska nettodata och Asset Screen-gränssnitt | Uppfinna derivatnivåer eller automatiskt godkänna köp |
| **Replit Asset Screen** | Visa underliggande aktiers entry, stop, mål, R/R, trend, källtid och journal | Köra autotrading eller använda betalda Agent-/kredittjänster utan nytt uttryckligt godkännande |
| **AG Invest-styrelse / användare** | Välja mini future/warrant, faktisk risk, stop och order via mäklare | Behandla screener som köporder |

Ett sökresultat är ett *förslag* även när grunddata är korrekt. **WATCH** eller **PROMISING** betyder aldrig att en affär är godkänd. Visade derivatnivåer är uttryckligen utanför Asset Screen-scope.

## 5. Vetenskaplig evidens: ny v2.4-regel

**IMPLEMENTERAD 21 NOVEMBER 2026:** EdgeAI:s IS/OOS-tester får inte behandla ett artificiellt avslut på sista baren i ett testfönster som en genomförd trade. IS-utvärdering får inte låna framtidsdata; OOS-entréer inom ett utvärderingsfönster får senare historiska prisstaplar **bara för att avgöra exit** och inte för att välja parametrar. Ofullständiga horisonter exkluderas konservativt. Historisk expectancy, PF, sample och rankningar kan förändras.

**IMPLEMENTERAD 21 NOVEMBER 2026:** EdgeAI:s bas-etikett `VALIDATED` kräver nu att nominell OOS-`expectancyLow95 > 0`, i tillägg till tillräckligt antal affärer, positiv nettoexpectancy, PF och stabilitet över flera fönster. Detta bevisar ännu inte en portfölj-edge eftersom korrelation, multipla försök, valideringsbias, verkliga derivatkostnader och gaprisk kvarstår. Existerande hårdare `QUALIFIED_OOS`-krav är separata och får inte försvagas för att öka antalet signaler.

**FORSKNING, äldre publicerad mätning:** USA breakout OOS n=407, expectancy omkring +0,11R, PF 1,21, träffsäkerhet cirka 45–47 %, tidigare nominell 95 %-nedre gräns omkring -0,02R. Därför **inte** påvisat statistiskt positivt; värdena ska uppdateras efter ny publicerad dataset och kan inte jämställas med faktisk mini futures-netto. Svagare korta strategier som historiskt hade negativa OOS-resultat ska inte få positivt kvalitetsomdöme utan nya tester.

## 6. Datakvalitet och release-gates

Varje marknad SE respektive US använder sin egen **senaste avslutade börssession**, och index samt symboler måste vara verifierade till rätt session. Saknad Yahoo-bar fylls aldrig med påhittade OHLC eller ometiketteras som dagens pris. **STALE/HISTORICAL_ONLY** spärrar nya signaler i den marknaden. En fungerande USA-körning kan publicera verifierad USA-del även när Sverige saknas, men jobbkvaliteten ska fortfarande visa **DEGRADED**. Helg och helgdag får inte räknas som en handelsdag.

**Incident 21 november 2026:** schematisk byggning kl. 04:17 UTC fick US 20 nov men SE 19 nov (samtliga 29 aktier); ingen falsk SE-data publicerades. En senare ombyggnad hämtade US och SE 20 nov men GitHub Pages-deploy rapporterade fel vid läsning av `github-pages`-artefakt. Källkod/data, CI, Pages och faktiskt Replit-gränssnitt måste därför rapporteras **separat**, inte som en övergripande grön status.

**Releasekontroll:** 1) enhetstester och typkontroller grön; 2) aktuellt SE/US-börsdatum och källkontroll; 3) faktisk GitHub Pages-artefakt/deploy grön; 4) Replit visar samma datum och källsort; 5) inga dolda uppgraderingar eller betalda credits; 6) styrelsens läsbara ändringslogg. Om ett steg saknas: markera ofullständig leverans.

## 7. Live-tillstånd för teknikändringar 21 november 2026

- [x] **EdgeAI PR #26, main**: konservativa IS/OOS-exitfönster med nya tester. Commit `eff4947508e3b4d5e2ec5fd78773431f14a09877`.
- [x] **EdgeAI PR #27, main**: `VALIDATED` spärras om nominell 95 %-nedre OOS-gräns inte är positiv. Commit `a0363444319e61405cf11eaf1ae0064c3499c520`. Tre CI-testflöden gröna före merge.
- [x] **Asset Screen / omxsscreener PR #7, main**: import validerar senast avslutad SE/US-session och spärrar stale, inklusive normal helg-/helgdagslogik. Commit `946482ff5f645f7f7e512e32cb5403f33406f69a`. CI grön före merge.
- [ ] Verifiera produktion och Github Pages publicering, samt ny OOS-mätning efter kodändringar.
- [ ] Verifiera att Replits körande app faktiskt använder samma GitHub-version; undvik att radera manuella och legacy-kandidater.
- [ ] Följ befintliga omxsscreener PR #5/#6 separat; felande integrationstester är blockerare. Inga otestade stora feature-merges.

Ändringslogg för framtida Core-version kräver: datum, källa, ansvarig, ägarbeslut, CI, marknadstest, berörd modul, riskpåverkan och reversionsplan.

## 8. Replit free – strikt genomförandemandat

**Använd bara Replits befintliga gratisresurser.** Om en ändring kräver betald AI-Agent, credits, deployment, externa tjänster, mer driftkostnad eller annan uppgradering: **STOPPA och begär ägarbeslut**. Börja med att säkerställa om aktuell Replit-app är synkad med `omxsscreener/main` (ingen destruktiv reset). Prioritera synliga börsdatum, spärr mot inaktuell import, korrekt REAL/SIMULATED/NOT_TAKEN-separation och neutral formulering av forskning; inga köporder eller derivatmotor. Publicering kräver separat verifiering av körande app och får inte påstås vara klar enbart för att en uppdatering startats.

## 9. Revisionscykel

**Dagligen (handelsdag):** verifiera marknadsregim, källdatum, fem long/fem short *att bevaka*, verkliga rapportdatum manuellt och kandidaters stop/R/R i underliggande. Avstå när data saknas.

**Veckovis (måndag):** Avanza-netto med insättningar/uttag separat, exitdisciplin, utfall i R, vinnare/förlorare och regelbrott, marknadsregim, samrisk och öppna fel. Ingen extrapolering av veckovinst.

**Efter affär 10, 25, 50:** kontroll av förhandsregistrerade kandidater inklusive ej tagna, faktiska kostnader, wins/losses, standardfel/osäkerhet, realiserad maxdrawdown och konsekvens av olika regimer. Fortsätt forskning om edge inte håller.

**Årligen 2026–2030:** komplett bokslut och dokumenterad Core-revision. Den långsiktiga ambitionen kan vara hög; **Great Defence** begränsar alltid vad vi får riskera.

---
**Källor och revisionsspår:** [EdgeAI PR #26](https://github.com/alexgianni777-tech/edgeai/pull/26), [EdgeAI PR #27](https://github.com/alexgianni777-tech/edgeai/pull/27), [Asset Screen PR #7](https://github.com/alexgianni777-tech/omxsscreener/pull/7), [EdgeAI data incident 21/11](https://github.com/alexgianni777-tech/edgeai/actions/runs/44865342388), [EdgeAI Pages-incident](https://github.com/alexgianni777-tech/edgeai/actions/runs/44901345812). Detta offentliga GitHub-dokument ska inte innehålla verkliga Avanza-transaktioner, kontonummer, personuppgifter eller autentiseringsuppgifter.
