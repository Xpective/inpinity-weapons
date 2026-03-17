# inpinity-weapons

Offchain asset and metadata repository for the Inpinity ecosystem.

Dieses Repository ist **nicht** für Solidity-Contracts, Hardhat oder Deployments gedacht.

Es dient als **saubere Offchain-Begleitstruktur** für das bereits live laufende `Inpinity-city`-System auf Base Mainnet.

---

## Zweck dieses Repos

Dieses Repo verwaltet die Offchain-Datenstruktur für:

- Weapon Definitions
- Component Definitions
- Blueprint Definitions
- Enchantment Definitions
- Enchantment Item Definitions
- Materia Definitions
- Materia Item Definitions
- Recipe Definitions
- Asset-Zuordnungen
- Bildstrukturen
- JSON-Schemata
- Generator-/Validator-Skripte
- Seed-Helfer für konsistente Erweiterungen

---

## Wichtige Abgrenzung

### Dieses Repo macht:
- Offchain-JSON-Strukturen
- Metadaten
- Assets
- Schemas
- Validierung
- Content-Erweiterungen
- Seed-Vorbereitung
- Asset-Manifeste

### Dieses Repo macht nicht:
- keine Solidity-Contracts
- kein Hardhat
- keine Deployments
- keine neue Onchain-Parallelarchitektur
- keine Umgehung der bestehenden City-Contracts

---

## Bezug zum Live-System

Das bestehende City-/Crafting-/Weapon-System auf Base Mainnet ist bereits live.

### Live-Crafting-Contracts

- CityComponents: `0xae6fd8664Ba6E147bfb7bb1Ed4354F60Fc86854e`
- CityBlueprints: `0x9F6453783A8935f57D9E15560012C1e9cb3Ae684`
- CityEnchantments: `0xEC99851ff472a90bA0f75727FC4a274F8FB19380`
- CityEnchantmentItems: `0x23D0A8E95f2cFf7ae59f033d0B46eAa22CE80d56`
- CityMateria: `0xC3f75ce5539C888cdDE0Aa2E58bC33Be758a37a1`
- CityMateriaItems: `0xd3258b6b0bAED28f7D90A808d3Cb39d8fF9eD080`
- CityWeapons: `0x6b3cDe1DdACDFB5dC060f10A94Ea52b237E5131F`
- CityWeaponSockets: `0xE75d804B4452bfEAC7CCa4997a80e18757b48f16`
- CityCrafting: `0x5cC5e3a0455b83620759D2eD6712A5aFc45F9eCF`
- CityEnchanting: `0x5F839E335124053b6F315233E7Fa5Ae31E37BcA2`
- CityMateriaSystem: `0x852488bBD8C9a3B185665374b96ee6cF06bbD720`

---

## Architekturregel

Die bestehende Onchain-Architektur wird **nicht verändert**.

Neue Inhalte werden ausschließlich konsistent ergänzt als:

- neue Weapon Definitions
- neue Component Definitions
- neue Blueprint Definitions
- neue Enchantment Definitions
- neue Enchantment Item Definitions
- neue Materia Definitions
- neue Materia Item Definitions
- neue Recipes

---

## Bestehende Struktur, die beibehalten werden muss

1. Weapon Definitions liegen in `CityWeapons`
2. Components sind ERC1155 in `CityComponents`
3. Blueprints sind ERC1155 in `CityBlueprints`
4. Enchantments sind Definitions in `CityEnchantments`
5. Enchantment Items sind ERC1155 in `CityEnchantmentItems`
6. Materia sind Definitions in `CityMateria`
7. Materia Items sind ERC1155 in `CityMateriaItems`
8. Rezepte liegen in `CityCrafting`
9. Waffen werden über `craftWeapon(...)` erzeugt
10. Components / Blueprints werden über `craft(...)` erzeugt
11. Socketing läuft getrennt über:
   - `CityEnchanting`
   - `CityMateriaSystem`
   - `CityWeaponSockets`

---

## V1-Realität beachten

Aktuell bildet `CityCrafting` onchain vor allem **Resource-Kosten** ab.

Komponenten als echte Recipe-Inputs für Waffen sind im aktuellen V1-Recipe-Modell noch nicht als eigener Onchain-Input abgebildet.

Darum gilt für dieses Repo:

- Weapon Recipes bleiben vorerst resource-basiert
- Component-Zusammenhänge können Offchain dokumentiert werden
- spätere Systemerweiterungen müssen bewusst und getrennt geplant werden
- keine implizite Umdeutung der bestehenden Rezeptlogik

---

## Offchain-Rolle dieses Repos

Dieses Repo soll die Content-Schicht langfristig sauber skalierbar machen.

### Ziel:
- stabile IDs
- konsistente Benennung
- saubere Asset-Zuordnung
- standardisierte JSON-Struktur
- später automatisierbare Generatoren
- keine Verwirrung für Nutzer durch Strukturbrüche

---

## Content-Kategorien

### Weapons
Einzigartige Waffendefinitionen für das bestehende Weapon-System.

### Components
ERC1155-kompatible Crafting-Komponenten.

### Blueprints
ERC1155-kompatible Baupläne für Crafting-Zugänge.

### Enchantments
Definierte magische / modifizierende Effekte.

### Enchantment Items
Anwendbare oder verbrauchbare Träger von Enchantments.

### Materia
Definierte Materia-Effekte.

### Materia Items
Sockelbare Materia-Gegenstände.

### Recipes
Crafting-Rezepte passend zur bestehenden CityCrafting-Struktur.

---

## ID-Bereiche

### Definitionen
- Weapon Definitions: `1–999`
- Component Definitions: `1–999`
- Blueprint Definitions: `1–999`
- Enchantments: `1–999`
- Enchantment Items: `1–999`
- Materia: `1–999`
- Materia Items: `1–999`

### Rezepte
- `1–99` = Component Recipes
- `100–199` = Weapon Recipes
- `200–299` = Blueprint Recipes
- `300–399` = Enchantment / Enchantment-Item-nahe Rezepte
- `400–499` = Materia / Materia-Item-nahe Rezepte
- `500+` = spätere Spezialrezepte / District / Faction / Advanced Forge

---

## Benennungsregeln

- Weapon Name: klar, singular, z. B. `Iron Sword`
- Component Name: klar, singular, z. B. `Plasma Chamber`
- Blueprint Name: immer mit Suffix `Blueprint`
- Enchantment Name: Effektname
- Enchantment Item Name: klar aus Definition ableitbar
- Materia Name: klarer Materia-Name
- Recipe Label: immer vom Output ableiten

---

## Repo-Struktur

```text
inpinity-weapons/
├─ README.md
├─ .gitignore
├─ .editorconfig
├─ package.json
├─ jsconfig.json
├─ docs/
├─ schemas/
├─ data/
├─ metadata/
├─ assets/
├─ scripts/
└─ dist/