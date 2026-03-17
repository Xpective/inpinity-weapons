# Live Read Functions

Diese Datei dokumentiert die wichtigsten Read-Funktionen der live laufenden Base-Mainnet-City-Contracts.

Grundregel:
Wenn Offchain-Daten und Onchain-Daten voneinander abweichen, gilt immer die Onchain-Version als maßgeblich.

## Weapons — CityWeapons
Contract:
`0x6b3cDe1DdACDFB5dC060f10A94Ea52b237E5131F`

Wichtige Reads:
- `weaponDefinitionOf(id)`
- `weaponInstanceOf(tokenId)`
- `weaponBonusesOf(tokenId)`
- `getWeaponStats(tokenId)`
- `getCombatProfile(tokenId)`
- `getEffectiveCombatProfile(tokenId)`
- `tokenURI(tokenId)`

## Components — CityComponents
Contract:
`0xae6fd8664Ba6E147bfb7bb1Ed4354F60Fc86854e`

Wichtige Reads:
- `componentDefinitionOf(id)`
- `uri(id)`

## Blueprints — CityBlueprints
Contract:
`0x9F6453783A8935f57D9E15560012C1e9cb3Ae684`

Wichtige Reads:
- `blueprintDefinitionOf(id)`
- `uri(id)`

## Enchantments — CityEnchantments
Contract:
`0xEC99851ff472a90bA0f75727FC4a274F8FB19380`

Wichtige Reads:
- `enchantmentDefinitionOf(id)`
- `enchantmentBonusesOf(enchantmentId, level)`
- `getEnchantmentMeta(enchantmentId)`

## Enchantment Items — CityEnchantmentItems
Contract:
`0x23D0A8E95f2cFf7ae59f033d0B46eAa22CE80d56`

Wichtige Reads:
- `enchantmentItemDefinitionOf(itemId)`
- `getEnchantmentItemMeta(itemId)`
- `uri(itemId)`

## Materia — CityMateria
Contract:
`0xC3f75ce5539C888cdDE0Aa2E58bC33Be758a37a1`

Wichtige Reads:
- `materiaDefinitionOf(id)`
- `materiaBonusesOf(materiaId, level)`
- `getMateriaMeta(materiaId)`

## Materia Items — CityMateriaItems
Contract:
`0xd3258b6b0bAED28f7D90A808d3Cb39d8fF9eD080`

Wichtige Reads:
- `materiaItemDefinitionOf(itemId)`
- `getMateriaItemMeta(itemId)`
- `uri(itemId)`

## Recipes — CityCrafting
Contract:
`0x5cC5e3a0455b83620759D2eD6712A5aFc45F9eCF`

Wichtige Reads:
- `recipeOf(recipeId)`
- `getRecipeCosts(recipeId)`