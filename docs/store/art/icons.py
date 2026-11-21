"""Icon exports. Downscales ONLY (Lanczos) from the approved icon-512.png; nothing is redrawn.
Sizes above 512 cannot be exported from this source and are reported as missing."""
import sys, os, hashlib
from PIL import Image
root, here = sys.argv[1], sys.argv[2]
src = os.path.join(root, 'apps/web/public/favicon/icon-512.png')
want = '77e8914d5dbd76c816964638b297ef2043923b4bd54047646b8bfdc4a344fc17'
assert hashlib.sha256(open(src,'rb').read()).hexdigest() == want, 'icon-512.png differs from the locked master'
im = Image.open(src).convert('RGB')
# square, opaque, no alpha, no rounded corners: the stores apply their own masks
sizes = {'play-icon-512.png':512, 'ios-180.png':180, 'ios-167.png':167, 'ios-152.png':152, 'ios-120.png':120,
         'ios-87.png':87, 'ios-80.png':80, 'ios-76.png':76, 'ios-60.png':60, 'ios-58.png':58, 'ios-40.png':40, 'ios-29.png':29,
         'android-192.png':192, 'android-144.png':144, 'android-96.png':96, 'android-72.png':72, 'android-48.png':48}
for n, s in sizes.items():
    (im if s == 512 else im.resize((s, s), Image.LANCZOS)).save(os.path.join(here, 'icon', n), optimize=True)
    print('wrote icon/' + n)
