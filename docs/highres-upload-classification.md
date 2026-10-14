# Root artwork classification and relocation

All 18 anonymous user-uploaded `file_*.png` images have now been **identified and preserved as Git blobs**. Nothing has been resampled, re-encoded or lost.

## Thirteen original masters

Previously integrated in PR #249 as byte-identical sources under `art-source/ring-road-2026-10-13/originals/`. Includes all seven painted rings, transparent castle/arena/foreground cutouts and two UI material atlases. This PR removes only their redundant anonymous root-level aliases.

## Five alternate 1672×941 RGB originals

These did **not** byte-match the 1536×864 original source composition, so they are stored separately under `art-source/ring-road-2026-10-13/highres-uploads/`, retaining exact uploaded Git blob SHA:

| Source filename | Named preserved source | Git blob SHA | Visual identification |
|---|---|---|---|
| `file_000000000ea48230a3d3130fca41e906.png` | `ocean-sky-mountains-hires.png` | `b982a33990c6719ecf629e8d8c160ebcd534d1a2` | Ocean and distant mountains |
| `file_00000000256481fda616d1f8f15612bf.png` | `reference-complete-ui-hires.png` | `c564f63f608bbfe86318eb45b8401ebd48dddc4e` | Fully composited game art and HUD |
| `file_00000000a2048230bf7170d11fb386e3.png` | `reference-empty-arena-hires.png` | `d85835169a744edffec1eeae9a1ad81338ac68a0` | Clean scenic arena, no rings |
| `file_00000000ade082309d8ae7f54f8e4b36.png` | `reference-game-board-hires.png` | `69e3145d6216aada1c625964d8d7539491174a48` | Ring-board scene without interface |
| `file_00000000e8b481f8948f69f1164e9aee.png` | `reference-ui-checkerboard-hires.png` | `d47c08356eb81c857ec4e38cf6ec1014e7b79fd3` | UI flat sheet over **baked** checkerboard; no alpha |

Identifications were made from source-file dimensions, mode, 3×3 pixel samples, and generated thumbnails in the temporary GitHub CI job on #250. The five names describe *uploaded variants*, not a claim of exact pixel correspondence to the 1536×864 original reference.

The 20 optimized WebP runtime assets under `public/reference-skin/` are **already present on main** (independently validated by current CI), so this source housekeeping does not touch or regenerate them. See the active reference-fidelity plan and issue #244 for the outstanding mobile-art improvements.

### Source archival contract

- Master source art: keep originals unmodified under stable descriptive paths.
- Optimized `public/reference-skin` WebPs: separate generated/runtime asset collection with manifest and checksum gate.
- Never place a baked checkerboard or screenshot text into interactive rendered UI.
- Do not delete source originals to reduce browser download budget; Vite only ships public/imported runtime assets.

The user explicitly authorized renaming and consolidation of root uploads. The Git tree commit removes their redundant anonymous root names while reusing the *same* blob SHA under appropriate source directories.