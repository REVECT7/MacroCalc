# 🥗 MacroCalc — Schlanker PWA Nährwert-Umrechner

Eine extrem leichtgewichtige, performante Web-App zur präzisen Nährwert-Umrechnung von Lebensmitteln nach individueller Portionsgröße (Nettogewicht). Optimiert als installierbare **Progressive Web App (PWA)** für iOS (iPhone/iPad) und Desktop, bereitgestellt als minimaler Docker-Container basierend auf **Nginx Alpine (< 20 MB)**.

---

## ✨ Features

- **⚡ Schnell & Schlank:** Pure Vanilla HTML5, modernstes CSS im Dark-Mode-Design (Slate/Zinc mit Smaragdgrün-Akzenten) und Vanilla JavaScript. Keine schweren Frameworks, keine externen CDN-Abhängigkeiten.
- **📱 iOS-First PWA:**
  - Standalone App-Modus ohne Browserleiste (`apple-mobile-web-app-capable`).
  - Angepasste Statusleiste (`black-translucent`) und Berücksichtigung von iPhone Safe-Area-Insets (Notch & Dynamic Island).
  - Volle Unterstützung für `inputmode="decimal"` für die direkte Zifferntastatur.
  - Nahtlose Verarbeitung von **Komma (`,`)** und **Punkt (`.`)** für deutsche Tastaturen.
- **🔢 Präzise Umrechnung:**
  - Formel: `(Wert / 100) * Nettogewicht`
  - Kalorien: ganze Zahlen gerundet (`kcal`)
  - Makros: 1 Nachkommastelle gerundet (`g Fett`, `g KH`, `g Eiweiß`)
  - Visueller Makro-Verteilungsbalken (prozentuales Verhältnis)
- **📋 Smarte Clipboard-Funktionen:**
  - Einzelwerte per Klick kopieren
  - Button **„Alle Makros kopieren“** im Format: `XXX kcal | XX.Xg F | XX.Xg KH | XX.Xg E`
  - Visuelles Feedback (grünes Häkchen + „Kopiert!“-Bestätigung + Toast)
- **⌨️ Tastatur-Unterstützung:** <kbd>Enter</kbd> löst direkt die Berechnung aus.
- **🔄 Reset:** Ein-Klick-Button zum schnellen Leeren aller Felder.
- **📶 100% Offline-fähig:** Registrierter Service Worker (`sw.js`) cached alle Assets lokal – funktioniert auch im Flugmodus oder Funkloch im Supermarkt.

---

## 🚀 Schnellstart mit Docker

### 1. Starten via Docker Compose
Im Projektverzeichnis ausführen:
```bash
docker compose up -d
```

Die App ist sofort erreichbar unter:
👉 **[http://localhost:777](http://localhost:777)**

*(Falls ein anderer Port gewünscht ist, kann dieser einfach angepasst werden, z. B. `PORT=8080 docker compose up -d`)*

### 2. Manuell mit Docker Build & Run
```bash
docker build -t macrocalc .
docker run -d -p 777:80 --name macrocalc-pwa --restart unless-stopped macrocalc
```

### 3. Container stoppen
```bash
docker compose down
```

---

## 📲 Als App auf dem iPhone (iOS) installieren

1. Öffne die URL (z. B. `http://<deine-server-ip>:777`) im mobilen **Safari** auf dem iPhone.
2. Tippe unten in der Menüleiste auf das **Teilen-Symbol** (Viereck mit Pfeil nach oben ⎋).
3. Scrolle etwas nach unten und wähle **„Zum Home-Bildschirm“** (Add to Home Screen).
4. Bestätige mit **„Hinzufügen“**.
5. Die App erscheint als vollwertige Icon-App auf deinem Homescreen und öffnet sich im nativen Vollbild ohne Safari-Browserleiste.

---

## 📁 Projektstruktur

```text
NW-Tracker/
├── index.html           # Semantisches HTML5, iOS Meta-Tags, barrierefreie Inputs
├── style.css            # Modernes Dark-Mode CSS mit Safe-Area & Micro-Animations
├── app.js               # Berechnungs-Engine, Input-Parser, Clipboard-API & PWA-Worker
├── sw.js                # Service Worker für Offline-Caching
├── manifest.json        # PWA Web-App-Manifest (Standalone, Icons, Theme-Color)
├── icon.svg             # Vektorbasiertes PWA-Icon
├── icon-192.png         # PWA Icon 192x192
├── icon-512.png         # PWA Icon 512x512
├── apple-touch-icon.png # iOS Homescreen Icon (180x180)
├── nginx.conf           # Schlanke Nginx-Konfiguration mit Gzip & Sicherheitsheadern
├── Dockerfile           # Alpine-basiertes Multi-Container Image (< 20 MB)
└── docker-compose.yml   # Port-Mapping 777:80 & Restart-Policy unless-stopped
```
