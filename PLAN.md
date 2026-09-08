# Bouwplan Weekplanner

## Uitgangspunten

| Keuze | Besluit |
| --- | --- |
| Vorm | PWA eerst (Chrome → toevoegen aan startscherm), later een Android-app via Capacitor |
| Agenda-koppeling | ICS-abonneerlinks |
| Uren op school | Tellen binnen de 20 uur schoolstage; de verplichte schooldagen hebben een einddatum |
| Kantoordagen | 2× per week, te kiezen uit maandag t/m donderdag |
| Evie's diensten | Dagdienst 07:00–15:30, avonddienst 13:00–21:00 |
| Opslag | Volledig lokaal (IndexedDB), geen server en geen account |

De web-app en de latere Android-app delen dezelfde code. Capacitor pakt de
`dist/`-build en verpakt die tot een APK; er hoeft dus niets herbouwd te worden.

## Fasering

### Fase 1 — Weekoverzicht en urenbalans ✅

Weekoverzicht van maandag tot en met zondag inclusief de avonden, zelf blokken
plannen, en een balans die per categorie bijhoudt hoeveel uur je nog moet
inplannen. Vaste afspraken (donderdag school, donderdagavond paardrijden, Enter
Breda op de eerste maandag) staan er vanaf de eerste start in.

### Fase 2 — Weekopzet en signalering ✅

Aan het begin van de week: je twee kantoordagen kiezen en Evie's diensten
invoeren met snelknoppen voor dag-, avond- en nachtdienst. Daarna markeert de app
per dag hoe de avond ervoor staat, en waarschuwt hij als je werk plant op een
avond die vrij was, of als je nog geen twee kantoordagen hebt gekozen.

### Fase 3 — Taken

Losse to-do's die niet aan een tijdblok hangen: "wat moet er nog gebeuren".
Koppelbaar aan een categorie en een dag, met een deadline en een afvinkstatus.
Een taak moet met één handeling een blok in je week kunnen worden.

### Fase 4 — Externe agenda's ✅

Drie agenda's — Delta, school en Smart Consultant — elk met een ICS-link. De
synchroniseerknop bovenin haalt ze alle drie op; herhalende afspraken worden
uitgeklapt en verzette of afgezegde keren gerespecteerd. Ze staan als
achtergrondlaag in het weekoverzicht en tellen niet mee in de urenbalans, maar
een avondafspraak uit werk telt wél als "jij bezet" voor de Evie-signalering.

- Een browser mag door CORS lang niet elke ICS-URL rechtstreeks ophalen. Lukt het
  ophalen niet, dan zegt de app dat en kun je per agenda een `.ics`-bestand
  importeren. In de latere Android-app vervalt die beperking.
- Opgehaalde afspraken staan apart van je eigen blokken; een synchronisatie
  overschrijft nooit je eigen planning.

### Fase 5 — Echte Android-app

Capacitor eromheen, de APK laten bouwen door GitHub Actions en downloaden op je
Pixel. Dat levert er twee dingen bij op: notificaties, en toegang tot de agenda's
die al op je telefoon gesynchroniseerd staan — mocht ICS tegenvallen.

## Wat er nu al staat

```
src/domain/    de regels: categorieën, uren, vaste afspraken, signalering
src/db/        opslag (Dexie/IndexedDB) en de weekquery
src/components/ de schermen
```

De regels zitten bewust in `src/domain/` en niet verspreid door de interface. Wat
er verandert aan je afspraken bij Delta of school, verandert daar op één plek.

## Opslag

Alles staat in IndexedDB op het toestel. Elke wijziging wordt direct
weggeschreven; er is geen opslaan-knop. De app vraagt het systeem bovendien om
de opslag als persistent te markeren, zodat die niet wordt opgeruimd bij
ruimtegebrek. Een export bij Instellingen is het vangnet.

## Openstaande vragen

- Tot welke datum lopen de verplichte schooldagen op donderdag? Zet die bij
  Instellingen → Vaste afspraken → "geldig t/m".
- Kloppen school 09:00–17:00 en paardrijden 19:00–21:30?
- Halen de drie ICS-links vanuit Chrome op, of moeten we voor sommige het
  bestand importeren tot de Android-app er is?
