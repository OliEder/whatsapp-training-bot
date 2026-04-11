# WhatsApp Training-Bot

Home Assistant Add-on für automatische WhatsApp-Polls bei Trainings und Spielen.

## Installation

1. HA → Einstellungen → Add-ons → Add-on Store → ⋮ → Repositories
2. URL dieses Repositories hinzufügen
3. "WhatsApp Training-Bot" installieren und starten
4. Web-UI öffnen → QR-Code scannen

## Ersteinrichtung

1. Team anlegen (Name, ICS-URLs, Filterregeln, Zeitplan)
2. WhatsApp-Gruppen zuweisen (Rollen: training / allgemein / spiel-orga)
3. Kinder importieren (CSV aus Excel)

## Funktionen

- **Training-Poll**: Automatisch X Tage vor Training — "Mein(e) Kind(er) kommen am [Datum] ins Training" (Ja / Nein / + Geschwisterkind)
- **Spiel-Poll**: Automatisch X Tage vor Spiel — Kinderliste zum Anhaken
- **Spiel-Event**: WhatsApp-Gruppenevent 14 Tage vor Spiel
- **CSV-Export**: Tag vor dem Spiel — Teilnehmerliste als Datei + WhatsApp-Nachricht

## Konfiguration

Alle Einstellungen über die Web-UI unter `http://homeassistant.local/hassio/ingress/whatsapp_training_bot`.

## Daten

Alle Daten liegen in `/data` (HA-Volume-Mount, bleibt bei Updates erhalten).
