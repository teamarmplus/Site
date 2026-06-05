# Insight Layer — Test Report

## Insight wording + math (test_insight.js 12/12)
GFA ~290 from 0.45x650; storeys ~2 from 9 m; granny vs ~450; subdivision comparison (no lot count).
Degradation: no FSR -> no GFA; no numbers -> no insight; non-resi -> no resi insight.

## SAFETY (proven)
Safety grep CLEAN across sv-check/parcel/suggest. test_insight asserts ABSENCE of: can build,
can subdivide, yield count (\d+ lots possible/achievable), approved, guaranteed, adds value, value-add.
Present: "subject to / a planner can / confirm with council" framing.

## Parcel-polygon dimensions
Canley Vale propid -> frontageApprox 19 m, depthApprox 35 m (consistent with 661 m2). Used as fallback
when user enters nothing; user input wins.

## Offline gate
node --check sv-check/parcel/suggest OK; geocode/nearby unchanged; release-check 106/0; cache-bust 9.
regression: insight 12/0, suggest 4/0, parcel 22/0, parcel_p2 16/0, parcel_p4 7/0, render 25/0,
constraints 18/0, nearby 16/0, handler 8/0, banner 12/0. TOTAL 140 assertions, 0 failures.

## Verdict
USEFULNESS RAISED — insight layer live in logic, safety grep clean, 0 confident-wrong. Render eyeball
+ preview proving outstanding (T). Coverage/bushfire/nearby carried.
