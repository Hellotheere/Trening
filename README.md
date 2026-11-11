# Personlig AI-trener

En treningsapp som kjører helt i nettleseren. Ingen passord, ingen server og ingen ngrok-tunnel – alt ligger som en statisk side på GitHub Pages.

**Åpen adresse:** [https://hellotheere.github.io/Trening/](https://hellotheere.github.io/Trening/)

## Hva appen gjør

- Lager en ukeplan ut fra mål, nivå, utstyr og hvor ofte du vil trene
- **Min egen plan:** du kan lage og redigere uken selv. Mandag kommer ferdig utfylt med bryst, armer og skuldre (brystpress i maskin, skråbenk, pec fly, skrå bicepscurl, preacher curl, triceps pushdown med stang eller tau, sidehev, omvendt pec fly og fronthev)
- Øktmodus med logging, forrige vekt/reps, progressive overload-hint, PR-merker og hviletimer
- Estimert 1RM og personlige rekorder under Fremgang
- Ukessjekk som justerer den genererte planen, eller gir hint uten å overskrive din egen
- Enkel norsk matplan som tar hensyn til allergier og vegetar/vegan
- Regelbasert trener-chat (ingen språkmodell i nettapen)
- Fungerer frakoblet etter første besøk, via en service worker

All data lagres bare i nettleseren din (`localStorage`). I **Innstillinger** (tannhjulet på plan-siden) kan du laste ned en JSON-sikkerhetskopi og legge den inn igjen senere.

Dette er ikke medisinsk rådgivning. Snakk med lege hvis du er usikker, skadet eller har sykdom.

## Slik publiserer du på GitHub Pages

Repoet er klart for [Hellotheere/Trening](https://github.com/Hellotheere/Trening). Arbeidsflyten i `.github/workflows/pages.yml` deployer rotmappen til GitHub Pages ved push til `main`. Skjermbilder og tester tas ikke med i det som publiseres.

1. Opprett repoet `Trening` på GitHub (hvis det ikke finnes)
2. Legg til remote og push `main`
3. Under *Settings → Pages* velger du **GitHub Actions** som kilde (første kjøring skjer automatisk ved push)
4. Appen blir tilgjengelig på `https://hellotheere.github.io/Trening/`

Alle lenker i appen er relative, slik at den også virker under undermappen `/Trening/`.

## Utvikling og tester

Tjen filene under en `/Trening/`-sti, for eksempel:

```bash
python tests/serve.py
```

Deretter åpner du `http://127.0.0.1:8765/Trening/`.

Kjør testene (Node-sjekk av planlogikk + Playwright mot `/Trening/`):

```bash
node tests/test_engine.js
python tests/test_pages.py
```

Skjermbilder lagres i `screenshots/` og er holdt utenfor git og utenfor Pages-pakken.
