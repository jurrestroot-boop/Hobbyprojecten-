# Bouwplan Weekplanner

## Uitgangspunten

| Keuze | Besluit |
| --- | --- |
| Vorm | PWA eerst (Chrome → toevoegen aan startscherm), later een Android-app via Capacitor |
| Agenda-koppeling | ICS-abonneerlinks |
| Uren op school | Tellen binnen de 20 uur schoolstage |
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

### Fase 4 — Externe agenda's

Per agenda een ICS-link opslaan, met één knop ophalen en als achtergrondlaag in
het weekoverzicht tonen — read-only, duidelijk onderscheiden van wat je zelf hebt
gepland. Twee praktische punten:

- Een browser mag door CORS lang niet elke ICS-URL rechtstreeks ophalen. Daarom
  komt er naast het ophalen van een URL ook een import van een `.ics`-bestand.
  In de latere Android-app vervalt die beperking en werkt de URL altijd.
- De opgehaalde afspraken worden apart bewaard van je eigen blokken, zodat een
  synchronisatie nooit je eigen planning overschrijft.

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

## Openstaande vragen

- Kloppen de standaardtijden? School donderdag 09:00–17:00, paardrijden
  19:00–21:30, Enter Breda 19:00–22:00. Aan te passen bij Instellingen.
- Kloppen de diensttijden van Evie (dag 07:00–15:30, avond 14:30–23:00, nacht
  23:00–07:15)? Met de juiste tijden scheelt dat elke week invoerwerk.
- Welke agenda's wil je inladen, en geven Delta en school daar een ICS-link voor?
