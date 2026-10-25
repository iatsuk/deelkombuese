# Provisioning and cooking model

## Canonical facts

Product IDs and recipe IDs are stable. Quantities remain numbers with canonical internal units; display translation never feeds back into calculations. A configured recipe stores ingredient choices, whole-pack sizes, an anchor pack and enabled modules.

`prepareRecipe` resolves substitutions, chooses actual perishable packs, scales dry ingredients from an anchor, computes cooking and preparation water, estimates yield and exposes shore/egg restrictions. Every selected perishable pack is used whole. A large yield produces a visible warning rather than an assumption that leftovers can be refrigerated.

## Flexible recipes

A recipe has a required core and optional modules. Mutually exclusive groups select one sauce or protein; compatible vegetable and seasoning modules can combine. A substitution may change quantity, water and time, not merely the displayed name.

The pasta/risotto/rice/potato builder keeps each base's technique. Ordinary rice absorbs measured water under a lid; risotto receives water gradually with stirring. Acidic tomato ingredients enter potatoes after they soften.

Fresh cabbage uses a separate braising technique. Plain cabbage, cabbage with rice, and added tomato/protein variants share one definition. Adding rice creates the unstuffed cabbage-roll variant. A small whole head is treated as the anchor unit; the opened remainder is not scheduled for another day. Fresh cabbage and canned sauerkraut are not presented as identical storage products or automatic one-for-one cooking substitutes.

## Storage

Shelf lives are short editorial purchasing/rotation estimates under the specified conditions. The original packaging and actual remaining shelf life take precedence. A warm, wet locker does not provide controlled root-cellar conditions.

Dry products need a food-grade zip-lock plus a rigid airtight container. Whole fresh vegetables need the ventilation appropriate to the product. Once a cabbage head is cut, the app plans to use it immediately; the whole-head estimate does not apply to a cut remainder.

## Menus and water

The passage planner rotates familiar meals and shares ingredients; it is not an optimiser for cost, calories or individual nutritional needs. The seasonal list is replenishable basic stock rather than a complete season's diet.

Water is reported separately for drinking, cooking/reconstitution, preparation/rinsing, household use and reserve. Retail purchases round dry products to available packs and expose leftovers. All quantities and preparation times remain estimates to be checked against the actual product and galley conditions.
