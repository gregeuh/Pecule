"""Original Pécule Lottie family. Deterministic, local assets; run from repository root."""
import json
from pathlib import Path

COLORS = {'green':'235746','edge':'173b2d','sheen':'34765e','mint':'a4d9be','coin':'f5c39e','coinEdge':'c68a5b','paper':'fffaf1','lavender':'e2d6f5','purple':'806a9f'}
FPS, END = 60, 90

def p(v): return {'a':0,'k':v}
def color(name):
    value=COLORS[name]
    return [int(value[i:i+2],16)/255 for i in (0,2,4)]+[1]
def tween(stops):
    return {'a':1,'k':[dict(t=t,s=value,**({'e':stops[i+1][1],'o':{'x':[0.18],'y':[0]},'i':{'x':[0.18],'y':[1]}} if i<len(stops)-1 else {})) for i,(t,value) in enumerate(stops)]}
def path(points,closed=False):
    return {'ty':'sh','ks':p({'i':[[0,0]]*len(points),'o':[[0,0]]*len(points),'v':points,'c':closed})}
def fill(c):return {'ty':'fl','c':p(color(c)),'o':p(100),'r':1}
def stroke(c,w=2):return {'ty':'st','c':p(color(c)),'o':p(100),'w':p(w),'lc':2,'lj':2}
def rect(w,h,r=5):return {'ty':'rc','p':p([0,0]),'s':p([w,h]),'r':p(r)}
def ellipse(w,h=None):return {'ty':'el','p':p([0,0]),'s':p([w,h or w])}
def layer(name,shapes,pos=(80,80),scale=None,rotation=None,opacity=None):
    return {'ddd':0,'ind':0,'ty':4,'nm':name,'sr':1,'ks':{'o':opacity or p(100),'r':rotation or p(0),'p':pos if isinstance(pos,dict) else p(list(pos)),'a':p([0,0]),'s':scale or p([100,100])},'shapes':shapes,'ip':0,'op':END,'st':0,'bm':0}
def body():
    settle=tween([(0,[100,100]),(36,[100,100]),(46,[104,96]),(62,[100,100])])
    return [layer('Wallet · apricot clasp',[rect(24,18,6),fill('coin'),stroke('coinEdge',1.2)],(116,98),settle),
            layer('Wallet · clasp stud',[ellipse(4),fill('edge')],(114,98)),
            layer('Wallet · soft highlight',[path([[-35,0],[25,0]]),stroke('sheen',2)],(80,80)),
            layer('Wallet · monogram p',[path([[-4,10],[-4,-9],[3,-9],[8,-4],[8,0],[3,5],[-4,5]]),stroke('mint',2.5)],(68,101)),
            layer('Wallet · folded leather',[rect(92,56,12),fill('green'),stroke('mint',1.3)],(80,99),settle),
            layer('Wallet · back fold',[rect(84,25,9),fill('sheen')],(80,76)),
            layer('Wallet · grounded shadow',[ellipse(92,8),fill('edge')],(80,133),opacity=p(16))]
def coin(x=80,y=60,drop=True,delay=0):
    pos=tween([(delay,[x,y-42]),(delay+28,[x,y+2]),(delay+38,[x,y])]) if drop else p([x,y])
    fade=tween([(0,[0]),(delay,[0]),(delay+5,[100]),(delay+29,[100]),(delay+40,[0])]) if drop else p(100)
    return [layer('Piece · engraved p',[path([[-2,6],[-2,-6],[2,-6],[5,-3],[5,0],[2,2],[-2,2]]),stroke('edge',1.6)],pos,opacity=fade),
            layer('Piece · inset',[ellipse(17),stroke('coinEdge',1)],pos,opacity=fade),
            layer('Piece · apricot face',[ellipse(24),fill('coin'),stroke('coinEdge',1.5)],pos,opacity=fade)]
def tick(x=123,y=58,delay=43):
    return [layer('Saved · check',[path([[-6,0],[-1,5],[7,-5]]),stroke('paper',2.3),{'ty':'tm','s':p(0),'e':tween([(delay,[0]),(delay+16,[100])]),'o':p(0),'m':1}],(x,y)),
            layer('Saved · seal',[ellipse(26),fill('green'),stroke('mint',1.2)],(x,y),scale=tween([(0,[0,0]),(delay-4,[0,0]),(delay+8,[100,100])]))]
def paper(x,y,delay=0):
    pos=tween([(0,[x-28,y-26]),(delay+18,[x,y-10]),(delay+38,[x,y])])
    return [layer('Releve · lines',[path([[-9,-7],[8,-7]]),stroke('green',2),path([[-9,0],[8,0]]),stroke('green',2),path([[-9,7],[2,7]]),stroke('green',2)],pos),
            layer('Releve · page',[rect(32,40,4),fill('paper'),stroke('purple',1.2)],pos,rotation=tween([(0,[-12]),(delay+35,[0])]))]
def save(name,layers,duration=90):
    for i,l in enumerate(layers):l['ind']=i+1;l['op']=duration
    data={'v':'5.7.4','fr':FPS,'ip':0,'op':duration,'w':160,'h':160,'nm':'Pecule · '+name,'ddd':0,'assets':[],'layers':layers,'markers':[]}
    Path('app/animations/'+name+'.json').write_text(json.dumps(data,separators=(',',':'))+'\n')

# Front-to-back layer order makes the piece disappear inside the wallet.
save('operation',tick()+body()+coin())
save('wallet',body()+coin(),78)
# Two pieces follow opposing arcs around the wallet, then settle into a cycle.
cycle=[]
for x,y,sign in [(44,49,1),(114,58,-1)]:
    pos=tween([(0,[x-sign*18,y+28]),(20,[x-sign*12,y-12]),(40,[x+sign*9,y-14]),(58,[x,y])])
    cycle += [layer('Cycle · moving piece',[ellipse(19),fill('coin' if sign==1 else 'lavender'),stroke('coinEdge' if sign==1 else 'purple',1.3)],pos)]
cycle += [layer('Cycle · arc',[path([[-21,5],[-18,-7],[-6,-15],[10,-14],[22,-3]]),stroke('mint',2),{'ty':'tm','s':p(0),'e':tween([(5,[0]),(40,[100])]),'o':p(0),'m':1}],(80,46)),layer('Cycle · arrow',[path([[13,-4],[22,-3],[21,-12]]),stroke('mint',2)],(80,46),opacity=tween([(0,[0]),(35,[0]),(45,[100])]))]
save('recurrence',tick(delay=58)+body()+cycle,100)
save('import',tick(delay=65)+body()+paper(94,60,16)+paper(79,52,8)+paper(63,46),108)
# A reserve grows by one coin, without implying an automatic bank transfer.
stacks=[]
for i in range(3):
    stacks.append(layer('Reserve · piece '+str(i),[ellipse(39,12),fill('coin'),stroke('coinEdge',1.4)],(76,112-i*9)))
save('savings',tick(119,62,55)+coin(76,85,True,10)+stacks+[layer('Reserve · tray',[rect(73,12,5),fill('green'),stroke('mint',1.2)],(77,126))],100)
# The pile opens into a project emblem, with three restrained accents rather than confetti.
goal=[layer('Project · star',[path([[0,-10],[3,-3],[10,0],[3,3],[0,10],[-3,3],[-10,0],[-3,-3]],True),fill('coin')],(80,63),scale=tween([(0,[0,0]),(37,[0,0]),(58,[100,100])])),
      layer('Project · shield',[path([[-22,-17],[0,-25],[22,-17],[19,10],[0,27],[-19,10]],True),fill('green'),stroke('mint',2)],tween([(0,[80,91]),(36,[80,91]),(62,[80,65])]),scale=tween([(0,[0,0]),(25,[0,0]),(58,[100,100])]))]
for i,(x,y) in enumerate([(33,49),(127,48),(120,102)]):
    goal.append(layer('Milestone · accent',[path([[0,-5],[0,5]]),stroke('lavender' if i==1 else 'coin',3)],(x,y),rotation=p(i*45),scale=tween([(0,[0,0]),(50+i*4,[0,0]),(65+i*4,[100,100])])) )
save('goal',goal+stacks+[layer('Project · foundation',[rect(76,12,5),fill('green'),stroke('mint',1.3)],(77,126))],120)
settings=[]
for i,(y,end) in enumerate([(58,95),(80,61),(102,88)]):
    settings += [layer('Preference · slider',[ellipse(14),fill('coin' if i!=1 else 'lavender'),stroke('edge',1.4)],tween([(0,[64 if i!=1 else 96,y]),(22+i*8,[end,y])])),layer('Preference · rail',[path([[-32,0],[32,0]]),stroke('mint',3)],(80,y))]
save('settings',tick(124,121,50)+settings+[layer('Preference · panel',[rect(102,96,14),fill('green'),stroke('mint',1.3)],(80,80))],90)
# General confirmations use the wallet identity without suggesting a financial direction.
save('confirmation',tick(delay=12)+body(),78)
