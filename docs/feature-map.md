# Jumpstart Atlas feature map and simplification plan

Reviewed October 18, 2026. This document records the application before the UX simplification pass, so reviewers can check that the redesigned interface preserves its intentions. **Observed** describes the source at the start of the review; **proposed** describes a design recommendation, not a claim that it has shipped. Implementation and runtime verification should be checked against the final diff and test results.

The review covers `index.html` and [development conventions](development.md). Function names below are stable search anchors; line numbers would drift during the redesign. Layout recommendations apply the `better-layout` principles of importance order, shared edges, visible disclosure, and adaptable controls. Copy recommendations apply `better-writing`: consistent vocabulary, verb-first actions, and actionable empty states.

## Product intention

Help someone discover Foundations Jumpstart themes, identify which exact packs their cards can build, combine two packs, and keep useful combinations for play. Browsing and experimenting must work without importing a collection. Collection management adds availability information; it must not become a prerequisite for mixing or testing hands.

The catalog contains 46 themes, 121 exact 20-card variants, 768 unique card names, and 7,381 unordered two-pack recipes including identical variants. The bundled catalog is authoritative for deck contents. Scryfall adds rules, printings, images, and related tokens; it does not replace the decklists.

## Domain vocabulary to preserve

| Term | Meaning | Design consequence |
| --- | --- | --- |
| Theme | Named family such as Angels, with one to four versions | A theme card opens its exact versions; theme rarity is separate from card rarity. |
| Pack / version | One exact 20-card catalog list | Show the version wherever someone chooses, confirms, shares, or compares a pack. |
| Card inventory | Copies owned, combined by normalized English name | A different printing is not a different inventory item. |
| Confirmed pack | A particular physical pack represented by reserved inventory copies | Confirmation is an explicit action; availability is not proof of ownership. |
| Available / buildable | Required copies can be supplied under the current basic-land rule and reservations | Do not replace this with an “Owned” label. |
| Unowned card | No copies recorded | A dot may summarize this, but it needs an accessible label. |
| Unowned version | That exact pack has not been confirmed | It may still be buildable from loose cards. |
| Missing copies | Required quantity unavailable for the selected pack or recipe | A card may be owned but still lack enough copies; this differs from “Unowned.” |
| Saved mix / play deck | Named two-pack recipe with notes and a star | Saving never reserves inventory or consumes cards. |
| Synergy | Shared theme tags plus a small color bonus | Keep the meaning visible on demand; never imply a win rate or tested strength. |
| BREAD / draft roles | Editorial card-role guidance | Letters sit beside names. Full role names can be optional; ratings are not pick orders. |

## Navigation and cross-cutting behavior

**Observed entry points:** desktop sidebar and mobile navigation drawer; global search; five hash routes: `#explore`, `#cards`, `#collection`, `#pairings`, and `#saved`. Guide, import, settings, and about open dialogs. Main page renderers are `navHTML`, `topbarHTML`, `render`, and `navigate`.

| Capability | Preserve | Proposed simplification |
| --- | --- | --- |
| Browse the five destinations | Distinct collection, catalog, mixing, and saved-recipe intentions; current-page indication | Use short navigation names and one page title. Avoid repeating breadcrumb, eyebrow, heading, and descriptive tagline before every working surface. |
| Global card search | Search entry from every main view and `/` shortcut | Keep the search icon obvious on mobile; make its accessible name describe card search. |
| Local collection status | Device-local persistence, visible storage failures, recovery path | Put ordinary “Saved on this device” status in settings/navigation; keep actionable storage errors prominent. |
| Current mix dock outside mixing room | Selected variants, empty-half chooser, open mixing room, clear selection | Compact it to the two pack names and one open action; retain a clear-menu action and safe-area spacing. |
| Contextual dialog navigation | Previous/next within the source list; nested Back; scroll restoration | Use a compact position control next to the dialog heading. Back must restore the actual parent, including hand history and filters. |
| Copying | Scryfall-compatible decklists for card, pack, recipe, and visible-list actions | Standardize “Copy list”; show the scope in a menu or accessible label when it differs. JSON backup remains a download. |
| Layout preferences | Grid or horizontal shelf independently by context; persisted layout choices | One Display menu per working surface instead of repeated two-button layout rows. |

Route details matter: card search uses `q`; the mixing route uses `packs`, including empty fields for vacant positions; pack links can open a specific version through `pack`. Browser Back/Forward and reload must retain valid routes. Do not collapse the second half into the first when a half is removed.

## Explore themes

**Observed entry points:** Explore navigation, color shortcuts, a pack deep link, and the landing hero. Source anchors: `heroHTML`, `exploreHTML`, `filteredThemes`, `packHTML`, `showPack`.

**Capabilities:** browse color lanes or a grid; resize theme cards; select multiple colors; filter by catalog tag, collection status, or starred themes; search theme names, tags, and cards inside variants; star themes; open exact versions; jump to a color; generate a random mix from the hero. Theme cards show artwork, color, theme name, derived rarity, tags, variant count, collection coverage, and favorite state.

**Essential information:** theme name, color, number of versions, relevant collection status, and a clear open target. Keep theme tags available as meaningful discovery information. Common/Rare/Mythic derives from 4/2/1 variants.

**Optional information:** marketing copy, overall catalog totals, rarity explanation, progress bars that duplicate a coverage badge, individual variant dots, card-size controls, and navigation hints after someone knows how shelves work.

**Proposed:** shorten the large hero into a compact introduction with a direct “Mix packs” action. Keep color selection, search, result count, Filters, and Display near the catalog. Put tag/status filters in Filters, and size/layout preferences in Display. Keep active-filter counts and a clear reset action visible while the panel is closed. Let grid mode avoid redundant shelf-arrow controls.

**Edge states:** filtered themes must expose only matching versions when opened; a theme may have both confirmed and unowned versions. Empty results need “Clear filters,” not an import-only escape. Without metadata or artwork, names and catalog structure remain usable.

## Card library and search

**Observed entry points:** Card library navigation, global search, `/`, search-guide examples, and inventory empty-state browsing. Source anchors: `cardLibraryHTML`, `filteredCards`, `scheduleLibrarySearch`, `runLibrarySearch`, `guideHTML`, `draftFilterHTML`.

**Capabilities:** Scryfall syntax with a smaller offline matcher; local `theme:` and ownership terms; card-name, Oracle text, type, mana cost, artist, flavor, lore, criteria, set, colors, color identity, numerical stats, format legality, prices, rarity, and game controls; catalog-tag and BREAD filters; hide lands; all printings; sort by name/mana/rarity/ownership; grid/shelf; 40-result pages; copy the full filtered list; card detail and context navigation.

Advanced fields compose the search string. Remote results remain intersected with catalog membership; a broad set query does not add a second card catalog. Local theme and ownership terms still apply to remote hits. Old remote responses must not overwrite a newer query.

**Essential information:** search field with a real label, result count, filters that currently change the result, card names/art, ownership state, and recoverable search errors.

**Optional information:** advanced query builder, syntax examples, per-card printing number/rarity/owned count, full draft-role labels, metadata-source success notices, sort, and layout.

**Proposed:** one toolbar with result count, Filters, Display, and More. Group advanced search beneath a recognizable “Advanced search” disclosure; keep the authored query visible. Move layout, printings, and full role-label preferences into Display. Place copy in More. Loading can use a short status line; retain the distinction between remote search, offline fallback, and partial metadata where it changes trust in results.

**Edge states:** malformed syntax, zero hits, empty query, unavailable Scryfall, partially hydrated metadata, stale requests, all-printing expansion, and intersecting role/ownership/theme filters. “Reset search and filters” must clear role selections as well as the query. Draft roles match any selected role, then intersect with other criteria.

## Pack and version dialogs

**Observed entry points:** theme cards, collection matches/confirmed rows, card membership, comparison, and mixing slots. Source anchors: `packDialogHTML`, `expansionHTML`, `packNavigation`, `compareDialogHTML`.

**Capabilities:** version tabs; context-aware previous/next; catalog description/tags/rarity; 20-card list; optional lands; grid/shelf; BREAD summaries and filters; owned/unowned/missing-copy filters; pairing; token viewer; add a physical pack; confirm from existing cards; unconfirm one; copy full or missing list; compare nonland differences; source-correction notes.

**Essential information:** theme and version, variant selection, card contents, availability, and “Pair this pack.” A missing-copy count should open its details. Keep tokens discoverable from the deck context.

**Optional information:** full theme description, matching-rule explanation, BREAD totals/long labels, alternate layout, source-correction explanation, copy, and collection-maintenance actions.

**Proposed:** remove duplicate dialog/body titles. Combine version selection and primary action into a short header region, then one toolbar for Filters, Display, Tokens, and More. Put Add physical pack / Confirm from cards / Unconfirm in a clearly named collection menu, retaining the existing consequence dialogs. Keep Compare near the version chooser. Move matching assumptions into a labeled disclosure near availability.

**Edge states:** one-version themes; a filtered subset of versions; empty filtered card lists; incomplete Scryfall data; no missing copies; an owned pack that also has enough loose cards for another copy; source lists with corrected basic lands. Full-list copying and BREAD totals must not accidentally become filtered-list operations.

## Card detail dialog

**Observed entry points:** artwork, card-name controls, membership lists, missing-copy links, hands, and the hero. Source anchors: `cardDialogHTML`, `showCard`, `savedMembershipHTML`, printing-preview helpers.

**Capabilities:** large image; printing selection; rules, type, mana, rarity, color identity, power/toughness or artist, flavor; full role explanations; owned quantity stepper and reserved quantity; matched J25 printings with hover/tap preview; containing packs with ownership filter; saved-recipe membership; external Scryfall and LigaMagic links; lazy rulings; previous/next in the source list.

**Essential information:** name, artwork, gameplay rules/type/mana, collection quantity, and where the card appears. Quantity controls must never reduce below reserved copies or exceed the supported maximum.

**Optional information:** flavor text, artist/printing list, alternate-printing picker when unused, detailed role glossary, external links, and rulings until requested.

**Proposed:** retain rules beside or below art, followed by a compact quantity control and containing-pack disclosure. Group full printing information in “Printings,” secondary metadata in “Details,” and external actions/rulings in one action area. Avoid both a printing selector and fully expanded printing inventory taking permanent space. On touch, previews must be reachable without hover.

**Edge states:** no metadata; no images; no rulings; failed rulings; one versus several printings; zero owned copies; all owned copies reserved; no containing packs under the chosen filter; more than 12 saved memberships. Keep ownership by English name explicit when someone inspects printing details.

## Collection, inventory, and allocations

**Observed entry points:** My collection navigation, import completion, pack confirmation, card quantity changes, and the guide. Source anchors: `collectionHTML`, `matchHTML`, `computeDerived`, `filteredCandidates`, `quantityHTML`, `commitPack`, `simpleModalHTML`.

**Capabilities:** totals for copies/names/confirmed packs/themes; global tag filter; three tabs for candidate matches, card inventory, and confirmed packs; candidate completeness filters and incremental “more”; missing-card links; exclusive or shared-pool scoring; suggested allocation preview and explicit commit; inventory search/ownership/draft filters and 50-name pages; quantity editing; release one confirmed pack; pairing from a confirmed row; copy lists; backup; one-level import undo.

**Essential information:** current tab, its result count, availability/quantity state, the exact version, and its primary action. Candidate matching must explain that candidates do not prove the original physical booster. Confirmed and unallocated quantities must remain distinct.

**Optional information:** four large statistic cards, theme-completion percentage, repeated basic-land explanation, the shared-pool toggle, layout controls, suggested allocations, and bulk-copy actions.

**Proposed:** replace four statistic panels with one compact summary, optionally expandable for detail. Put tabs immediately after the title/summary. Each tab gets one toolbar; move shared-pool matching and tag/completeness filters into Filters, and bulk copying/suggested allocation/backup into More. Keep import directly visible as the collection's primary entry action. Show “Confirm” only where it is meaningful, with shortages easy to inspect.

**Invariants:**

- Add physical pack adds all 20 card copies and confirms that version. Confirm from cards reserves existing copies and adds none. Unconfirm releases reservations and deletes no cards.
- Confirmed packs reserve first. Default candidate matching assigns a leftover copy to at most one candidate, prioritizing complete packs. Shared-pool mode can deliberately show overlapping candidates.
- Suggested allocations are quantity-safe heuristics, not proof of original packs or a guaranteed maximum solution. Review remains explicit.
- Basic lands are assumed available by default; nonbasic lands always count. Requiring basics must preserve valid reservations.
- A recipe may use its exact confirmed packs and loose cards, but not reservations held for other versions. Identical halves require sufficient multiplicity.

## CSV import and recovery

**Observed entry points:** navigation Import collection, empty states, and collection guide. Source anchors: `importDialogHTML`, `readCSVFile`, `recalculateImport`, `commitImport`, `columnMappingHTML`.

**Capabilities:** local CSV/TSV file selection and drag/drop; comma/tab/semicolon detection; UTF encodings; 10 MB/50,000-row boundaries; common and Mythic Tools columns; editable mapping; template download; example-data preview; optional explicit-J25 restriction; accepted/excluded-row summary; full issue-report download; add or replace; preserve or explicitly release existing assignments; optional confirmation of uniquely matched Pack/container groups; exclusions acknowledgment; import undo.

**Essential information:** filename, accepted card/copy totals, unresolved problems, Add versus Replace consequences, reservation conflicts, and the final action's precise wording. Demo data must remain unmistakably labeled.

**Optional information:** exporter compatibility prose, template help after a file is loaded, all group preview rows, mapping when inference is correct, and full issue rows after a concise error summary.

**Proposed:** keep this task a focused dialog, with file choice followed by a review screen. Collapse compatibility/mapping details by default, but automatically open the relevant section on errors. Use a compact summary and labeled “Groups” and “Excluded rows” disclosures. Do not tuck the destructive Add/Replace choice or excluded-row acknowledgment into a menu.

**Edge states:** malformed/oversized/empty files, missing columns, unsupported encoding, ambiguous names/IDs, metadata needed to match IDs, repeated imports, quantity limits, allocation conflicts, ambiguous or incomplete groups, and zero accepted copies. Rows differing by foil, finish, condition, or language do not become separate inventory identities. Import never silently proves or confirms a physical booster.

## Mixing room and pairing discovery

**Observed entry points:** navigation, hero shuffle, Pair this pack, current-mix dock, saved deck dialog, and shared route. Source anchors: `builderHTML`, `pairingsHTML`, `filteredPairs`, `randomPair`, `pairAdd`, `pairCardHTML`, `pickerHTML`.

**Capabilities:** two fixed slots; add/change/remove; shuffle each half; shuffle both; choose exact versions through search/tag/ownership filters; incomplete state; total cards/nonlands/lands/average mana; availability; optional 40-card list and mana curve; copy full/missing lists; share URL; save; test opening hands; browse all unordered pairs with search/tag/color/availability/identical filters; shared-tag ranking; pagination and layout.

**Essential information:** both identities and versions, visible Add/Shuffle for an empty slot, visible change/remove/shuffle for a selected half, whether the mix is complete, availability, and direct Test hand / Save actions for a complete mix.

**Optional information:** descriptive headings and helper prose, four separate statistic blocks, full curve/list, synergy scores/meter, selection explanation, bulk-copy results, and sharing.

**Proposed:** use one “Mix packs” heading and compact slots. Show the core totals in one line; put full statistics and list behind an explicit Details/View cards control. Keep Surprise me and each half's Shuffle exposed. Put copy/share in More. Pairing results get one toolbar with result count, search, Filters, Display, and bulk actions. A pairing card needs title, color/availability, selected shared tags, a direct hand-test action, and one selection/open action; secondary copy actions belong in overflow.

**Edge states:** no selected halves; only slot 1; only slot 2; identical halves; no alternative under filters; filtered results constrained by both selected halves; empty pair results; insufficient copies; unloaded mana data. Surprise me respects browsing filters, ignores selected halves, and excludes the current unordered recipe. Per-half shuffle keeps the other half and chooses a different eligible variant. Failed randomization leaves state intact and explains the constraint.

**Design tension to retain visibly:** selecting two halves narrows the discovery result list to that exact recipe. If the result list is collapsed or shortened, still explain the selected-half constraint and offer an obvious way to clear a half. Do not silently change the matching semantics during a visual redesign.

## Saved mixes and complete deck dialog

**Observed entry points:** Saved play decks navigation; save form; pairing-card artwork/title; saved membership in card details. Source anchors: `savedHTML`, `pairCardHTML`, `saveDialogHTML`, `saveRecipe`, `playDeckDialogHTML`.

**Capabilities:** name/notes/star; create/edit/duplicate/delete with confirmation; search names/notes/ingredients; tag and availability filters; starred-first ordering; layout; copy recipe or filtered recipes; open complete deck; load into mixer; test hands; tokens; filter deck cards; inspect each half; see/copy shortages; backup.

**Essential information:** saved name, both exact ingredients, current availability, and a clear open action. Keep hand testing directly available from the saved item or its first-level deck dialog. A saved name alone cannot identify the versions.

**Optional information:** full notes, exact synergy score and meter, repeated “40 cards / 2 packs,” nonessential metadata, and maintenance actions.

**Proposed:** one content block per saved card with title, ingredients, concise availability and optional notes preview; one action row with Test hand, star, and More. More groups Edit, Duplicate, Copy list, and Delete. Distinguish an empty collection from an empty filtered result: the latter should offer reset. In the deck dialog, combine totals/availability into a summary line and put card filters/display/secondary actions in one toolbar. Preserve both halves' identity even when their card lists look alike.

**Edge states:** unavailable wish-list recipes, same pair saved under different names, identical halves, missing-card changes after import, empty notes, name/notes limits, deletion cancel, and stale availability after inventory updates. Deleting or editing a recipe must not modify inventory or confirmed packs.

## Opening hands and next draws

**Observed entry points:** complete mixing-room builder, pairing cards, saved cards, and deck dialogs. Source anchors: `dealSample`, `handsDialogHTML`, `test-hands`/`deal-hand` actions.

**Capabilities:** seven-card opening hand plus next three ordered draws; Shuffle & deal again; previous/next samples; card inspection; return to the exact sample through nested Back.

**Essential information:** recipe identity, sample number, seven opening cards, three labeled draws, and a direct deal-again action.

**Optional information:** a full explanation of the shuffle algorithm or repeated recipe description.

**Proposed:** retain a compact stable control row for Deal again and sample history. Put “40-card deck, including lands; samples last until this dialog closes” in a short help disclosure. Mobile cards must remain readable with a clear horizontal-scroll cue if a hand shelf is used.

**Invariants:** expand quantities from both complete catalog lists, including lands and repeated copies; shuffle all 40 cards with Fisher–Yates; draw without replacement within a sample; filters and ownership never alter the sampled deck. Separate samples can repeat cards. History is temporary and is not part of the saved recipe. This is an opening-hand sampler, not a full game engine or mulligan simulator.

## Related tokens and emblems

**Observed entry points:** View tokens in pack and complete-deck dialogs. Source anchors: `tokensButton`, `loadDeckTokens`, `tokensDialogHTML`, `ScryfallService.relatedToken`.

**Capabilities:** fetch token/emblem relationships from all printings of cards in the full pack or both halves; show image, name, type, power/toughness, rules, source cards, and Scryfall link; deduplicate Oracle identities; retry failures; cache with offline stale fallback.

**Essential information:** token identity/image, creating cards, loading/failure/verified-empty state, and retry.

**Optional information:** full rules already legible in the image, extra printing metadata, external links, and a long explanation of token discovery.

**Proposed:** keep a visible Tokens action within deck tools; allow rules/source details to expand per token if needed. Avoid treating an unloaded list as “No tokens.”

**Invariants:** consider the full deck regardless of filters; token objects never enter the primary catalog or inventory; cache under `token:<id>` separately; do not lose creating-card attribution when deduplicating. Scryfall relationships are not exhaustive for copy effects, so retain a brief explanation.

## Settings, backup, offline support, and help

**Observed entry points:** navigation Settings & backups, About footer, Guide, collection basic-land setting, sync retry notices. Source anchors: `settingsHTML`, `guideHTML`, `backupExport`, `restoreFile`, `saveCollection`, `syncCards`, `cacheAllArt`.

**Capabilities:** require basic land quantities; JSON export/validated restore; inventory copy; reset personal data; unreadable-data export; metadata refresh; cached-data status; optional image cache and cancel; catalog source and list corrections; attribution/privacy; search guide and navigation shortcuts. Cross-tab storage updates refresh the current state.

**Essential information:** device-local storage/no account, backup/restore, basic-land setting, storage failures, unreadable-data recovery, and exact consequences of replacement/reset.

**Optional information:** catalog history, detailed cache mechanics, publisher attribution, full source correction text, and general tutorial copy.

**Proposed:** group into Collection, Data & backup, Card data, and About disclosures. Keep backup discoverable without requiring someone to read About. Show technical cache details only when someone opens that section. Keep recovery errors and destructive confirmations expanded and plain.

**Invariants:** preserve `jumpstart-atlas.collection.v1`, schema, normalized-name inventory, saved recipes, and confirmed allocations. Layout preferences remain separate in `jumpstart-atlas.preferences.v1`. Bad saved data must not be overwritten silently. Failed storage writes must be identified as session-only. Reset leaves the bundled catalog/cache intact; restore replaces personal data after validation. JSON backup, import issues, templates, and recovery dumps remain downloads.

## Interaction and accessibility contract

**Observed:** dialogs trap Tab focus, make the main application inert, restore opener focus, support Escape and nested Back, and preserve parent scroll. Left/right arrows navigate context dialogs; `/` focuses search outside editable inputs; arrows move across theme shelves and between color lanes. The CSV drop target supports Enter/Space. Printing previews support hover and touch pinning. Horizontal shelves support drag and arrow buttons.

**Proposed controls contract:**

1. Filters is a labeled button with expanded state, active count, and a nearby reset path. An applied filter remains discoverable when its surface closes.
2. Display contains only presentation preferences: grid/shelf, density/details, and role labels. Toggling detail must not alter ownership, availability, catalog contents, or sampled cards.
3. More contains secondary actions, using real buttons or links. Menus must not require hover, and only one contextual surface should be open at a time.
4. Escape first closes the foremost menu/popover, then the containing dialog. Click/tap outside dismisses transient menus. Return focus to the trigger when appropriate.
5. Use normal semantic forms for filter controls. Do not apply `role="menu"` to arbitrary input panels without implementing the required keyboard model.
6. On mobile, popovers need a viewport-bounded width and height, internal scrolling for long content, and sufficient safe-area spacing. They must not move essential actions offscreen.
7. Ownership dots keep text alternatives; icon-only actions get specific accessible names. Active filters, warnings, and shortages cannot depend only on color.
8. Keep two-column card grids useful at 320–600 CSS pixels; shrink tracks rather than overflow. Preserve card-name wrapping and visible touch targets when reducing vertical space.

These interaction additions are recommendations until exercised in the browser; the source audit does not certify runtime focus, zoom, touch, or overflow behavior.

## Priority and scope decisions

| Priority | Change | Why it preserves the intention |
| --- | --- | --- |
| 1 | One heading and one contextual toolbar per surface | Removes repeated chrome while keeping the task and active state obvious. |
| 1 | Filters / Display / More pattern across pages and dialogs | Makes secondary information available without paying for every control on every screen. |
| 1 | Compact mobile mixing slots and saved cards | Brings both ingredients and hand testing closer together without hiding the operations requested previously. |
| 1 | Summary/detail presentation toggle | Supports both information-rich browsing and a quieter first view; preference stays separate from collection data. |
| 1 | Accessible popover dismissal, focus, active-state indicators, and viewport bounds | Prevents visual simplification from making controls unreachable. |
| 2 | Compact collection totals and source-aware matching explanations | Keeps quantities and reservations clear while moving repeated explanation out of the way. |
| 2 | Flatten card/pack/deck dialog headers | Reduces nested titles and action rows before the actual cards. |
| 2 | Group settings and secondary card metadata | Keeps maintenance and reference information reachable at the point of need. |
| 3 | Unify terminology and empty-state recovery | Makes actions predictable and distinguishes a blank collection from filters that hide existing data. |

Keep the single-file runtime, catalog, filtering semantics, allocation logic, copy formats, and schema. The simplification should reorganize presentation and access, not introduce a second catalog, account system, build step, numerical pick-order model, win-rate ranking, or automatic ownership inference.

## Preservation checklist for browser verification

| Journey | Required checks |
| --- | --- |
| Explore to pack to card | Open a filtered version; switch versions; compare; inspect a card; Back restores the parent; no duplicate/hidden critical heading or action. |
| Library | Simple and advanced query; ownership/theme/role intersection; all printings; empty result reset; copy scope; display preference survives reload. |
| Collection | Add physical pack; reserve existing copies; prevent removal below reserved quantity; unconfirm without deleting cards; verify matching recalculation and shared-pool toggle. |
| Import and backup | Preview example; map columns; require exclusion acknowledgment; test replacement conflict; add versus replace; undo; export/restore preserves recipes and reservations. |
| Mixing | Shuffle both; shuffle either half; remove either half; add/shuffle empty half; reload positional URL; identical halves; no alternative; missing-copy availability. |
| Saved mixes | Save/edit/star/duplicate/delete-cancel/delete; search and reset; load exact versions; copy; inventory stays unchanged. |
| Hands | Ten draws use at most catalog copy counts; separate 7+3 sections; repeated samples and history; card inspection returns to sample. |
| Tokens | Full-deck relationships; duplicate token deduplication; source attribution; loading, verified empty, retry, and offline cache. |
| Mobile and keyboard | 320, 390/412, 768, and desktop widths; 200% zoom; no page overflow; popover edges; touch targets; Tab/Shift-Tab/Escape; nested dialogs; focus restoration. |
| Failure handling | No Scryfall; partial metadata; no artwork; failed storage; unreadable saved data; cross-tab update; filter-empty versus collection-empty states. |

This mapping used source inspection. Runtime interaction, 200% zoom, RTL mirroring, localization growth, assistive-technology behavior, and deployment were **not verified by this document's author**; the implementation owner should record those checks separately and avoid claiming unrun coverage.

## Implemented simplifications

The redesign implements the shared **Filters / View / More** vocabulary (View is
the final label for the proposed Display menu). Search, import, mix add/change,
shuffle, hand testing and saving remain direct actions. Secondary copy, token,
comparison and maintenance commands are one menu away. All five destinations and
the domain vocabulary above remain intact.

Explore and the library now lead with their working controls and results. Collection
uses a single totals line and compact section controls. Mixing uses one two-slot
composer followed by recommendations. Saved cards show identity and availability,
with secondary actions in More. Pack and play-deck dialogs use the same toolbar;
card printings and containing packs use named disclosures.

**View → More details** defaults off and persists separately from collection data.
It restores supplemental descriptions, tags, mix statistics and printing metadata.
BREAD descriptions remain an independent preference; BREAD letters and ownership
stay visible in either presentation. Settings keeps its existing grouped sections
and improves keyboard access to Restore, rather than implementing every proposed
disclosure. Hand and token viewers preserve their dedicated presentations.

See [development.md](development.md) for interaction behavior and runnable local
checks, and [interface-design.md](interface-design.md) for measured layout/contrast
evidence. The proposals above are the original audit, not additional promises or
claims of automated coverage for every edge case.
