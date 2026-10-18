# Star Path

Phone-first click-through navigator for Julie’s canon chronological Star Wars watch.

## Current master
- Source updated: 2026-10-03
- Total items: **547**
- **#1–20: Fun with Nubs**, grouped as a High Republic mini-block and intentionally left **unmarked** as newly added backfill
- Previously watched chronology remains watched through the shifted **#463 — The Mandalorian S3E3 “Chapter 19: The Convert”**, excluding the new Nubs backfill
- Current / next: **#464 — The Mandalorian S3E4 “Chapter 20: The Foundling”**
- **#538 Forces of Destiny S2E8 “Porg Problems” remains intentionally UNMARKED**

## Fun with Nubs placement
The 20 canon digital shorts are grouped together at the start of the High Republic section.
They are treated as approximately within the Young Jedi Adventures era rather than given a made-up episode-by-episode interleave.
They do not interrupt the active current position at Mando S3E4; they remain available as an unmarked backfill block.

## Features
- Previous / Watched / Next
- Watched auto-advances
- Full timeline search
- Jump to era
- Current-position jump that ignores unmarked backfill
- Saved browser progress
- Progress backup export
- TXT/JSON timeline import
- PWA manifest + offline cache

## Timeline rule
Use scene cues rather than inventing exact timestamps. Runtime offsets are guidance and can vary by Disney+ / cut / platform.

## Hosting
Static app. No build step and no paid service required.

## Marvel Cinematic Universe branch (added 2026-10-17)
- Use the **Star Wars / Marvel MCU** selector at the top of the site. Direct Marvel URL: `/marvel.html`.
- Bundled `marvel-list.json` contains **382 individual watch items** from **84 chronological movie/season/special blocks**: 38 films, 336 TV episodes, five One-Shots, and three specials.
- Includes Disney+ originals, Defenders shows, Agent Carter, multiverse/animated stories, and current releases through `VisionQuest` and `Spider-Man: Brand New Day`.
- TV shows advance one episode at a time; the canonical **ordering is season-level** unless placement is independently established. Episode names are generic when not verified, rather than invented.
- Built using the Marvel/Disney+ Complete MCU Timeline and current Rotten Tomatoes chronology with editorial additions such as `Spider-Man: No Way Home`.
- Multiverse projects are **viewing-order placements**, not assertions of same-universe dates.
- `VisionQuest` future episodes have release dates and cannot be marked watched early.
- **Progress stays independent:** Star Wars retains all `starpath.*.v3` browser keys and its 547-item bundled master; MCU uses separate `starpath.marvel.*.v1` browser keys. Neither path resets or imports over the other.
- Still static GitHub Pages with no build step or paid services. PWA caches both pages and catalogs.
