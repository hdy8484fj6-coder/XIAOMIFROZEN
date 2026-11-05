# XiaomiFrozen

Futuristischer **Privatgelände**-Tuner für Xiaomi-/Ninebot-E-Scooter (eisblaues UI).  
Plain HTML/CSS/JS — kein Build-Schritt.

## Für Leonardo

- **Standardmodell:** Xiaomi Electric Scooter 4 (Brightway)
- **iPhone:** Web Bluetooth in Safari fehlt → Seite in **[Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055)** öffnen
- **Limits:** Eco ≤ 25 · Drive ≤ 30 · Sport ≤ 35 km/h · Anschieben mind. 2 km/h (wenn Zero Start aus)
- **Kein Firmware-Flash** in der Web-App — Export + Hinweis auf ScooterHacking Utility / SHFW / Hardware-CFW

## Start

```bash
cd /workspace/xiaomi-tuner
python3 -m http.server 8765
# Browser: http://127.0.0.1:8765/
```

## Tests

```bash
node tests/protocol.test.js
```

Prüft öffentliche Ninebot/Xiaomi-`55 AA`-Frames (Checksum, Build, Parse) gegen bekannte CamiAlfa-Beispiele.

## Was funktioniert / Limits

| Modell | Web-BLE Telemetrie (NUS 55 AA) | Flash in XiaomiFrozen |
|--------|--------------------------------|------------------------|
| M365 / 1S / Essential / Pro / Pro 2 / Mi 3 | oft ja (ältere offene BLE) | nein (extern SHU/SHFW) |
| Scooter 4 / 4 Lite / 4 Ultra (Brightway) | i. d. R. **nein** (verschlüsselt) | nein |
| Scooter 4 Pro (Ninebot) | gesichert | nein (Community UART/NGFW) |

Bei verschlüsselten Modellen: freundlicher Hinweis, **Demo-Modus** (⚗) und Config-Export.

## Rechtliches

Nur Privatgelände. In DE auf öffentlichen Wegen eKFV max. 20 km/h. Versicherung/Garantie können entfallen.
