import test from 'node:test';
import assert from 'node:assert/strict';
import {walletColor,walletInk,accountKind} from '../lib/wallet-presentation.ts';
function luminance(hex){const c=hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
test('wallet swatches upgrade old presets and preserve custom colors without mutating the account',()=>{const account={id:'qa',color:'#a48bdb',type:'savings',openingBalance:123456};const before=structuredClone(account);assert.equal(walletColor(account.color),'#f4ac36');assert.equal(walletColor('#BADA55'),'#BADA55');assert.equal(walletColor('invalid'),'#245af3');assert.equal(accountKind(account),'Compte d’épargne');assert.deepEqual(account,before);});
test('wallet card text has at least 4.5:1 contrast on preset and custom colors',()=>{for(const color of ['#335cff','#a48bdb','#edac69','#5b9b86','#d77992','#5b99c1','#ffffff','#000000','#777777','#777700','#123456','#efc321']){const l=luminance(walletColor(color)),t=luminance(walletInk(color));assert((Math.max(l,t)+.05)/(Math.min(l,t)+.05)>=4.5,color);}});

test('material keeps accessible contrast through reflections and pressed/hover states',async()=>{
 const {walletSurfaceStyles}=await import('../lib/wallet-presentation.ts');
 const blend=(base,tint)=>{const alpha=parseInt(tint.slice(7,9)||'ff',16)/255;return base.map((c,i)=>Math.round(c*(1-alpha)+parseInt(tint.slice(1+i*2,3+i*2),16)*alpha));};
 const hex=rgb=>'#'+rgb.map(c=>Math.max(0,Math.min(255,c)).toString(16).padStart(2,'0')).join('');
 const palette=[...Array.from({length:256},(_,n)=>'#'+n.toString(16).padStart(2,'0').repeat(3)),'#245af3','#f4ac36','#8248f4','#777700','#bada55','#d77992'];
 for(const color of palette){const styles=walletSurfaceStyles(color),base=styles['--wallet-color'].slice(1).match(/../g).map(c=>parseInt(c,16));for(const tint of [styles['--wallet-reflect'],styles['--wallet-shade']])for(const filter of [null,styles['--wallet-hover-filter'],styles['--wallet-press-filter'],styles['--wallet-hold-filter']]){const factor=filter?Number(filter.match(/[\d.]+/)[0]):1,l=luminance(hex(blend(base,tint).map(c=>Math.round(c*factor)))),fore=luminance(hex(styles['--wallet-ink'].slice(1).match(/../g).map(c=>Math.round(parseInt(c,16)*factor))));assert((Math.max(l,fore)+.05)/(Math.min(l,fore)+.05)>=4.5,`${color} ${tint} ${filter}`);}}
});
