# AG INVEST — CORE DOCUMENT v2.6 · OMXS30-ONLY
> **HISTORISK VERSION:** Riskreglerna om normal hävstång 4× / villkorad upptrappning är ersatta av ägarens 25 november-beslut i [Core Document v2.7](./CORE-DOCUMENT-v2.7-2026-11-25-8X-20SL-40TP.md). Gamla regler bevaras här som historik, inte som dagens riskmandat.

**Beslut:** 23 november 2026 · **Fasstart:** 23 november 2026 · **Projektslut:** 1 januari 2030 · **Status:** OMXS30-only ersätter äldre mandat om Nasdaq 100, USA-affärer och andra svenska aktier; historik och redan genomförda affärer bevaras.

## 0. NYTT OÅTERKALLELIGT-INOM-DETTA-DOKUMENT MANDAT (kan ändras bara genom ett nytt ägarbeslut)

**AG Invest handlar och analyserar för nya affärer ENBART nuvarande indexmedlemmar i OMX Stockholm 30 (OMXS30), long eller short i underliggande eller ett kontrollerat börshandlat instrument på samma indexmedlem.** OMXS30-indexet får användas som marknadsregim, hedge- eller indexcase endast efter separat styrelsegodkännande och exakt riskprövning. Ingen ny Nasdaq 100-, amerikansk aktie-, krypto- eller icke-OMXS30-trade i AG Invest. Externa privata konton, som en privat Novo-warrant, ingår **inte** i AG Invest och får inte förväxlas med projektets resultaträkning. Tidigare historik i USA, EdgeAI, Replit och mäklarkontot **arkiveras men raderas inte**; historiska resultat får aldrig ligga kvar som nya handelskandidater.

**Senast möjliga ny prövning:** Handelsstoppet 23–27 november 2026 står fast, med undantag för riskreducerande avveckling av tidigare öppna positioner. Nya aktiva affärer först efter godkänt styrelseprotokoll 30 november eller senare.

**Primärmål:** 10 % netto per vecka är ett mycket aggressivt aspirations-/highscoremål, **inte ett avkastningslöfte eller ett krav att alltid vara investerad**. Noll affärer och kassa får förekomma. Daglig och veckovis mätning: processefterlevnad, faktisk kontoutveckling justerad för insättning/uttag, realiserade R, kostnader, maxdrawdown, plus skilda *ex ante* signalresultat för ej tagna case. Vi får inte extrapolera backtest eller en enskild veckovinst.

**OMXS30-universum:** Nasdaq Global Index Watch / officiell Nasdaq-komponentlista är sanningskälla. Per 2 november 2026 är indexmedlemmarna 30 bolag, inklusive Addtech B, Industrivärden C och Lifco B men inte automatiskt äldre screenerfavoriter som Electrolux eller Getinge. Nasdaq meddelade 23 november att Sobi ersätter Lifco **vid öppning 1 december 2026**. SKF Vertevo introduceras tillfälligt 26 november i samband med avknoppning; nyintroducerade eller tillfälliga instrument är **inte automatiskt tradebara** om verifierad full OHLC-historik/handelbarhet saknas. Datumstyrt medlemsregister och logg över avstängd data ska ersätta åldrade manuella listor. Källor: https://www.nasdaq.com/docs/global-indexes/OMXS30 och https://view.news.eu.nasdaq.com/view?id=b9f99d088ca06195b95a6c562a9649c20&lang=en&src=rss

**Hävstångstrappa – ej automatisk:** Normal övre gräns för nya affärer förblir **4×**. Möjlighet upp till **6×** får endast prövas efter minst 20 fullt journalförda och regelriktiga affärer, separat styrelsebeslut och godkänd verklig nettoexpectancy/dragdown-granskning. Möjlighet upp till **8×** får först prövas efter minst 50 jämförbara affärer, en genomgång av historisk OOS-signaldata, rimliga faktiska kostnader, 100 % processföljsamhet under en tillräcklig prövoperiod och särskild styrelseprövning av knockout-, gap- och likviditetsrisk. Inga trappsteg är garanterade eller motiverade enbart av saldo/vinstprocent. Vid behov sänks hävstången; 8× är ett **yttersta villkorat tak, inte mål eller rekommendation**.

**Riskgränsen ändras INTE:** Max **4 % av kontots aktuella nettovärde i planerad risk per affär**, dvs cirka **200 kr** vid 5 000 kr NAV. Risk inkluderar stoppens prisavstånd, spread, courtage och konservativ slippage; verklig gap-/knockoutförlust kan bli större. Högst en öppen *ny* position vid 5 000 kr, handel endast från datorn, aldrig direktorder från screener/app. Ingen rapporttrade före 50 000 kr NAV enligt gällande mandat. **En snabbare vinstkurva får aldrig motivera högre procentuell risk.** Godkännande med 6–8× kräver normalt mindre insats/ett snävare men marknadsmässigt försvarbart stopp; om normal volatilitet inte ryms ska handeln avstås, inte stoppet manipuleras.

**Varje trade:** 1) verifierad OMXS30-indexmedlem samma handelsdag 2) marknadsregim och LONG/SHORT-tes 3) aktuell kurs, inträde och invalidering i underliggande 4) stop/target/trailing med verifierad netto-R/R 5) exakta tidpunkter för entryfönster och senast planerad exit 6) instrumentvillkor (KO, finansiering, spread, kontorisk) 7) korrelation, earnings, gap, FOMO/tilt och oberoende invändningar 8) formellt beslut i ChatGPT-styrelserummet. Senare större vinst i såld aktie bevisar inte att tidigare disciplinär exit var fel.

**Sex perspektiv fram till 2030:** Alexander Giannini äger besluten; Atlas Sterling (ChatGPT) samordnar kritisk analys; Harper Stern och Eric Tao är fiktivt inspirerade rådgivarperspektiv; Eleanor ansvarar för riskveto och Victor Chen för dataverifiering. Inga fiktiva röster eller AI-agenten får lägga order eller kringgå ägarens handelsstopp.

**Teknikmandat:** `alexgianni777-tech/omxs30` är referens för daglig svensk indexscreening och komponentkontroll; `edgeai` får generera **bara nya SE/OMXS30-kandidater** (US arkiv); `omxsscreener` + Replit Asset Screen ska visa den aktiva OMXS30-universumsmängden, inte skapa nya US-positioner, men bevara äldre data och journal. All ny kod måste CI-testas och tillämpas utan betalda Replit-krediter. Data från sista avslutade svenska sessionen, inte publiceringstidpunkt, krävs. Pågående Replit-version får inte auto-publiceras före test och granskning av inloggade vyer.

**Styrningsprioritet:** Detta daterade ägarbeslut om tillåtna värdepapper och villkor för hävstång ersätter eventuella motstridiga omfattnings- och kapitaluttryck i Core v2.5 eller v2.4. Andra tidigare regler som inte står i konflikt är fortfarande giltiga.

---

## Bevarad Core v2.5 – teknik, historik och tidigare beslutsmotiveringar

**Ny fas beslutad:** 23 november 2026 · **Projektslut:** 1 januari 2030 · **Startkapital för nya experimentet:** 5 000 SEK (bokföringsmässigt separat från historiskt kontoutfall) · **Status:** ny ägarstyrd handelsfas; äldre Core v2.4 kvar som teknisk historik.

> Great Defence. Stick to what you are good at. Regim före aktie, verklig nettoavkastning före snygga signaler. Inga automatiska affärer.

## 0A. FASBESLUT — 23 NOVEMBER 2026 TILL 1 JANUARI 2030

**BESLUTAD AV ÄGAREN 23 NOVEMBER:** Detta datum markerar en uttrycklig omstart av AG Invest som **ett disciplinerat, trendföljande besluts- och lärprojekt**. Projektets slutdatum är **1 januari 2030**, då resultat och process ska utvärderas. Målet är **10 % nettoutveckling per vecka** som offensivt ambitions-/highscoremål, **inte** prognos, minimikrav på affär eller grund för att jaga förluster. Perioder i kassa och 0 % avkastning är fullt förenliga med mandatet när inga fördelaktiga setups finns. Detta är ett mycket ambitiöst, sannolikt svåruppnåeligt mål: med 5 000 kr startkapital ska **överlevnad och reproducerbar positiv nettoexpectancy** prioriteras framför tillväxtkurvans tempo.

**Kapital och redovisning:** Ny mätbas är **5 000 kr**, inte en påstådd faktisk vinst eller att gamla förluster försvinner. Ägaren har meddelat ett uttag om 3 000 kr och avser att hålla tradingbudgeten begränsad till 5 000 kr. Faktiska Avanza-saldon, öppna instrument, uttag och insättningar avstäms separat; överskott får inte automatiskt öka risktagandet. Ett eventuellt nytt tillskott om **högst 5 000 kr kring årsskiftet 2027/2028** får endast prövas efter dokumenterad processefterlevnad och riskutvärdering; **inte automatiskt** för att kompensera förluster eller uppnå veckomålet.

**Handelsstopp:** 23–27 november 2026 (hela arbetsveckan), **inga nya positioner, inga ökningar eller revanschaffärer**. Skyddande riskreduktion/avveckling av redan öppna positioner är tillåtet; stoppet innebär inte att befintlig risk lämnas obevakad. **Tidigast 30 november** får nya beslut åter prövas efter styrelsens separata genomgång; ingen automatisk återstart.

### Regim först: följa marknaden, inte önskan om att ha rätt

1. **Bullish med verifierade trend-, styrke- och prisdata:** pröva primärt long med trendens riktning.
2. **Bearish med verifierade data:** pröva short endast om inträdet inte jagar en redan översåld nedgång och instrumentets symmetriska risk är kontrollerbar; annars avstå.
3. **Sidledes/oklar regim eller osynkroniserad data:** håll kassa, invänta bekräftelse. Ingen positionsstorlek motiveras av att ”vi måste tjäna 10 %”.
4. **Exceptionellt mottrendcase:** bara genom separat kritisk styrelseprövning och explicit omprövning av sannolikhet, stopp, gap och netto-R/R; aldrig FOMO.
5. **Riktningsbyte:** efter stängd long öppnas inte short i samma underliggande på impuls. Ny, oberoende tes, nytt dataunderlag och nytt styrelsebeslut krävs; som disciplinär standard minst 24 timmars avstånd när det är praktiskt möjligt. Detsamma gäller short→long.

### Varje affär ska ha en fullständig plan FÖRE order

**Obligatorisk handelsjournal med förregistrerat beslut:**
- **Varför nu?** Marknadsregim (index/SMA50/SMA200 eller annan på förhand definierad trendmetod), katalysator, relativ styrka, fundamenta och vad som talar emot.
- **Vilken riktning?** LONG eller SHORT i **underliggande**; instrumentet väljs därefter, utan att en mini future får styra grundtesen.
- **Vilken tidshorisont?** Exakt datum/tid för entryfönster, avsedd hålltid, sista dag/tid för exit och regler för uteblivet inträde.
- **Vilka nivåer?** Aktuell verifierad kurs och datadag; inträdesvillkor, initial stopp/invalidering, första skyddsnivå, huvudsakligt mål, eventuellt förregistrerad trailing-regel.
- **Vilken risk?** Planerad förlust i SEK och % av *aktuell faktisk* NAV inklusive courtage, spread och antagen slippage; knockout/finansiering/gaprisk; korrelation och portföljens sammantagna risk.
- **Vilken edge?** Nettorisk/reward och alternativscenario; signalens status WATCH/PROMISING/VALIDATED ska vara verifierad och aldrig säljas som sannolikhet eller garanti. Förväntan ska prövas mot historiska signaler och oberoende OOS där möjligt.
- **När ger vi upp?** Exakt vad som falsifierar tesen och hur innehavet avslutas även om det är rött; **stoppar vidgas aldrig för att undvika realiserad förlust**.
- **Psykologisk grind:** ”Skulle jag ta denna affär om gårdagens missade vinst/förlust inte hade inträffat?” Vid nej eller osäkerhet: AVSTÅ.
- **Godkännande:** Atlas, Eleanor, Victor, Harper och Eric gör separata kritiska bedömningar; ägaren fattar ett daterat uttryckligt styrelsebeslut före order. Ett positivt screenerresultat eller en analytikerrekommendation räcker inte.

### Risktrappa och incitament

**Basregel vid 5 000 kr:** högst **en** ny position samtidigt; max **4 % planerad förlustrisk per trade**, initialt högst **200 kr** före förändring i NAV, med tydligt tillägg för avgifter och antagen slippage. Vid större osäkerhet rekommenderas lägre risk eller ingen affär. Hävstång normalt **högst omkring 4×**, aldrig som krav eller automatiskt val; knockout och gap kan ge större verklig förlust än den planerade. Inga nya rapporttrades före 50 000 kr NAV enligt gällande tidigare regel. Ingen order på mobilen. Bara ägaren verkställer.

**Positiv asymmetri:** en liten grön procentsiffra är inte skäl att rutinmässigt sälja vinnaren, och ett rött inköpspris är inte skäl att flytta stopp längre bort. Förvaltningen av vinnare (delvinst/trailing) och förlustexit ska vara definierad **före** ordern och bedömas på utfall i **R**, inte på hur det känns i stunden.

**Handelsstoppets framgångskriterium:** den 30 november prövas framför allt om reglerna har följts. De första minst 20–30 förregistrerade affärsbesluten mäter disciplin; 50+ verkligt jämförbara observationer samt OOS- och kostnadsanalys behövs innan statistiska edge-anspråk. Varje vecka rapporteras **två separata scorecards**: (A) process/regeluppfyllelse och (B) verklig avkastning netto justerad för insättningar/uttag. En uppgång som nås genom regelbrott är **inte godkänd process**, och en förlust som följer full plan kan vara **godkänd process**.

### Lärdomen från Harper Stern – analys, inte manipulation

Inspiration från *Industry*: Harpers omfattande Pierpoint-banktes byggdes kring strukturella balansräknings- och finansieringssvagheter och ett sätt att positionera sig mot marknadens konsensus; serien visar samtidigt stora risker och etiskt otillåtna informationsmetoder. AG Invest tar till sig **oberoende tes, tydlig katalysator, tidsplan, positionering och motargument** – **aldrig** insiderinformation, marknadsmanipulation, outsized blankning eller blind tro på en dramatisk tv-affär. **Long är lika legitimt som short när marknaden stödjer det.**

**Beslutsmotto:** *Great Defence. Stick to what you are good at. Follow the market, not the emotion. No trade without a thesis, invalidation and end date.*

## 0. Version och styrhierarki

Detta dokument är **Core v2.5**, där fasbeslutet från 23 november 2026 har företräde framför äldre målhorisonter och kapitalmandat. Den efterföljande teknikhistoriken från v2.4 bevaras för spårbarhet. Det fullständiga styrmandatet, inklusive ägarbeslut och historik, finns i det tidigare Core v2.3 (21 november 2026); v2.4 skärper bara kvalitetsbevis, systemgränser och driftrapportering. Vid konflikt vinner **fasbeslutet 23 november 2026 och senare uttryckliga ägarbeslut → kontorisk/handelsstopp → v2.4:s säkerhetsspärrar → fortsatt giltiga v2.3-regler**. Varken ändrat program eller AI-genererat förslag skapar en ny risktillåtelse utan ägarbeslut.

**Statusetiketter:** **BESLUTAD** = ägarregel; **IMPLEMENTERAD** = kod på GitHub main (inte samma som verifierad produktion); **FORSKNING** = test/hypotes; **BLOCKERAD** = får inte användas som färsk handelsinformation; **PARKERAD** = tidigare eller övergiven metod.

## 1. Mål och verklighetsprövning

**BESLUTAD ambitionsriktning (förtydligad 23 NOV):** sikta på 10 % *netto* per vecka som extremt ambitiöst highscore-mål till **projektslut 1 januari 2030**, utan krav på affär varje vecka. **20–30 % per vecka är ett hypotetiskt högriskutfall, inte en bevisad eller förväntad avkastning.** Strävan berättigar aldrig ökad insats, slopad stop, otestade modeller eller extra risk. Det primära forskningsmåttet är faktisk riskjusterad nettoavkastning och återkommande positiv expectancy i R, inte maximal skärmdumpsavkastning.

Separerat:
1. Historisk OOS-modell på *underliggande aktie* (inklusive antagna kostnader).
2. Fryst, förhandsregistrerat 50-affärers urval av signaler (inklusive AVSTÅ).
3. Verkliga nettoaffärer på mäklarkontot, avstämda mot kvitton och finansieringskostnader.

Ingen av de tre får kallas samma track record. Positiv punktuppskattning räcker inte som bevis, särskilt när osäkerhetsintervallet omfattar 0 eller signalerna är korrelerade.

## 2. Kapitalmodell och instrumentgräns

**BESLUTAD femplatstrappa:** <5 000 kr NAV innebär inga nya positioner enligt standardmodellen; 5–9 999 kr: högst 1; 10–14 999: högst 2; 15–19 999: högst 3; 20–24 999: högst 4; ≥25 000: högst 5. Under 25 000 kr eftersträvas högst cirka 5 000 kr insats per plats, efter likviditets-/courtagebuffert; från 25 000 kr högst 20 % NAV per position. Platser 1–4 avser OMXS30-bolag/index; plats 5 är villkorad och avser högst en aktie från Nasdaq 100. Kassa är tillåtet; antalet platser är ett tak, inte köptvång.

Normal maximal indikativ hävstång för nya derivatpositioner är cirka 4×. Vid NAV ≥25 000 kr är normal målrisk cirka 2 % och absolut planerad förlustrisk **högst 4 % av NAV per ny position**. Exempel: 20 % av NAV i insats × 20 % planerad instrumentsstopp = 4 % av NAV före avgifter och gaprisk. Under 25 000 kr kan ägarens förhöjda startmodell bara hanteras som ett **separat uttryckligt ägarundantag per affär** efter skriftlig riskprövning; styrelsens standardråd är att avstå från sådan koncentration.

**Stop är inte maxförlust:** gap, knockout, avsaknad av market maker, spread, courtage och finansiering kan öka faktisk förlust. Äldre 6–8-positionersmodeller, 8–10× som normal hävstång och rapporttrade-impulser får inte återinföras från äldre text.

## 0B. Styrelsesammansättning – fastställs för projektfasen till 1 januari 2030

**ÄGARBESLUT 23 NOVEMBER 2026:** AG Invest har följande sex styrelse-/rådgivarperspektiv för hela projektet fram till slututvärderingen **1 januari 2030**, om ägaren inte uttryckligen beslutar annorlunda:

| Namn | Roll och ansvar |
|---|---|
| **Alexander Giannini** | Verklig ägare, VD och enda person som får fatta slutligt orderbeslut eller verkställa order |
| **Atlas Sterling (ChatGPT)** | Digital styrelseordförande/huvudstrateg, samordnar tes, marknadsregim, kritisk analys och protokoll; inga egna handelsbefogenheter |
| **Harper Stern** | Simulerat rådgivarperspektiv med inspiration från den fiktiva *Industry*-karaktären: oberoende marknadstes, momentum, relativ styrka, motsatt konsensus och disciplin |
| **Eric Tao** | Simulerat rådgivarperspektiv med inspiration från den fiktiva *Industry*-karaktären: exekvering, likviditet, positionering, derivatmekanik och praktiskt riskgenomförande |
| **Eleanor** | Riskchef: riskveto, kontoexponering, korrelation, stops, kapitalförsvar och disciplin |
| **Victor Chen** | Analyschef: källkvalitet, verifierade data, vetenskaplig evidens, OOS och efterhandsutvärdering |

**Viktig gräns:** Harper och Eric är fiktiva rollperspektiv, inte verkliga medverkande eller rådgivare; Atlas Sterling, Eleanor och Victor är simulerade AI-röster. Endast Alexander har faktisk beslutsrätt. Styrelsens uppgift är att **utmana, inte bekräfta önskade svar**, och att redovisa invändningar oavsett vem som föreslog affären. Ingen av sex rösterna får kringgå handelsstopp, kapitalregler eller efterhandskontroll.

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

**Incident 21 november 2026:** schematisk byggning kl. 04:17 UTC fick US 20 nov men SE 19 nov (samtliga 29 aktier); ingen falsk SE-data publicerades. En senare ombyggnad hämtade US och SE 20 nov men GitHub Pages-deploy rapporterade fel vid läsning av `github-pages`-artefakt. Källkod/data, CI, Pages och faktiskt Replit-gränssnitt måste därför rapporteras **separat**, inte som en övergripande grön status. **Senare driftverifiering samma dag:** körning [#44901620191](https://github.com/alexgianni777-tech/edgeai/actions/runs/44901620191) lyckades inklusive Pages-deploy. Nuvarande publicerade data är SE och US per avslutad session 20 november 2026. Efter den hårdare evidensspärren är 0 strategier bas-kvalificerade i respektive marknad; \`combined n=0 / 0R\` betyder **ingen kvalificerad modell att slå ihop**, inte att handelns verkliga avkastning är noll. USA breakout rapporteras som \`PROMISING\` (cirka +0,11R, PF 1,21, n=407), inte \`VALIDATED\`. Replit-synk och verklig derivatnetto är fortfarande separat ej verifierade.

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

### Verifierat CI-genombrott i GitHub, 21 november 2026

**IMPLEMENTERAD i utvecklingsgren, inte publicerad:** [Asset Screen PR #9](https://github.com/alexgianni777-tech/omxsscreener/pull/9) har verifierats med en isolerad CI-databas och squash-mergeats in i `feature/asset-screen-2-0` (commit `212aeeabcc2ab895fa3c43eeba924385eba5336e`). En riktig databehandlingsbrist identifierades och rättades: `buildRevisionInputs` tappade värdet för verifierad **underliggande ATR** när revisionskandidater byggdes, så kvalificering kunde falla i WATCH trots korrekt ursprunglig information.

**VERIFIERAD – isolerad GitHub CI:** [run 44920029889](https://github.com/alexgianni777-tech/omxsscreener/actions/runs/44920029889) och tillhörande PR-kontroll passerade. API: 260 tester, 259 PASS, 0 FAIL, 1 SKIP. Screener: 140 tester, 140 PASS, 0 FAIL. TypeScript-typkontroll, migrationskontroll och produktionsbygge PASS. Test-fixturer har uppdaterats för verifierade aktiesymboler, senaste marknadsdatum, ATR och SMA-indexregim. Styrelsens obligatoriska ordergranskning bevaras: screening kan vara APPROVED medan handelsstatus förblir WAIT med `BOARD REVIEW REQUIRED`. De nio tidigare CI-felen är alltså lösta i denna **GitHub-testade gren**.

**BLOCKERAD – Replit och faktisk publicering:** Replit uppger lokal commit `ad0724149ded20ce35630941a8b4a2ac04a5dee6` för sessionsfärskhet; vid senaste statuskontroll var den **inte pushad**, full Replit-testkörning saknades och ingen ny publicering hade skett. Att GitHub CI är grönt bevisar inte att lokala Replit-ändringar är synkade eller att inloggade produktionsvyer fungerar. Synka med ny verifierad GitHub-commit utan att tappa lokal kod, därefter testa kalender, datastale, import, journal och inloggat UI. Publicera bara efter separat verifiering och utan betalda Replit-krediter.

## 8B. Uppföljning: Replit-gren kräver separat färskhetsrättning

**Verifierat vid källkodsgranskning 21 november 2026:** Replits arbetsgren `feature/asset-screen-2-0` ligger långt före `omxsscreener/main` i funktioner men saknar main-grenens nya börssessionskontroll. I arbetsgrenen använder EdgeAI-importen ännu rapportens `generatedAt` och föregående-handelsdag-logik för godtagande, i stället för individuell verifiering av SE/US `dataAsOf` och indexsession. Replit-Agentens tidigare muntliga påstående att exakt samma sessionsspärr redan fanns i arbetskoden räcker därför inte som verifiering.

**BLOCKERAD tills test:** För inte över hela main eller feature blint; bevara befintlig journal, användarkonton och tidigare kandidater. Synka bara säkrade delar av börssessionskontrollen och testa tidszoner, helgdagar, marknadsspecifik stale-data och `force`-import innan någon publicering. Tidigare nio CI-fel är nu avhjälpta och full GitHub CI är grön efter PR #9. Detta verifierar fortfarande **inte** Replits lokala, opushade färskhetsändring eller live-versionen.

**Kostnadsvillkor:** ändringar i Replit genomförs endast inom redan tillgängliga gratisresurser. Om kostnadsfrihet eller tjänstens gratisgräns inte kan bekräftas: avstå från betald körning och dokumentera vad som återstår.

## 9. Revisionscykel

**Dagligen (handelsdag):** verifiera marknadsregim, källdatum, fem long/fem short *att bevaka*, verkliga rapportdatum manuellt och kandidaters stop/R/R i underliggande. Avstå när data saknas.

**Veckovis (måndag):** Avanza-netto med insättningar/uttag separat, exitdisciplin, utfall i R, vinnare/förlorare och regelbrott, marknadsregim, samrisk och öppna fel. Ingen extrapolering av veckovinst.

**Efter affär 10, 25, 50:** kontroll av förhandsregistrerade kandidater inklusive ej tagna, faktiska kostnader, wins/losses, standardfel/osäkerhet, realiserad maxdrawdown och konsekvens av olika regimer. Fortsätt forskning om edge inte håller.

**Årligen 2026–2030:** komplett bokslut och dokumenterad Core-revision. Den långsiktiga ambitionen kan vara hög; **Great Defence** begränsar alltid vad vi får riskera.

---
**Källor och revisionsspår:** [EdgeAI PR #26](https://github.com/alexgianni777-tech/edgeai/pull/26), [EdgeAI PR #27](https://github.com/alexgianni777-tech/edgeai/pull/27), [Asset Screen PR #7](https://github.com/alexgianni777-tech/omxsscreener/pull/7), [EdgeAI data incident 21/11](https://github.com/alexgianni777-tech/edgeai/actions/runs/44865342388), [EdgeAI Pages-incident](https://github.com/alexgianni777-tech/edgeai/actions/runs/44901345812). Detta offentliga GitHub-dokument ska inte innehålla verkliga Avanza-transaktioner, kontonummer, personuppgifter eller autentiseringsuppgifter.
