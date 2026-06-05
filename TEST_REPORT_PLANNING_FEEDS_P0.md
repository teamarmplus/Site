# Planning Feeds P0 — Test Report

## Live-verified at 148 Canley Vale Road
HEIGHT (MAX_B_H) = 9 m · FSR (FSR) = 0.45 · FLOOD (Hazard/1) = none mapped in state layer (still verify).
Old fields/service confirmed broken: HEIGHT_MAX 400, FSR_MAX 400, EPI_Flood_Planning_Area 404.

## 3-state hazard safety (unit-proven)
404/400 error body -> 'error' · timeout -> 'error' · empty -> 'none' · feature -> 'present'.
Display: error -> "couldn't be checked — do not rely"; none -> "none mapped — still verify";
never "none detected". 'none detected in this check' occurrences in sv-check.js: 0.

## Service-health self-test (live)
Caught Bushfire service 404 (now fails safe). Zone/FSR/Height/Property/Cadastre OK; FSR=0.45, Height=9.

## Offline gate
node --check sv-check/parcel OK; geocode & nearby byte-identical; release-check 106/0; safety CLEAN.
regression: parcel 22/0, parcel_p2 16/0, parcel_p4 7/0, render 25/0, banner 12/0,
constraints 18/0 (updated to 3-state contract, +error-state assertion), nearby 16/0, handler 8/0,
nearby-render 14/0. TOTAL 158 assertions, 0 failures.

## Verdict
PLANNING FEEDS P0 FIXED (flood/height/FSR + error!=none, incl 404s). Parcel-polygon (Fix A),
bushfire URL, and the ≥20 validation table remain; flagged honestly.
