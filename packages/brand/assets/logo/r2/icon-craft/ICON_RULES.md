# iOS app icon rules for Early Letters (checked Oct 3 2026)

Owner: icon-craft (I1). Every rule is tagged:
**[verified]** read today in Apple's own pages (sources at the bottom), **[Expo verified]** read in Expo docs, **[unverified]** practice or measurement I could not confirm in an Apple source. Do not treat unverified numbers as Apple rules.

Note on versions: the brief says "iOS 26". Apple's current docs already describe iOS/macOS **27** rendering next to 26 (Icon Composer has "26" and "27" effect toggles; "in versions earlier than 27 ... Refraction settings have no visible effect") and the HIG change log has a "June 8, 2026: Refined guidance for Liquid Glass" entry. So the target is the Liquid Glass system as of iOS 26 and 27. **[verified]**

## 1. The master
1. iOS, iPadOS and macOS icons are designed on a **square 1024 x 1024 px** canvas. The system masks it to the rounded shape; ship **square, unmasked** layers. Pre-masked art "negatively impacts specular highlight effects and makes edges look jagged". **[verified]**
2. One master is enough: the system scales it for Settings, notifications, Spotlight. **[verified]** Optical small cuts (`symbol-small.svg`) only reach a device if we ship a legacy asset catalog with "All Sizes"; an Icon Composer `.icon` file is a single master. **[verified: both options exist in Xcode docs; consequence is my reading]**
3. Colour spaces: sRGB, Gray Gamma 2.2, Display P3. **[verified]** Our palette is sRGB; keep it sRGB.
4. Flattened default icon: **opaque, no alpha channel**. App Store Connect rejects a large app icon that "can't be transparent nor contain an alpha channel" (widely reported validation error 409). **[unverified in an Apple page I could open; consistent across many developer reports]** Expo: "Make sure the icon fills the whole square, with no rounded corners or other transparent pixels." **[Expo verified]** Bench reports the PNG colour type of every submitted icon.
5. Dark variant (asset-catalog path): "Provide your dark app icon with a transparent background so the system-provided background can show through." Tinted variant: "Provide your tinted app icon as a grayscale image." **[verified]** So transparency is forbidden only for the default/App Store image, required for the dark asset-catalog variant.

## 2. Layers (Icon Composer)
6. Icons are a **background layer plus one or more foreground layers**; the system adds specular highlights, refraction, translucency, shadows. **[verified]**
7. Icon Composer: import SVG (preferred) or PNG layers, organise into **at most four groups**, which become the depth layers. Name layers with back-to-front numbers. **[verified]**
8. Background: set solid colour or gradient **in Icon Composer**, do not export it. If you must import a background, it must be full-bleed and opaque. Remove blurs, shadows, specular, opacity and translucency before export. Convert text to outlines. Do not export the canvas mask. **[verified]**
9. Foreground edges must be **clearly defined, not feathered**, so system highlights look right. **[verified]**
10. Do not paint your own specular highlights, drop shadows, bevels, glows. **[verified]**
11. Expo supports an Icon Composer `.icon` directory via `ios.icon` from **SDK 54**; this repo is on SDK 57. **[Expo verified]**
12. `.icon` is a folder (`icon.json` plus `Assets/`). Its JSON schema is not publicly documented by Apple. **[unverified]** So any `.icon` we generate outside Icon Composer must be opened and re-saved in Icon Composer on a Mac before shipping.

## 3. Appearances
13. Six appearances on iOS: **default, dark, clear light, clear dark, tinted light, tinted dark.** People choose; the system generates any variant you do not provide. **[verified]**
14. Keep the core features identical across appearances; do not swap elements per variant. **[verified]**
15. Use the light icon as the basis for dark; dark icons are more subdued, clear and tinted even more. "Color backgrounds generally offer the greatest contrast in dark icons." Avoid excessively bright images in dark. **[verified]**
16. Clear and tinted (Icon Composer "Mono") are derived from the foreground layers' shape and luminance. A mark that only works because of colour fails here. **[verified: Mono preview exists; derivation detail is my reading, unverified]**

## 4. Design
17. Simple: one concept, minimal number of shapes, simple solid or gradient background, content need not fill the canvas. **[verified]**
18. **Avoid extremely thin line weights and sharp corners**; they lose detail at small sizes. **[verified]** This is round 1 concept B's failure, reproduced on the bench (`bench/r1-b`).
19. Keep primary content centred so corner masking never clips it. Use Apple's template grid. **[verified]**
20. Text only when essential. A first-letter mnemonic is allowed but the brief forbids "e" anyway. **[verified]**
21. Prefer filled, overlapping shapes; vary opacity in foreground layers for depth. **[verified]**

## 5. Sizes the bench renders
| Context | pt | px @1x / 2x / 3x | Source |
|---|---|---|---|
| Settings | 29 | 29 / 58 / 87 | long-standing Apple size table **[unverified for iOS 26/27; Settings rows look about 30 pt]** |
| Spotlight | 40 | 40 / 80 / 120 | same **[unverified]** |
| Home screen iPhone | 60 | 60 / 120 / 180 | same **[unverified for larger phones, which may draw icons a few points bigger]** |
| Notification banner | about 38 | 114 @3x | measured from screenshots **[unverified]** |
| App Store product page | about 118 | | **[unverified]** |
| App Store search result | about 64 | | **[unverified]** |
| Mask corner | continuous corner, approximated as superellipse n = 5 | | **[unverified approximation, not Apple's curve]** |

## 6. Early Letters specific
22. Default: sepia `accent` #8A5A3B ground, `paper` #FBF8F3 mark (brief). Contrast 5.50:1.
23. Dark: near-black warm ground (#1F1B18 to a slightly lighter top), mark in `accentDark` #D9A47E. Contrast 7.79:1. Same geometry as default.
24. Mark size: drawn bounds about 52 to 62 percent of the canvas width for a compact mark; the bench sizes marks by the geometric mean of their bounds (`--scale`, default 0.56) so wide and tall marks get comparable visual mass.
25. Minimum stroke: at 29 px a stroke under about 1.2 px turns into a grey hairline. On the 1024 master that is about **40 px**; aim for 56 px or more for the thinnest essential part. **[my measurement on the bench, unverified as a rule]**
26. The bench's Liquid Glass rim, tinted and clear renders are simulations. Final sign-off must be in Icon Composer previews or on a device.

## Sources
- Apple HIG, App icons (fetched as JSON from developer.apple.com, Oct 3 2026): https://developer.apple.com/design/human-interface-guidelines/app-icons
- Apple, Creating your app icon using Icon Composer: https://developer.apple.com/documentation/xcode/creating-your-app-icon-using-icon-composer
- Apple, Configuring your app icon: https://developer.apple.com/documentation/xcode/configuring-your-app-icon
- Expo, App icons guide: https://docs.expo.dev/guides/app-icons/
- Alpha-channel rejection reports (secondary): https://www.appsonair.com/blogs/exporting-pngs-without-alpha-a-real-world-app-store-problem
