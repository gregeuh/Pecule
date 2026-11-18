"""Usage: python scripts/subset-inter.py INPUT.woff2 OUTPUT.woff2
Requires fonttools[woff] (including brotli). Retains all variable weights and layout features.
"""
import sys
from fontTools import subset

options = subset.Options()
options.flavor = "woff2"
options.layout_features = ["*"]
options.notdef_outline = True
font = subset.load_font(sys.argv[1], options)
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=list(range(0x250)) + list(range(0x300, 0x370))
                   + list(range(0x1e00, 0x1f00)) + list(range(0x2000, 0x2150))
                   + list(range(0x2190, 0x2200)) + [0x2212, 0xfeff])
subsetter.subset(font)
subset.save_font(font, sys.argv[2], options)
