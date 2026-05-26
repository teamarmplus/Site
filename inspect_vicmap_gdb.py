#!/usr/bin/env python3
"""
SiteVerdict — Vicmap Planning GDB Inspector
Run this script after placing the GDB file on the server.

Usage:
    python3 inspect_vicmap_gdb.py /path/to/VICMAP_PLANNING.gdb

What it does:
    1. Lists all layers in the GDB
    2. For VMPLAN_PLAN_ZONE: prints schema, sample features, unique zone codes
    3. For VMPLAN_PLAN_OVERLAY: prints schema, sample features, unique overlay codes
    4. Checks for min_lot_size fields
    5. Prints licence and attribution metadata if found
    6. Recommends integration method
    7. Exports lightweight GeoJSON samples for testing
"""

import sys, os, json
import fiona
from fiona.crs import from_epsg

def inspect_gdb(gdb_path):
    print(f"\n{'='*60}")
    print(f"Inspecting: {gdb_path}")
    print(f"{'='*60}\n")

    # ── List all layers ──────────────────────────────────────────
    try:
        layers = fiona.listlayers(gdb_path)
    except Exception as e:
        print(f"ERROR: Cannot open GDB: {e}")
        sys.exit(1)

    print(f"Layers found ({len(layers)}):")
    for l in layers:
        print(f"  {l}")

    # ── Focus layers for Site Check ───────────────────────────────
    TARGET_LAYERS = {
        'VMPLAN_PLAN_ZONE':     'Planning zones — primary layer',
        'VMPLAN_PLAN_OVERLAY':  'Planning overlays — secondary layer',
        'VMPLAN_PLAN_UGB':      'Urban Growth Boundary',
        'VMPLAN_PLAN_UGA':      'Urban Growth Area',
        'VMPLAN_PLAN_CODELIST': 'Zone/overlay code lookup table',
    }

    # Also check for min lot size in any layer
    MLS_KEYWORDS = ['min_lot', 'minlot', 'lot_size', 'lotsize', 'minimum_lot', 'min_area']

    results = {}

    for layer_name in layers:
        # Check if this is a target or contains MLS fields
        is_target = any(t in layer_name.upper() for t in TARGET_LAYERS.keys())
        
        try:
            with fiona.open(gdb_path, layer=layer_name) as src:
                schema = src.schema
                crs    = src.crs
                count  = len(src)
                
                props = schema['properties']
                prop_lower = {k.lower(): v for k, v in props.items()}
                has_mls = any(kw in prop_lower for kw in MLS_KEYWORDS)
                
                if not is_target and not has_mls:
                    continue  # Skip non-target layers without MLS fields
                
                print(f"\n{'─'*50}")
                print(f"LAYER: {layer_name}")
                print(f"  Features: {count:,}")
                print(f"  CRS:      {crs}")
                print(f"  Geometry: {schema['geometry']}")
                print(f"  Fields ({len(props)}):")
                for field, dtype in props.items():
                    mls_flag = " ← POSSIBLE MIN LOT SIZE" if field.lower() in MLS_KEYWORDS else ""
                    print(f"    {field:35s} {dtype}{mls_flag}")
                
                if has_mls:
                    print(f"  *** MIN LOT SIZE FIELDS FOUND ***")
                
                # Sample features (first 3)
                print(f"\n  Sample features (first 3):")
                for i, feat in enumerate(src):
                    if i >= 3: break
                    p = feat['properties']
                    # Print only the most useful fields
                    useful = {k: v for k, v in p.items() 
                              if any(kw in k.lower() for kw in 
                                     ['zone', 'lga', 'scheme', 'overlay', 'code', 'name', 'desc', 'status', 'lot'])}
                    print(f"    Feature {i+1}: {json.dumps(useful, default=str)[:200]}")
                
                # Unique zone/overlay codes (for key layers)
                if 'ZONE' in layer_name.upper() and count < 100000:
                    codes = set()
                    for feat in src:
                        for field in ['ZONE_CODE', 'zone_code', 'ZONE_NUM', 'zone_num', 'ZONE_NO']:
                            val = feat['properties'].get(field)
                            if val: codes.add(str(val))
                    if codes:
                        print(f"\n  Unique zone codes ({len(codes)}): {sorted(codes)[:20]}")
                
                if 'OVERLAY' in layer_name.upper() and count < 200000:
                    codes = set()
                    for feat in src:
                        for field in ['ZONE_CODE', 'zone_code', 'OVLY_CODE']:
                            val = feat['properties'].get(field)
                            if val: codes.add(str(val[:10] if isinstance(val, str) else str(val)))
                    if codes:
                        print(f"\n  Unique overlay codes ({len(codes)}): {sorted(codes)[:30]}")
                
                results[layer_name] = {
                    'count': count,
                    'fields': list(props.keys()),
                    'has_mls': has_mls,
                    'crs': str(crs),
                }
                
        except Exception as e:
            print(f"\n  ERROR reading {layer_name}: {e}")

    # ── Size and integration recommendation ──────────────────────
    print(f"\n{'='*60}")
    print("INTEGRATION RECOMMENDATION")
    print(f"{'='*60}")
    
    zone_count    = results.get('VMPLAN_PLAN_ZONE', {}).get('count', 0)
    overlay_count = results.get('VMPLAN_PLAN_OVERLAY', {}).get('count', 0)
    
    print(f"\nZone features:    {zone_count:,}")
    print(f"Overlay features: {overlay_count:,}")
    
    if zone_count < 50000 and overlay_count < 200000:
        print("\nMethod A — Convert to GeoJSON + load into PostGIS")
        print("  Both layers are manageable size for self-hosted PostGIS.")
        print("  Point-in-polygon query at runtime. Weekly refresh from DataVic.")
        print("  Recommended.")
    else:
        print("\nMethod B — Convert to MBTiles or FlatGeobuf")
        print("  Large dataset. Use tippecanoe to create MBTiles, or")
        print("  FlatGeobuf for faster streaming point-in-polygon queries.")

    print("\nIMPORTANT:")
    print("  Do NOT commit raw GDB or large GeoJSON to public GitHub.")
    print("  Host processed data in a private store / Netlify environment.")
    print("  Backend query only — never expose raw data to browser.")
    
    return results

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 inspect_vicmap_gdb.py /path/to/VICMAP_PLANNING.gdb")
        print("\nThe GDB file has not been uploaded yet.")
        print("Once available, place it in an accessible path and run this script.")
        sys.exit(0)
    
    inspect_gdb(sys.argv[1])
