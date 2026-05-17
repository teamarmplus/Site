#!/usr/bin/env python3
"""
Helper: update 12 Kiah Close Tullimbar with verified SIX Maps data.

Usage:
  python3 tools/update-kiah-close.py \
    --lat -34.XXXXXX \
    --lng 150.XXXXXX \
    --lot LOT_NUMBER \
    --dp DP_NUMBER \
    --date 2026-05-16

Example (fill in real values from SIX Maps):
  python3 tools/update-kiah-close.py \
    --lat -34.581500 \
    --lng 150.750100 \
    --lot 7 \
    --dp DP1279403 \
    --date 2026-05-16
"""

import csv, sys, os, argparse, datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH   = os.path.join(SCRIPT_DIR, '..', 'data', 'backtest-replacement-candidates.csv')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--lat',  required=True, type=float, help='verified_lat from SIX Maps')
    parser.add_argument('--lng',  required=True, type=float, help='verified_lng from SIX Maps')
    parser.add_argument('--lot',  required=True, help='lot number (e.g. 7)')
    parser.add_argument('--dp',   required=True, help='DP number (e.g. DP1279403)')
    parser.add_argument('--date', default=datetime.date.today().isoformat(), help='verification date YYYY-MM-DD')
    args = parser.parse_args()

    with open(CSV_PATH) as f:
        rows = list(csv.DictReader(f))
        f.seek(0)
        fieldnames = next(csv.reader(f))

    # Find row 20
    idx = next((i for i, r in enumerate(rows) if r['replacement_for_row'] == '20'), None)
    if idx is None:
        print("ERROR: row with replacement_for_row=20 not found")
        sys.exit(1)

    r = rows[idx]
    r['verified_lat']             = str(args.lat)
    r['verified_lng']             = str(args.lng)
    r['lot']                      = str(args.lot)
    r['dp']                       = args.dp
    r['parcel_id']                = f"{args.lot}/{args.dp}"
    r['coordinate_verified_by']   = 'six-maps-manual'
    r['coordinate_verified_date'] = args.date
    r['verified_level']           = 'verified_full'
    r['ready_to_insert']          = 'YES'
    r['reason_not_ready']         = ''
    r['notes']                    = (
        r['notes'].rstrip()
        + f' | UPDATED {args.date}: verified_lat={args.lat}, verified_lng={args.lng},'
        + f' lot={args.lot}/{args.dp} — coordinate_verified_by=six-maps-manual.'
        + ' verified_level updated to verified_full. ready_to_insert=YES.'
    )

    with open(CSV_PATH, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✓ 12 Kiah Close updated:")
    print(f"  verified_lat:  {args.lat}")
    print(f"  verified_lng:  {args.lng}")
    print(f"  lot/dp:        {args.lot}/{args.dp}")
    print(f"  verified_by:   six-maps-manual")
    print(f"  verified_date: {args.date}")
    print(f"  verified_level: verified_full")
    print(f"  ready_to_insert: YES")
    print()
    print("Next step: insert into main 20-row CSV when ready.")

if __name__ == '__main__':
    main()
