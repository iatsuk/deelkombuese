# Provisioning and cooking model

## Canonical facts

Product IDs and recipe IDs are stable. Quantities remain numbers with canonical internal units; display translation never feeds back into calculations. A configured recipe stores ingredient choices, whole-pack sizes, an anchor pack and enabled modules.

`prepareRecipe` resolves substitutions, chooses actual perishable packs, scales dry ingredients from an anchor, computes cooking and preparation water, estimates yield and exposes shore/egg restrictions. Every selected perishable pack is used whole. A large yield produces a visible warning rather than an assumption that leftovers can be refrigerated.

## Flexible recipes

A recipe has a required core and optional modules. Mutually exclusive groups select one sauce or protein; compatible vegetable and seasoning modules can combine. A substitution may change quantity, water and time, not merely the displayed name.

## Generators

A generator is a recipe with a `generator` definition (`src/catalog/generators/`). It keeps one cooking principle while the base, sauce and fillings change:

- **Bases** are chosen through `choices[choiceKey]` — an ingredient's alternatives for pasta, or a technique id for generators whose base is a method. Each base carries its own water, minimum water, time and active time; `absorption` marks bases cooked by the mug rule and `sauceCredit: false` keeps the full cooking water when a sauce must wait. A base may list `noSubstitutes` that its technique cannot use (crispbread does not soak up egg), and `bowl` adds a mixing bowl to the utensils.
- **Water**: by default a base's water is the total cooking liquid and the sauce's liquid counts toward it. With `substitutesKeepLiquid` the base water comes on top of a whole sauce instead, and a substitute keeps the sauce's liquid: diluting tomato paste adds the water the passata would have brought.
- **Modules** are the options. `defaultModules` fill a group with no selection, such as the plain water/broth sauce.
- **Rules**: an option may `require` one of several options or `exclude` others, with a `reason` shown to the reader. `normalizeSelection` repairs saved or linked selections; `optionBlocked` explains why an option is unavailable.
- **Names**: `dishes` map a base and modules to a known dish; the most specific match wins. Otherwise the title is the base label plus the sauce's title label, which may depend on a substitution (cream or milk). A dish or a base may carry its own `satiety` when it is more or less filling than the chapter as a whole.
- **Steps** are entries with a `phase`, an optional `when(context)` and a text. Entries come from the generator, the chosen base and the selected modules and are ordered by `phases`. The context offers the base, sauce, module and ingredient ids, cooking water and hydration water.
- **Favourites** are keyed by recipe for ordinary recipes and by recipe, base and module set for generators (`favoriteKey`), so several dishes of one generator can be saved; saving the same variant with other packs or substitutions updates it.
- **Chapter text**: `slug`, `chapter` (order, title, formula, principle) and `sentence` (words and option slots) describe the generator's chapter page; bases and modules may add a `phrase` that fits the sentence.
- **Passage profiles** (`tripProfiles`) choose the modules and choices the passage planner uses, keyed by day, by meal or `default`. The planner then repairs the selection with the generator's rules.
- **Absorbed recipes**: when a standalone recipe becomes a dish of a generator, `recipeMigrations` maps its id to the generator's base and modules (`moduleMap` splits a module the generator models as several; `choiceMap` moves a substitution to the ingredient that took its place), so favourites, plans and passage overrides survive. `tests/chapters.test.mjs` compares each dish with the numbers recorded from its former recipe in `tests/fixtures/legacy-*.json`: the default, every module, substitute and pack size.

The pasta/risotto/rice/potato generator keeps each base's technique; a golden test records its output.

The eggs generator has techniques as its bases (`choiceKey: 'technique'`): fried, poached in sauce, scrambled, omelette and bread dipped in egg. A single sauce (tomatoes or curry) and a single side (bread, potatoes or rice) name the dish — fried eggs with bread, shakshuka, menemen, tortilla, egg curry with rice; dipped bread is eggy bread, and with milk powder it is French toast. Honey or jam can finish the toast, and ham from the shore goes with fried or beaten eggs. Rules keep the combinations sensible: poaching needs a sauce, dipping needs bread, curry is only a poaching sauce, rice does not go into an omelette, sweet toast is not salted and ham stays out of sauces and honey. Every valid combination is tested for water, time, whole packs and its first and last safety steps.

The former recipes for fried eggs with bread, shakshuka and French toast are now dishes of the chapter. Fried eggs with bread and every shakshuka variant keep their exact numbers, including tomato substitutes and a 500 g passata pack. French toast keeps its time, active time and toppings but moved to the chapter's portion: 100 g of bread and 15 g of measured milk powder instead of 150 g of bread and a 125 ml carton of UHT milk, which the chapter does not offer because an opened carton does not keep. On a passage with eggs, breakfast is French toast with honey and other meals are shakshuka.

The no-cooking generator chooses its base through the bread ingredient (`choiceKey: 'bread'`): bread or crispbread, or a whole can of beans or chickpeas for a cold salad in a bowl. A single filling (tuna, peanut butter with raisins or corn) and a single dressing (oil and pepper, garlic oil, or oil with onion and paprika) name the dish. Peanut butter goes only on bread and without an oil dressing, corn only into a bowl of beans or chickpeas, and honey only with peanut butter; bread needs a filling or a dressing. The former recipes for tuna on bread, bread with garlic oil, bread with peanut butter and beans with corn are dishes of the chapter with their exact numbers and satiety. On a passage, breakfast is peanut butter on crispbread and the snack with eggs on day one is bread with dried-garlic oil.

On the flavour map, a generator takes the first base that keeps every product the reader picked within its rules, so eggs and passata lead to shakshuka. Ordinary rice absorbs measured water under a lid; risotto receives water gradually with stirring. Acidic tomato ingredients enter potatoes after they soften.

Fresh cabbage uses a separate braising technique. Plain cabbage, cabbage with rice, and added tomato/protein variants share one definition. Adding rice creates the unstuffed cabbage-roll variant. A small whole head is treated as the anchor unit; the opened remainder is not scheduled for another day. Fresh cabbage and canned sauerkraut are not presented as identical storage products or automatic one-for-one cooking substitutes.

## Storage

Shelf lives are short editorial purchasing/rotation estimates under the specified conditions. The original packaging and actual remaining shelf life take precedence. A warm, wet locker does not provide controlled root-cellar conditions.

Dry products need a food-grade zip-lock plus a rigid airtight container. Whole fresh vegetables need the ventilation appropriate to the product. Once a cabbage head is cut, the app plans to use it immediately; the whole-head estimate does not apply to a cut remainder.

## Menus and water

The passage planner rotates familiar meals and shares ingredients; it is not an optimiser for cost, calories or individual nutritional needs. The seasonal list is replenishable basic stock rather than a complete season's diet.

Water is reported separately for drinking, cooking/reconstitution, preparation/rinsing, household use and reserve. Retail purchases round dry products to available packs and expose leftovers. All quantities and preparation times remain estimates to be checked against the actual product and galley conditions.
