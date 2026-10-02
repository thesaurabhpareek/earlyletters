# Photography: sourcing and licensing

Status: interim library, checked 2026-10-01. Files are in `apps/mobile/assets/photos/`, and each file's record is in `LICENSES.md` there.

## 1. Position

CREATIVE.md (section 3) asks for documentary photos of real homes, with no stock, and DESIGN_LANGUAGE.md (section 9) says "No stock baby photos, anywhere." **Open-licence stock conflicts with both.** Treat this library as a **bridge** until the commissioned shoot in CREATIVE section 7 happens. We use it only where it shows no person: hands, objects and places. The entry-screen PRD decision matches this: intro stories default to line illustration, and photos show hands, objects and places only, **never children**.

## 2. Rules

1. **Allowed sources:** Unsplash (Unsplash License, free items only, never Unsplash+), Pexels (Pexels License), and CC0 or public-domain collections (Rawpixel CC0, Wikimedia Commons CC0/PD only, Openverse filtered to `cc0`/`pdm`).
2. **No children in any photo**, including hands, feet and silhouettes.
3. **No identifiable adult faces** for marketing or App Store use unless the source documents a model release. None of our sources does, so in practice the answer is no faces. Any face kept for in-app use needs counsel review first.
4. **No logos, brands, artwork or trademarks in frame.** Check printed text: envelopes, gas cylinders, pen nibs, mugs.
5. **No AI-generated images** unless the source labels them AI and the licence is clear. None are used here.
6. **Record every image** in LICENSES.md: page URL, creator, licence and URL, date checked, people present, slot, crop and alt text.
7. **Never sell or redistribute unaltered files.** Never ship them as a downloadable pack or a wallpaper or template feature, and never collect them into a gallery-like service.
8. **Re-check before launch.** Open each page again, confirm it is still live and still free, and save a PDF of the page with its licence as evidence.

## 3. Licence summaries (pages opened 2026-10-01)

| Source | Permits | Forbids or caveats |
|---|---|---|
| **Unsplash License** (unsplash.com/license) | Download, copy, modify, distribute and use, including commercially, without permission or attribution. | "Does not include the right to compile images from Unsplash to replicate a similar or competing service." The licence page says nothing about model or property releases, so assume none exist. Unsplash+ images use a different, paid licence. **Not checked:** I didn't open the Unsplash FAQ or terms on selling unaltered copies; counsel should confirm. |
| **Pexels License** (pexels.com/license) | Free use and modification; attribution optional; web, apps, marketing and print. | Identifiable people must not appear "in a bad light or in a way that is offensive". No selling unaltered copies, for example as posters or prints. No implied endorsement by people or brands shown. No redistribution on other stock or wallpaper platforms. No use as a trademark or business name. No releases are offered. |
| **CC0 1.0** (creativecommons.org/publicdomain/zero/1.0) | Copy, modify, distribute and perform, including commercially, with no permission needed. | Patent and trademark rights are unaffected. Publicity, privacy and personal-data rights may still apply. No warranties, and no endorsement implied. |
| **Public Domain Mark 1.0** | Marks a work as free of known copyright restrictions. | No warranty. Status varies by jurisdiction. Publicity, privacy and moral rights may remain. |
| **Rawpixel CC0** | Labelled "Free for Personal and Business use", CC0. | The images are re-hosted from PxHere and free-images.com, so the original photographer isn't named and the chain of title is unverified. Use only as backup. |

**Releases:** none of these sources provides model or property releases. A licence covers the photographer's copyright, not the rights of the person shown. That is the reason for rule 3.

## 4. Selection by slot

Intro story slots follow the PRD lead's list. For each slot the order is: illustration by default, then the photo option, then the backup.

| Slot | Pick | Why | Backup |
|---|---|---|---|
| **Parent's hands with a phone at bedtime** | **None suitable (gap)** | Every verified candidate showed a face or a baby, or set the wrong mood (0Ta9QoNJfws reads as grief or support). | Use the illustration. Shoot list item 2 or 8 without the baby (hand, lit phone, dark duvet). |
| **Grandparent's hands** | `grandparent-hands-resting-portrait.jpg` (Trương Tuyết Ly) | Hands only, warm blue fabric, portrait source that crops cleanly to 9:16, and quiet and real rather than staged. | `grandparent-hands-resting-landscape.jpg` (same shoot) for web; `grandparent-hands-bw-cc0.jpg` (weak provenance, 1024 px). |
| **Letters / paper / envelope still life** | `handwritten-letters-paper-stack.jpg` (Fiona Murray-deGraaff) | Paper and ink, pale, with room for type. The French handwriting is illegible at phone size, so it doesn't compete with our words. | `opened-envelopes-still-life.jpg`: crop out the printed government franking. |
| **Kitchen table** | `hands-writing-letter-kitchen-table.jpg` (Kelly Sikkema) | Two adult hands, an envelope, a pen and tea on wood. It shows the act of writing a letter, which is the closest available match to our product. | `home-kitchen-steel-vessels-bw.jpg` (Machilipatnam, India): real South Asian home texture for the web; black and white and busy, so not for stories. |
| **Window at dusk** | `window-night-dark-bedroom.jpg` (Liz Rodriguez) | Dark room with a small lit window: bedtime and quiet, with plenty of negative space for type, and it fits the Read together dark mode. | `window-sheer-curtains-evening.jpg`; `warm-evening-light-on-bed.jpg` (golden light, also good for empty states). |

**Onboarding and empty states:** use `warm-evening-light-on-bed.jpg` or `handwritten-letters-paper-stack.jpg` at low contrast behind type, or keep the line drawings as DESIGN_LANGUAGE says. **App Store:** screenshots must show the app in use (CREATIVE section 4), so none of these photos belongs in screenshots. They can appear on the website and on social only.

**Crops:** the stories are 9:16, but most sources are 2:3 or 3:4. Crop to the subject, set text in the clear third, and never overlay text on hands at the point of contact. For dark mode, set brightness to 92% (DESIGN_LANGUAGE section 9). Apply a warm grade consistently and never a faux-vintage one.

## 5. Rejected and why (summary)

- **Children present** (baby feet, a baby's hand, a father with a baby in silhouette): six strong images rejected under the never-children rule, including the best on-brand find (bOLcDzk2q4Y, a Bangalore kitchen in silhouette).
- **Faces** (Pexels family-bed and mother-with-phone images, Unsplash concert and bed images): no releases, so rejected.
- **Brands or legible private text:** a fountain pen nib with a brand name, and an Annie Spratt note with legible names.
- **Glossy or staged:** a sunset baby lift and a home-staging dining set.

## 6. Gaps that need a commissioned shoot (with releases)

Stock can't produce what CREATIVE describes: specific, South Asian, real-home, voice-first moments. Commission these, using adult-only frames first because they need no child consent:

1. **A parent's hand holding a lit phone in a dark bedroom**, with a duvet and a crib rail at the edge. This fills the bedtime story slot; no stock option passed.
2. **Nani's hands holding a phone at arm's length** on a sofa, with glasses on the cushion (shot list item 3), shown as hands only.
3. **A thumb on the red record circle beside a paratha** (item 4), which is our own UI, so stock can never show it.
4. **Phone face down on a bedside table after a letter, room dark** (item 8).
5. **A real Indian family kitchen table in colour**, warm, with a steel tumbler and a phone.
6. **Metro, earphones, a parent talking quietly** (item 7), from behind or hands only.
7. **Child moments** (items 5, 9 and 10), only if the never-children rule is revisited, and then only with the CREATIVE section 7 consent rules (guardian consent, a child's own "no" at age 7 and older, retirement after 2 years).

Releases for the shoot should list media, territory, duration and paid ads separately, plus a property release for each home and a separate voice release.

## 7. Open risks

- **The brand rule says "no stock".** The founders need to sign off that object and place stock is acceptable as a bridge, or replace it after the shoot.
- **Pexels candidates aren't in the saved set.** Pexels blocked direct requests from this workspace, so the Pexels letter and envelope candidates (10660565, 6924670, 6917034) weren't opened page by page and were excluded.
- **Weak provenance on Rawpixel CC0.** Use only as backup.
- **The government franking on `opened-envelopes-still-life.jpg`** is public text, not a trademark. Crop it out anyway.
