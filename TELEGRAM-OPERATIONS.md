# EdgeAI Telegram – verifiering utan Replit eller marknadsanrop

## Varför Telegram inte skickar
GitHub Actions-körningen 2026-11-13 (run 43424880926) visade
`EDGEAI_TELEGRAM_SECRET_MISSING`. Index och aktiekurser uppdaterades,
Pages publicerades, men avisering stoppades av saknade GitHub Actions secrets
i **edgeai-repot**. Secrets i andra repos är **inte** tillgängliga här.

## Engångsinställning, i GitHub-webben
Öppna https://github.com/alexgianni777-tech/edgeai/settings/secrets/actions .
Skapa/uppdatera **Repository secrets**:
- `TELEGRAM_BOT_TOKEN` (eller äldre `TELEGRAM_TOKEN`) = bot-token från BotFather
- `TELEGRAM_CHAT_ID` = den avsedda kanalens/gruppens/chattens ID

Ange aldrig bot-token i chatten, ett issue, ett PR, eller GitHub-kod.
Om botten ska skriva i en kanal måste den ha rätt rättigheter där.
En Telegram-API-kontroll med `getChat` kan verifiera åtkomst,
men först ett faktiskt bekräftat `sendMessage` bevisar leverans.

Kör därefter GitHub Actions → **Verify EdgeAI Telegram connection
(no market data)** → Run workflow. Den kontrollen skickar inget meddelande
och hämtar **inga** Yahoo-kurser; den kräver inte Replit.

Om kontrollen är grön: starta vid behov **EdgeAI daily** manuellt
på main eller invänta den vanliga schemalagda körningen.
Den genererar data och skickar en WATCH-rapport först om minst en
marknad har komplett och verifierad data för senaste avslutade sessionen.
En grön anslutningskontroll är inte liktydigt med att en rapport nått mottagaren.
Det bevisas av `Telegram-digest bekräftad med meddelande-ID` i körningsloggen.

## Driftsignaler
- `CURRENT`: underliggande kursdag matchar senaste avslutade session
- `STALE`: historisk kursdag; ingen ny entry från den marknaden
- `EDGEAI_TELEGRAM_SECRET_MISSING`: saknade repository-secrets
- `EDGEAI_TELEGRAM_GETME_FAILED`: felaktig bot-token eller Telegram-API
- `EDGEAI_TELEGRAM_GETCHAT_FAILED`: fel chat-ID, behörighet eller Telegram-API
- `DEGRADED_DELIVERY`: minst en marknad väntar på dataleverans

Det finns ingen automatisk orderläggning eller godkännande i denna kontroll.
