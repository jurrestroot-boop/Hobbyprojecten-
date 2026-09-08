# Weekplanner

Persoonlijke weekplanner voor Jurre: projectopdracht, stageopdracht, kantoordagen in
Middelburg en de avonden met Evie in één overzicht. Draait volledig lokaal op je
telefoon — geen server, geen account, geen internetverbinding nodig.

## Wat de app van je week weet

- **20 uur projectopdracht (Smart Consultant) + 20 uur stageopdracht (school)**
  per week bij Delta, met een urenbalans die laat zien wat je nog moet
  inplannen. De 8 uur die je op donderdag op school bent vallen binnen je
  stageopdracht-uren.
- **2× per week kantoor Middelburg**, wekelijks te kiezen uit maandag tot en met
  donderdag. De app waarschuwt zolang je er nog geen twee hebt gekozen.
- **Vaste punten**: donderdag school (met een einddatum, want die verplichte
  dagen duren maar een paar weken), donderdagavond paardrijden (Evie), en Enter
  Breda om 18:00 op de eerste maandag van de maand.
- **Evie's rooster**: haar zorgdiensten voer je aan het begin van de week in met
  één tik per dienst. Daarna markeert de app welke avonden nog van jullie samen
  zijn, en geeft een seintje als je werk plant op een avond die vrij was.
- Uren mogen naar de avond of het weekend schuiven — de balans kijkt naar het
  weektotaal, niet naar een vast rooster.
- **Je andere agenda's** (Delta, school, Smart Consultant) laad je in via hun
  ICS-link. De knop ⟳ bovenin haalt ze opnieuw op. Ze staan als achtergrondlaag
  in de week en tellen niet mee in de urenbalans.

## Op je telefoon zetten

1. Zet in de repository **Settings → Pages → Source** op *GitHub Actions*.
2. Push naar de branch; de workflow zet de app online op
   `https://<gebruiker>.github.io/<repo>/`.
3. Open die URL in Chrome op je Pixel → menu → **App installeren**. Hij komt als
   losse app in je lade te staan en werkt daarna offline.

## Lokaal draaien

```sh
npm install
npm run dev      # ontwikkelserver
npm run build    # productiebuild in dist/
npm run preview  # de productiebuild bekijken
```

## Je gegevens

Alles staat in IndexedDB op het toestel zelf en wordt bij elke wijziging direct
opgeslagen; er is geen opslaan-knop. Uit- en aanzetten of Chrome afsluiten
verandert daar niets aan. Bij **Instellingen → Back-up** exporteer je een
JSON-bestand en lees je die weer terug in. Dat is meteen de manier om over te
stappen naar een nieuw toestel.

```sh
npm test   # regels en ICS-parser
```

## Wat er nog aankomt

- Taken en to-do's per dag en per categorie
- Een echte Android-app (Capacitor) met notificaties

Zie [PLAN.md](PLAN.md) voor de volledige route.
