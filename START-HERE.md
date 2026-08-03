# EdgeAI — installationsguide, klick för klick

Tid: ca 20–30 min. Kostnad: 0 kr. Ingen terminal behövs.
Efter varje steg står [✓ DU SER: ...] — stämmer det, gå vidare. Annars: stanna där.

──────────────────────────────────────────────
DEL 0 · SAMLA FILERNA  (5 min)
──────────────────────────────────────────────
0.1  Skapa en mapp på skrivbordet som heter:  edgeai
0.2  Ladda ner ALLA filer från chatten och lägg dem i mappen. Det är
     25 filer i roten:
     index.html · edgeai.html · tracker.html · manifest.json · icon.svg
     apple-touch-icon.png · build-data.js · notify.js · server.js
     data-live.js · data.js · indicators.js · metrics.js · walkforward.js
     montecarlo.js · screener.js · strategy.js · strategy-breakout.js
     strategy-bollinger.js · strategy-momentum.js · strategy-short.js
     package.json · start-windows.bat · start-mac.command · START-HERE.md
0.3  Skapa undermappen  public  och lägg  data.json  i den.
0.4  Skapa undermappen  .github  och i den  workflows  och lägg
     edgeai.yml där:   edgeai/.github/workflows/edgeai.yml
     (Windows kan bråka om punkten i ".github" — döp då mappen till
      ".github." med punkt på slutet, så tar Windows bort den sista.)

[✓ DU SER: mappen edgeai med 25 filer + public/data.json
   + .github/workflows/edgeai.yml = 27 totalt]

──────────────────────────────────────────────
DEL 1 · GITHUB DESKTOP  (5–10 min)
──────────────────────────────────────────────
1.1  Gå till  desktop.github.com  → ladda ner → installera → öppna.
1.2  Logga in med ditt GitHub-konto (alexgianni777-tech).
1.3  Meny:  File → Add Local Repository  → Choose → välj mappen edgeai.
1.4  Det står "This directory does not appear to be a Git repository"
     → klicka på blå länken  create a repository  → knappen  Create Repository.
1.5  Vänster sida listar nu alla filer med bockar.
     Nere till vänster, i fältet "Summary (required)": skriv  EdgeAI
     → klicka blå knappen  Commit to main.
1.6  Uppe i mitten: klicka  Publish repository.
     ► VIKTIGT: BOCKA UR rutan "Keep this code private"
     → klicka  Publish Repository.

[✓ DU SER: knappen har bytts till "Fetch origin" — koden ligger på GitHub]

──────────────────────────────────────────────
DEL 2 · SLÅ PÅ DATA-ROBOTEN  (3 min)
──────────────────────────────────────────────
2.1  I GitHub Desktop-menyn:  Repository → View on GitHub
     (repot öppnas i webbläsaren).
2.2  Klicka fliken  Actions  (uppe, bredvid Pull requests).
2.3  Om en gul ruta frågar: klicka
     "I understand my workflows, go ahead and enable them".
2.4  I vänsterlistan: klicka  EdgeAI daily.
2.5  Till höger: grå knapp  Run workflow  → grön knapp  Run workflow.
2.6  Vänta ca 2 min. Ladda om sidan.

[✓ DU SER: en rad med GRÖN BOCK. Roboten har hämtat riktig
   US- + OMXS30-data. (Röd? Klicka raden, skicka mig felmeddelandet.)]

──────────────────────────────────────────────
DEL 3 · SLÅ PÅ HOSTINGEN  (2 min)
──────────────────────────────────────────────
3.1  Klicka fliken  Settings  (längst till höger uppe).
3.2  Vänstermenyn: klicka  Pages.
3.3  Under "Build and deployment":
     Source:  Deploy from a branch
     Branch:  main      Mapp:  / (root)
     → klicka  Save.
3.4  Vänta 1–2 min, ladda om sidan.

[✓ DU SER: "Your site is live at
   https://alexgianni777-tech.github.io/edgeai/"  → klicka länken]

[✓ PÅ SIDAN SER DU: EdgeAI med riktiga setups och taggen "Fresh today"
   uppe till höger. Står det "DEMO DATA": vänta 2 min och ladda om —
   Pages hann före datan. Kvarstår det: kör Del 2.5 igen.]

──────────────────────────────────────────────
DEL 4 · MOBIL + JOBBDATOR  (2 min)
──────────────────────────────────────────────
4.1  Öppna adressen på mobilen och jobbdatorn (bokmärk).
4.2  Mobilen: dela-knappen → "Lägg till på hemskärmen" → Lägg till.

[✓ DU SER: EdgeAI-ikon (blå med vit blixt) på hemskärmen som
   öppnas i helskärm — som en app]

──────────────────────────────────────────────
DEL 5 · VALFRITT (kan göras när som helst senare)
──────────────────────────────────────────────
• FORMULÄRET: skapa gratis på tally.so → kopiera länken → öppna
  edgeai.html → byt raden  const FORM_URL = "..."  till din länk →
  spara → GitHub Desktop → Commit to main → Push origin.
• TELEGRAM: på GitHub: Settings → Secrets and variables → Actions →
  New repository secret → lägg in TELEGRAM_BOT_TOKEN och
  TELEGRAM_CHAT_ID → digest varje morgon.

──────────────────────────────────────────────
KLART — SÅ FUNKAR VARDAGEN
──────────────────────────────────────────────
Varje vardag ~08:00 bygger GitHub ny data → sidan uppdaterar sig själv.
Du öppnar bara appen. "Fresh today" = dagens data.
• "Validating — not enough proven edge yet" på en strategi = vakten
  gör sitt jobb på riktig data. Inte ett fel.
• Track record börjar tomt och växer varje dag.
• Dagboken sparas per enhet — exportera CSV som backup ibland.
• Ändra något senare: spara filen → GitHub Desktop → Commit → Push.

RESERVPLAN (utan GitHub, riktig data direkt lokalt):
Installera Node.js (nodejs.org, LTS) → dubbelklicka start-windows.bat
(eller start-mac.command) → sidan öppnas själv på localhost:3000.
