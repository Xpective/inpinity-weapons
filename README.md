# inpinity-weapons

Offchain metadata, assets, schemas and generator scripts for the live **Inpinity City** weapon and crafting ecosystem on **Base Mainnet**.

Dieses Repo ist **nicht** für Solidity-Contracts oder Hardhat gedacht.  
Es dient als **Offchain-Schicht** für:

- publizierbare Metadata-JSONs
- Assets und Asset-Zuordnungen
- JSON-Schemas
- Validatoren
- Generatoren
- lokale Fallback-Definitionen
- UI-/Explorer-/Marketplace-kompatible Darstellung

Onchain bleibt die Wahrheit.  
Dieses Repo spiegelt die Inhalte offchain sauber, lesbar und validierbar wider.

---

# Ziel des Repos

Dieses Repo verwaltet die Offchain-Daten für das bereits live deployte Inpinity-City-System:

- **Weapons** als ERC721
- **Components** als ERC1155
- **Blueprints** als ERC1155
- **Enchantment Items** als ERC1155
- **Materia Items** als ERC1155

Zusätzlich enthält es:

- Definitionen
- Metadata
- Bild-/Icon-/Frame-Manifeste
- JSON-Schemas
- Validatoren
- Onchain-Generatoren mit Retry-Handling
- Source-Fallback-Modi (`chain`, `definitions`, `auto`)

---

# Live Contracts

## Crafting / Content Contracts

- CityComponents  
  `0xae6fd8664Ba6E147bfb7bb1Ed4354F60Fc86854e`

- CityBlueprints  
  `0x9F6453783A8935f57D9E15560012C1e9cb3Ae684`

- CityEnchantments  
  `0xEC99851ff472a90bA0f75727FC4a274F8FB19380`

- CityEnchantmentItems  
  `0x23D0A8E95f2cFf7ae59f033d0B46eAa22CE80d56`

- CityMateria  
  `0xC3f75ce5539C888cdDE0Aa2E58bC33Be758a37a1`

- CityMateriaItems  
  `0xd3258b6b0bAED28f7D90A808d3Cb39d8fF9eD080`

- CityWeapons  
  `0x6b3cDe1DdACDFB5dC060f10A94Ea52b237E5131F`

- CityWeaponSockets  
  `0xE75d804B4452bfEAC7CCa4997a80e18757b48f16`

- CityCrafting  
  `0x5cC5e3a0455b83620759D2eD6712A5aFc45F9eCF`

- CityEnchanting  
  `0x5F839E335124053b6F315233E7Fa5Ae31E37BcA2`

- CityMateriaSystem  
  `0x852488bBD8C9a3B185665374b96ee6cF06bbD720`

## Netzwerk

- Network: `base`
- Chain ID: `8453`

---

# Repo-Prinzipien

## 1. Onchain ist die Wahrheit
Alle spielrelevanten Kerndaten stammen aus den Live-Contracts.

## 2. Offchain ergänzt Darstellung
Dieses Repo ergänzt:
- Bilder
- Beschreibungen
- Labels
- UI-/Explorer-Metadata
- Composition-Hinweise
- Asset-Mappings
- Schemas
- Generatorlogik

## 3. Keine Systembrüche
Vorhandene ID-Logik, Contract-Struktur und Feldbedeutungen werden nicht umgebogen.

## 4. Generatoren statt manuelle Pflege
Metadata-Dateien sollen möglichst automatisiert aus:
- Onchain-Daten
- Asset-Manifests
- optionalen Overrides
- lokalen Definitionsdaten

erzeugt werden.

---

# Aktuelle Struktur

```text
inpinity-weapons/
├─ assets/
│  └─ manifests/
│     ├─ weapons-assets.json
│     ├─ components-assets.json
│     ├─ blueprints-assets.json
│     ├─ enchantments-assets.json
│     ├─ materia-assets.json
│     ├─ frames-assets.json
│     └─ icons-assets.json
│
├─ data/
│  ├─ definitions/
│  │  ├─ weapons/
│  │  ├─ components/
│  │  ├─ blueprints/
│  │  ├─ enchantments/
│  │  ├─ enchantment-items/
│  │  ├─ materia/
│  │  ├─ materia-items/
│  │  └─ recipes/
│  │
│  ├─ enums/
│  │  ├─ weapon-classes.json
│  │  ├─ damage-types.json
│  │  ├─ rarity-tiers.json
│  │  ├─ frame-tiers.json
│  │  ├─ tech-tiers.json
│  │  ├─ resonance-types.json
│  │  ├─ resource-types.json
│  │  └─ recipe-types.json
│  │
│  └─ overrides/
│     ├─ components/
│     ├─ blueprints/
│     ├─ weapons/
│     ├─ enchantment-items/
│     └─ materia-items/
│
├─ metadata/
│  ├─ weapons/
│  ├─ components/
│  ├─ blueprints/
│  ├─ enchantment-items/
│  └─ materia-items/
│
├─ reports/
│  └─ sync-report.json
│
├─ schemas/
│  ├─ common.schema.json
│  ├─ weapon-definition.schema.json
│  ├─ component-definition.schema.json
│  ├─ blueprint-definition.schema.json
│  ├─ enchantment-definition.schema.json
│  ├─ enchantment-item-definition.schema.json
│  ├─ materia-definition.schema.json
│  ├─ materia-item-definition.schema.json
│  ├─ recipe.schema.json
│  ├─ weapon-instance-metadata.schema.json
│  ├─ component-metadata.schema.json
│  ├─ blueprint-metadata.schema.json
│  ├─ enchantment-item-metadata.schema.json
│  └─ materia-item-metadata.schema.json
│
├─ scripts/
│  ├─ config/
│  │  ├─ contracts.mjs
│  │  ├─ rpc.mjs
│  │  └─ generator-defaults.mjs
│  │
│  ├─ lib/
│  │  ├─ fs-utils.mjs
│  │  ├─ schema-utils.mjs
│  │  ├─ enum-labels.mjs
│  │  ├─ asset-resolver.mjs
│  │  ├─ override-resolver.mjs
│  │  ├─ definition-reader.mjs
│  │  ├─ source-resolver.mjs
│  │  ├─ chain-reader.mjs
│  │  ├─ metadata-builder.mjs
│  │  ├─ report-writer.mjs
│  │  └─ cli-utils.mjs
│  │
│  ├─ validators/
│  │  ├─ _validate-by-pattern.mjs
│  │  ├─ validate-weapons.mjs
│  │  ├─ validate-components.mjs
│  │  ├─ validate-blueprints.mjs
│  │  ├─ validate-enchantments.mjs
│  │  ├─ validate-enchantment-items.mjs
│  │  ├─ validate-materia.mjs
│  │  ├─ validate-materia-items.mjs
│  │  ├─ validate-recipes.mjs
│  │  ├─ validate-metadata-weapons.mjs
│  │  ├─ validate-metadata-components.mjs
│  │  ├─ validate-metadata-blueprints.mjs
│  │  ├─ validate-metadata-enchantment-items.mjs
│  │  ├─ validate-metadata-materia-items.mjs
│  │  └─ validate-all.mjs
│  │
│  └─ generators/
│     ├─ generate-component-metadata.mjs
│     ├─ generate-blueprint-metadata.mjs
│     ├─ generate-enchantment-item-metadata.mjs
│     ├─ generate-materia-item-metadata.mjs
│     ├─ generate-weapon-instance-metadata.mjs
│     └─ generate-all-metadata.mjs
│
└─ package.json