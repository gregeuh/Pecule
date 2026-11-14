#!/usr/bin/env python3
"""Refresh curated public favicons; never accepts or sends budget data.
Existing assets are kept by default. Use --refresh to refetch curated images.
"""
from PIL import Image
from io import BytesIO
import argparse,base64,concurrent.futures,gzip,json,pathlib,struct,urllib.request,urllib.parse
root=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--refresh',action='store_true');args=parser.parse_args()
manifest=root/'lib/brand-expansion.json';asset_file=root/'lib/brand-assets-france.json'
rows=json.loads(manifest.read_text());existing={b['id']:b for b in json.loads((root/'lib/brand-catalogue.json').read_text())};assets=json.loads(asset_file.read_text()) if asset_file.exists() else {}
def load(row):
 if row['id'] in existing:return row,existing[row['id']]['file'],None,None
 key='france/'+row['id']+'.png'
 if key in assets and not args.refresh:return row,key,None,None
 error=None
 for domain in [row['domain'],'www.'+row['domain']]:
  url='https://www.google.com/s2/favicons?'+urllib.parse.urlencode({'domain':domain,'sz':'128'})
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'PeculeCatalogue/1.0'}),timeout=25) as response:data=response.read(262145)
   if len(data)>262144:raise ValueError('oversized image')
   image=Image.open(BytesIO(data));w,h=image.size
   if min(w,h)<16 or max(w,h)>512:raise ValueError('invalid favicon dimensions')
   output=BytesIO();image.convert('RGBA').save(output,format='PNG',optimize=True)
   row['logoDomain']=domain
   return row,key,base64.b64encode(gzip.compress(output.getvalue(),mtime=0)).decode(),None
  except Exception as exc:error=str(exc)
 return row,key,None,error
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(load,rows))
failures=[]
for row,key,data,error in results:
 if error:failures.append({'id':row['id'],'domain':row['domain'],'error':error});continue
 row['file']=key
 if data:assets[key]=data
asset_file.write_text(json.dumps(dict(sorted(assets.items())),ensure_ascii=False,separators=(',',':'))+'\n')
manifest.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'curated':len(rows),'embedded':len(assets),'failures':failures},ensure_ascii=False,indent=2))
raise SystemExit(bool(failures))
