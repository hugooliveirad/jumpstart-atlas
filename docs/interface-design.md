# Interface design: useful detail, fewer layers

Design investigation: October 18, 2026. This document records the evidence and design decisions for simplifying the existing single-file application. It complements the feature inventory; it does not replace the catalog or collection rules in [development.md](development.md).

## What the interface needs to make easy

The shortest recurring journeys are finding a pack, understanding its cards, choosing two halves, sampling a hand, and returning to a saved combination. Collectors also need to distinguish cards they own, packs they confirmed, and combinations they can build. These distinctions are essential information; the surrounding explanatory paragraphs and secondary actions do not need permanent space.

Preserve every feature through a visible primary control, a clearly named menu, or a contextual detail view. A compact interface must not change ownership semantics, silently disable filters, or replace existing collection data.

## Sources and principles

The sources below are Apple's current official Human Interface Guidelines, checked October 18, 2026. Their HTML documents require JavaScript; the linked `.md` representations supplied the full text. These are platform design principles adapted to a browser application, not a claim that this website is a native Apple application.

| Source | Principle supported by the source | Application decision |
| --- | --- | --- |
| [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Markdown](https://developer.apple.com/design/human-interface-guidelines/layout.md) | Put important content first; group related controls; disclose secondary content progressively; adapt to available space while preserving functionality. | Reduce stacked introductions and repeated labels. Use one compact content toolbar, preserve the same features at narrow widths, and let content determine the responsive layout. |
| [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars), [Markdown](https://developer.apple.com/design/human-interface-guidelines/toolbars.md) | Prioritize the main tasks, group controls by purpose, keep titles concise, and place less important actions in More when needed. Use only one prominently emphasized primary action. | Search, Filters, View, and contextual More form the common control vocabulary. Keep frequent mixing actions directly accessible. Do not bury every command solely to achieve visual minimalism. |
| [Menus](https://developer.apple.com/design/human-interface-guidelines/menus), [Markdown](https://developer.apple.com/design/human-interface-guidelines/menus.md) | Label actions concisely, prioritize frequently used commands, group related choices, indicate toggled states, and use submenus sparingly. | Prefer flat contextual menus. Copy, rename, favorite, and delete can share a recipe menu; display options belong in View. Checkboxes communicate active display settings. Filters show active counts and a clear reset action. |
| [Popovers](https://developer.apple.com/design/human-interface-guidelines/popovers), [Markdown](https://developer.apple.com/design/human-interface-guidelines/popovers.md) | Keep transient controls focused on a few related tasks, anchor them near their source, show one at a time, preserve edits on dismissal, and avoid cascades. Compact layouts should use a sheet or fuller presentation. | Native browser popovers are the interaction primitive. Wide layouts anchor to the trigger; narrow layouts use an inset sheet near the lower edge. Escape and outside taps dismiss. Multi-selection filters remain open while being changed. |
| [Disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls), [Markdown](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls.md) | Keep common functionality visible, give disclosures descriptive labels, and position each control near the content it changes. Avoid proliferating disclosure buttons. | A persistent Details preference reveals secondary descriptions and analysis. Keep targeted disclosures for genuinely separate long content, such as source notes. Do not replace a stack of rows with a stack of disclosure triangles. |
| [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Markdown](https://developer.apple.com/design/human-interface-guidelines/accessibility.md) | Support enlarged text, adequate contrast, multiple cues for state, comfortable controls, and reduced motion. The current guideline lists 44×44pt as the default iOS/iPadOS target and 28×28pt as its minimum. | Use a 44 CSS pixel touch-target goal for this website, independently of the native point unit. Use at least 16px mobile form text, visible focus, meaningful accessible names, and labels or shapes alongside status colors. Test narrow layouts, text scaling, and keyboard dismissal. |

These adaptations deliberately retain the app's dark palette and card artwork. No native framework, imitation glass effects, build system, or new dependency is needed.

## Baseline observations

Browser inspection used the running local site at widths 390px and 1280px, with a fresh collection and Scryfall API requests blocked to expose the bundled-data fallback. Screenshots were inspected for Explore, Cards, Collection, Mixing, and Saved. This is baseline evidence, not a claim that all redesigned states have passed verification.

| Surface | Observed problem | Intended simplification |
| --- | --- | --- |
| Explore | At 390px, the first theme begins at y=843. Hero artwork, promotional text, another heading, layout controls, colors, tags, ownership, and search consume the first screen. | Keep a compact welcome strip and make search immediate. Put color/tag/ownership options in Filters; layout and size in View. Keep favorite and pack identity on each card. |
| Card library | The first card begins at y=496 in offline fallback. The page has separate introduction, search, tips, connection notice, count, copy/layout, and filter/detail rows. | Search leads; one control row carries count and secondary tools. Put search help inside its existing help entry, collapse fallback prose to a concise status with further explanation available, and combine display preferences in View. |
| Collection | Desktop displays four statistic panels, a basic-land sentence, backup action, tag row, tabs, candidate notice, count, and toolbar before meaningful content. | Put essential totals in one compact summary. Retain the three distinct collection views, move tag/matching settings into contextual Filters, and put backup/copy/import tools in one clear action group. |
| Mixing | At 390px, two introductory headings and two tall empty slots extend the composer through roughly y=834. | Use one title and a compact pair composer. Give each half a clear identity or empty prompt, plus shuffle and add/change. Keep remove accessible. Put supporting analysis behind Details. |
| Saved | The empty view still presents copy/layout controls that have little utility before saving any deck. | Show the next useful action prominently in empty states. With saved data, show the deck name, halves, ownership/buildability, and direct hand testing; move rename/copy/delete to each deck's menu. |
| Pack/deck dialogs | Inspection of templates shows repeated title, tags, description, variant tabs, metadata, role summary, layout controls, filter controls, and footer actions. | Preserve variants and contents near the top. Share Filters/View/More patterns with the main views; keep Tokens and Test hands discoverable. Consolidate collection mutations in a clearly named contextual menu. |

The 390px audit measured add/shuffle controls at 31px tall, layout controls at 24–32px tall, and several search controls at 22px. These measurements motivate larger targets while removing surrounding containers and labels; reducing information density must not make controls harder to activate.

## Information contract

Always visible where relevant:

- The name, version, quantity, and identity of the object being acted on.
- Current filter state, result count, and whether a selection is incomplete.
- Ownership/buildability and missing-copy status sufficient to avoid confusing a possible recipe with a confirmed physical pack.
- The primary next action and the means to open the object's detail view.
- Errors that block work, and any storage warning that affects persistence.

Available through View or contextual details:

- Full theme descriptions, supplemental tags, detailed BREAD explanations, synergy explanation, and supporting numerical analysis.
- Layout, card size, role labels, and other presentation-only choices.
- Educational copy about the workflow and detailed source corrections.

Filters and presentation options must remain separate: hiding a description should never change the result set. Existing role filters remain functional even when role labels are hidden. Switching between compact and detailed presentation must not clear the selected mix, hand samples, card quantities, or search.

## Interaction contract

1. Every popover trigger has a meaningful name and expanded state. Use native popover behavior where supported; guard feature detection where a fallback is necessary.
2. A menu command closes its menu before opening a dialog. Multi-choice filters stay open while selections change. No nested overlay stack is introduced.
3. Escape first dismisses the current transient control. It must not also close its parent dialog on the same keystroke.
4. Return focus to the trigger after dismissal. Keyboard focus must never move to offscreen mobile navigation or remain in hidden popover content.
5. Popovers fit within the viewport after resizing and scrolling. On narrow screens use safe-area padding and allow internal scrolling so every command can be reached.
6. Preserve destructive confirmations for reset, restore, and saved-deck deletion. A menu is an entry point, not authorization to bypass existing confirmations.
7. Keep contextual labels precise: Copy cards, Copy missing cards, Add known pack, Confirm from cards, and Remove from mix mean different things.
8. Use one primary accent-filled action per logical task. Neutral icon buttons may carry common commands; unfamiliar actions need text labels.

## Color and UI audit

The existing semantic palette is usable. Retain the hex notation and semantic token roles rather than introducing another color system. Measurements below use the WCAG relative-luminance formula on the computed opaque token values, not estimates from screenshot pixels.

| Foreground | Background | Contrast |
| --- | --- | --- |
| Text `#ecebf1` | Page `#111116` | 15.88:1 |
| Muted `#93919e` | Page / panel / raised panel | 6.08:1 / 5.59:1 / 5.22:1 |
| Faint `#656370` | Page / panel / raised panel | 3.20:1 / 2.94:1 / 2.75:1 |
| Accent `#bca7f2` | Page / panel / raised panel | 8.92:1 / 8.20:1 / 7.66:1 |

Panel is `#1a1a21`; raised panel is `#202028`. Small meaningful text using Faint falls below 4.5:1. Assign readable semantic text tokens or adjust that role under the authorized redesign, then measure again. Image-overlay contrast and every individual hard-coded color require separate rendered checks.

| Severity | Baseline location | Before | Target | Principle and impact |
| --- | --- | --- | --- | --- |
| HIGH | `index.html:10`, metadata uses throughout rendering functions | Faint text token falls below normal-text contrast thresholds | Readable meaningful metadata on every actual surface | Text contrast: users must be able to read counts, versions, and explanatory state. |
| MEDIUM | `index.html:13`, `.icon-button` | Broad `transition:.2s` implicitly animates all properties | Explicit color/background/border properties and short interaction transitions | Transition only what changes; avoid accidental geometry animation. |
| MEDIUM | `index.html:13`, `index.html:15`, `index.html:21` | Many nested bordered panels and small control containers | Borders for structure; restrained elevation only on floating surfaces | Distinguish navigation and transient tools without giving every row its own visual hierarchy. |
| LOW | `index.html:13`, buttons | Hover lift without a consistent pressed state | Consistent subtle pressed feedback, reduced-motion override | Feedback should confirm action without repeatedly drawing attention from cards. |

Baseline color review: **Block** on meaningful faint text pending correction. UI polish recommendations are scoped to inspected definitions and screenshots; no claim is made about uninspected animation states.

## Verification expectations

Validate all five main views plus pack, card, saved recipe, opening-hand, token, import, and settings dialogs. Cover 320px, typical phone widths, tablet width, and desktop. Check both simple and detailed display, empty and populated collections, active filters, reload persistence, offline metadata fallback, open-popover resizing, keyboard navigation, and reduced motion. Confirm that native dialogs remain scrollable and no viewport-level horizontal overflow appears.

The redesign's completion report should distinguish implemented and verified behavior from the proposals in this document. The source principles and baseline measurements remain useful even when implementation details change.

## Redesign implementation evidence

The redesign stylesheet was checked against the local application through browser style injection at 320px, 390px, and 1280px across all five main views. After correcting legacy shelf margins, none of those 15 page/width combinations produced viewport horizontal overflow. At 390px, Explore's first theme moved from y=843 to approximately y=326. The mobile Filters surface fit an inset sheet at x=10, width=370 in a 390px viewport. These checks cover layout and the opened Filters presentation; final integrated interaction and persistence checks are reported separately.

The revised Faint token is `#9a92a2`, measured at 6.28:1 on the page, 5.77:1 on the panel, 5.40:1 on the raised panel, 5.32:1 on the new popover `#24202b`, and 5.84:1 on the dialog `#1b1822`. Muted becomes `#aaa3b2` and measures 6.53:1 or higher on those same surfaces. The baseline faint-token blocker is resolved by these values. Missing-state badges also use the readable Muted role. These measurements do not certify every image-overlay or legacy hard-coded color.

The CSS preserves the dark purple palette, uses short explicit transitions, raises mobile controls to a 44px height, specifies 16px mobile fields, limits card-dialog artwork to 180px, and lets the navigation drawer scroll. Supplemental details are hidden only through explicit detail wrappers and descriptive text selectors; card identity, ownership, filter controls, and actions remain available. Color review of the revised token pairs: **Approve**, with unmeasured legacy colors outside that approval.

Final integrated review checked 36 rendered states at 320px, 412px, and 1280px with a populated collection, saved deck, pack/play/card dialogs, and filter/query surfaces. No document overflow, page exception, unnamed visible button, or sub-16px mobile field was found in that coverage. At 390px, the library now reaches its first card at y=372.5 (baseline y=496), and the empty mixing composer ends at y=486.875 (baseline approximately y=834). Keyboard popover/drawer focus, Escape restoration, scrollable navigation, and keyboard backup restore were independently exercised. Final placeholder contrast was corrected and measured at 6.98:1 on the library search surface. Integrated interface and mixing tests also passed at all three widths according to the delivery run. Screen-reader speech, physical-device behavior, real 200% browser zoom, and exhaustive image-overlay contrast remain outside this verification.
