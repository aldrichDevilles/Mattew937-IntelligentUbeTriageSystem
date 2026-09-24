import sys
import traceback

import color_index
import rot_model

for path in sys.argv[1:]:
    print("=====", path)
    try:
        r = color_index.analyze(open(path, "rb").read())
    except Exception:
        traceback.print_exc()
        continue
    print("confidence:", r.confidence, " defects:", r.defects)
    print("rot probability:", rot_model.rot_probability(r.debug))
    print(r.debug)