# Visual assets

## Galley illustration

`assets/galley.png` is a 1536 × 1024 PNG generated on 25 October 2026 with the built-in Imagegen tool. The selected original is stored in the repository and served locally with the app. Opening the website never calls an image-generation service.

It is an editorial illustration, not a photograph of a specific finished recipe or advice on storing eggs and open tins.

### Generation prompt

> Use case: illustration-story. Asset type: a wide editorial PNG illustration for the Russian yacht cooking website «Дельный камбуз», part of deelstuff. Main request: create a beautifully crafted, warm and legible still-life illustration of practical one-pot cooking aboard a small sailing yacht. Scene: a compact wooden galley worktop, a sturdy forest-green cooking pot with its lid resting beside it, steam subtly rising from a simple rice-and-vegetable dish. Nearby a plain measuring mug, one opened tomato tin, a small glass jar of grains, a closed zip-lock bag of dry oats, a couple of eggs, bread, and an onion. A small round porthole in the background shows a calm sea and a tiny distant sail. Style: refined hand-painted gouache and softly textured editorial illustration, familiar real objects with clear silhouettes, restrained detail; not photorealistic, not 3D, not a UI screenshot. Composition: panoramic landscape around 3:2, centered still life, breathing room around objects, usable as a cropped banner. Palette matches the existing app: warm ivory #f7f5ef, forest green #203e3b, muted olive, terracotta #a3633b, natural light wood, a little sea blue. Lighting: soft daylight, calm practical atmosphere. Text: none. Constraints: no lettering, no logos, no humans or hands, no flames, no refrigerator, no decorative clutter, no invented labels. This is a welcoming editorial image, not a technical cooking diagram.

## Chapter illustrations

`assets/chapters/<slug>.jpg` holds one gouache plate per generator chapter: `eggs`, `soup`, `pasta`, `braise`, `grain`, `batter` and `no-cook`. They were generated on 30 October 2026 with the built-in Imagegen tool of the local Codex CLI and reviewed by eye before use. The 1536 × 1024 originals stay outside the repository; the web versions are 1200 × 800 JPEGs under 250 KB made with macOS `sips`. The exact prompts and compression settings are in [chapter illustration prompts](chapter-illustration-prompts.md).

The chapter contents shows these plates as thumbnails 180 pixels wide above 680 px of screen width, so each must read at a glance; the test is a sheet of all seven at 96 pixels wide. Every plate has its own flat ground colour and one bold object: a pan from above on saffron, a bowl on teal, a diagonal fork on red, half a cabbage on plum, a tipped mug on ivory, a tall stack on pale blue, bread and a tin on coral. Keep that rule when adding a chapter: a new ground colour and a new silhouette, not another still life on a worktop. The prompts ask for no text, labels, people, flames, wood or galley interior. Like the galley picture, these are editorial illustrations, not photographs of the recipes. Each chapter's `alt` text describes its picture.

## Action and ingredient icons

`cooking-visuals.js` owns action metadata and vector paths; `ui/icons.js` owns SVG markup. The same paths are used through `Path2D` in downloaded PNG cards. These are deterministic code-native graphics, not generated text.

Icons identify a preparation action, a piece of equipment or a product. They supplement the full instruction. Action classification happens before translating a step, so changing language cannot change its icon or cooking method.
