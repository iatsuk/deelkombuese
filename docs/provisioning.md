# Provisioning and cooking model

## Canonical facts

Product IDs and recipe IDs are stable. Quantities remain numbers with canonical internal units; display translation never feeds back into calculations. A configured recipe stores ingredient choices, whole-pack sizes, an anchor pack and enabled modules.

`prepareRecipe` resolves substitutions, chooses actual perishable packs, scales dry ingredients from an anchor, computes cooking and preparation water, estimates yield and exposes shore/egg restrictions. Every selected perishable pack is used whole. A large yield produces a visible warning rather than an assumption that leftovers can be refrigerated.

## Flexible recipes

A recipe has a required core and optional modules. Mutually exclusive groups select one sauce or protein; compatible vegetable and seasoning modules can combine. A substitution may change quantity, water and time, not merely the displayed name.

## Generators

A generator is a recipe with a `generator` definition (`src/catalog/generators/`). It keeps one cooking principle while the base, sauce and fillings change:

- **Bases** are chosen through `choices[choiceKey]` — an ingredient's alternatives for pasta, or a technique id for generators whose base is a method. Each base carries its own water, minimum water, time and active time; `absorption` marks bases cooked by the mug rule, `grainCooking` also measures their water by it from the grain and guides the method step by step, and `sauceCredit: false` keeps the full cooking water when a sauce must wait. A base may bring its own `ingredients` (each batter has its own flour, oats or potato) and `defaultPacks` (the tomato soup takes a 500 g pack of passata), list `noSubstitutes` that its technique cannot use (crispbread does not soak up egg), name extra `utensils` (a mixing bowl, a grater) and carry a galley `tip`.
- **Water**: by default a base's water is the total cooking liquid and the sauce's liquid counts toward it. With `substitutesKeepLiquid` the base water comes on top of a whole sauce or batter instead, and a substitute keeps the liquid of what it replaces: diluting tomato paste adds the water the passata would have brought, and a carton of UHT milk replaces water in a batter.
- **Modules** are the options. `defaultModules` fill a group with no selection, such as the plain water/broth sauce. `ingredientsByBase` gives a module other amounts with some bases (thin pancakes take more milk powder than fritters).
- **Rules**: an option may `require` one of several options or `exclude` others, with a `reason` shown to the reader. `normalizeSelection` repairs saved or linked selections; `optionBlocked` explains why an option is unavailable.
- **Names**: `dishes` map a base and modules to a known dish; the most specific match wins. Otherwise the title is the base label plus the sauce's title label, which may depend on a substitution (cream or milk), and the `titleLabel` of every other option that names itself ("Гречка · с тунцом · с паприкой"). A dish or a base may carry its own `satiety` when it is more or less filling than the chapter as a whole, and its own galley `tip`.
- **Steps** are entries with a `phase`, an optional `when(context)` and a text. Entries come from the generator, the chosen base and the selected modules and are ordered by `phases`. The context offers the base, sauce, module and ingredient ids, cooking water and hydration water.
- **Favourites** are keyed by recipe for ordinary recipes and by recipe, base and module set for generators (`favoriteKey`), so several dishes of one generator can be saved; saving the same variant with other packs or substitutions updates it.
- **Dish kinds**: `kinds` lists the recipe-filter kinds a chapter covers, so the eggs chapter appears under egg dishes.
- **Chapter text**: `slug`, `chapter` (order, title, formula, principle) and `sentence` (words and option slots) describe the generator's chapter page; bases and modules may add a `phrase` that fits the sentence.
- **Passage profiles** (`tripProfiles`) choose the modules and choices the passage planner uses, keyed by day and meal (`4-breakfast`), by day, by meal or `default`. The planner then repairs the selection with the generator's rules.
- **Absorbed recipes**: when a standalone recipe becomes a dish of a generator, `recipeMigrations` maps its id to the generator's base and modules (`moduleMap` splits a module the generator models as several; `choiceMap` moves a substitution to the ingredient that took its place), so favourites, plans and passage overrides survive. `tests/chapters.test.mjs` compares each dish with the numbers recorded from its former recipe in `tests/fixtures/legacy-*.json`: the default, every module, substitute and pack size.

The pasta/risotto/rice/potato generator keeps each base's technique; a golden test records its output.

The eggs generator has techniques as its bases (`choiceKey: 'technique'`): fried, poached in sauce, scrambled, omelette and bread dipped in egg. A single sauce (tomatoes or curry) and a single side (bread, potatoes or rice) name the dish — fried eggs with bread, shakshuka, menemen, tortilla, egg curry with rice; dipped bread is eggy bread, and with milk powder it is French toast. Honey or jam can finish the toast, and ham from the shore goes with fried or beaten eggs. Rules keep the combinations sensible: poaching needs a sauce, dipping needs bread, curry is only a poaching sauce, rice does not go into an omelette, sweet toast is not salted and ham stays out of sauces and honey. Every valid combination is tested for water, time, whole packs and its first and last safety steps.

The former recipes for fried eggs with bread, shakshuka and French toast are now dishes of the chapter. Fried eggs with bread and every shakshuka variant keep their exact numbers, including tomato substitutes and a 500 g passata pack. French toast keeps its time, active time and toppings but moved to the chapter's portion: 100 g of bread and 15 g of measured milk powder instead of 150 g of bread and a 125 ml carton of UHT milk, which the chapter does not offer because an opened carton does not keep. On a passage with eggs, breakfast is French toast with honey and other meals are shakshuka.

The no-cooking generator chooses its base through the bread ingredient (`choiceKey: 'bread'`): bread or crispbread, or a whole can of beans or chickpeas for a cold salad in a bowl. A single filling (tuna, peanut butter with raisins or corn) and a single dressing (oil and pepper, garlic oil, or oil with onion and paprika) name the dish. Peanut butter goes only on bread and without an oil dressing, corn only into a bowl of beans or chickpeas, and honey only with peanut butter; bread needs a filling or a dressing. The former recipes for tuna on bread, bread with garlic oil, bread with peanut butter and beans with corn are dishes of the chapter with their exact numbers and satiety. On a passage, breakfast is peanut butter on crispbread and the snack with eggs on day one is bread with dried-garlic oil.

The batter generator has six batters as its bases, each with its own ingredients, water, time and method: thin pancakes with egg, fritters without kefir, oat fritters, oat cutlets, egg-free potato pancakes and flatbread. One flavour finishes the dish — honey, jam or ham and cheese for pancakes and fritters, raisins and honey or corn and onion for oat fritters, fish or beans for cutlets and fish beside potato pancakes. Milk powder goes into the runny batters, garlic into potato pancakes, and salt and pepper into cutlets and potato pancakes. The six former recipes are dishes of the chapter with their exact numbers, including UHT milk instead of powder. On a passage, breakfast on day two is fritters with honey and on day four oat fritters with raisins.

The grain generator cooks one portion of 90 g of rice, buckwheat or couscous, or 80 g of oats. Rice and buckwheat absorb water measured by the mug rule under a lid with the guided grain method; couscous steeps off the heat and savoury oats simmer in stock. A spice (cumin, paprika, tomato with paprika, curry), one can (meat, tuna, chickpeas) and vegetables (peas, corn, carrot) name the dish. Pilaf, the paella-style rice, rice with chickpea curry, rice with corn and tuna, buckwheat with meat and carrot, buckwheat with peas, couscous and savoury oats are dishes of the chapter. Five keep their exact numbers; pilaf and the paella-style rice now use the same 90 g portion as the other rice dishes instead of 100 g, and buckwheat with meat gives the carrot the same 3 minutes as pilaf. Passage lunches are buckwheat with peas, rice with corn and tuna, and couscous; day five's breakfast is savoury oats.

The soup generator has five soups as its bases, each with its own liquid, thickener and method: stock soup with potatoes (or pasta, rice or oats), lentil soup, tomato soup from a whole 500 g pack of passata, sauerkraut shchi and a mashed pea or corn soup. Fish, beans or meat go into the stock soup and the shchi; beetroot turns shchi into borscht, and sauerkraut can be rinsed with water counted apart. The five former soups are dishes of the chapter with their exact numbers. Passage lunches are tomato soup on day two, stock soup with fish on day three, lentil soup on day five and shchi on day six; stock is added on odd days only where the soup does not have it already.

On the flavour map, a generator takes the first base that keeps every product the reader picked within its rules, so eggs and passata lead to shakshuka; a base that brings a picked product of its own comes first, so oats lead to oat fritters. Ordinary rice absorbs measured water under a lid; risotto receives water gradually with stirring. Acidic tomato ingredients enter potatoes after they soften.

Fresh cabbage uses a separate braising technique. Plain cabbage, cabbage with rice, and added tomato/protein variants share one definition. Adding rice creates the unstuffed cabbage-roll variant. A small whole head is treated as the anchor unit; the opened remainder is not scheduled for another day. Fresh cabbage and canned sauerkraut are not presented as identical storage products or automatic one-for-one cooking substitutes.

## Storage

Shelf lives are short editorial purchasing/rotation estimates under the specified conditions. The original packaging and actual remaining shelf life take precedence. A warm, wet locker does not provide controlled root-cellar conditions.

Dry products need a food-grade zip-lock plus a rigid airtight container. Whole fresh vegetables need the ventilation appropriate to the product. Once a cabbage head is cut, the app plans to use it immediately; the whole-head estimate does not apply to a cut remainder.

## Menus and water

The passage planner rotates familiar meals and shares ingredients; it is not an optimiser for cost, calories or individual nutritional needs. The seasonal list is replenishable basic stock rather than a complete season's diet.

Water is reported separately for drinking, cooking/reconstitution, preparation/rinsing, household use and reserve. Retail purchases round dry products to available packs and expose leftovers. All quantities and preparation times remain estimates to be checked against the actual product and galley conditions.
