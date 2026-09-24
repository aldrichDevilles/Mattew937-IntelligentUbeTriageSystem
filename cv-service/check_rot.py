import glob
import color_index, rot_model

files = sorted(glob.glob("samples/*.jpg") + glob.glob("samples/*.png"))
for f in files:
    r = color_index.analyze(open(f, "rb").read())
    p = rot_model.rot_probability(r.debug)
    print(f"{f:50s} rule_rot={'rot' in r.defects!s:5}  p={p}")