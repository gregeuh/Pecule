import test from 'node:test';
import assert from 'node:assert/strict';
import {walletColor,walletInk,accountKind} from '../lib/wallet-presentation.ts';
function luminance(hex){const c=hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
test('wallet swatches upgrade old presets and preserve custom colors without mutating the account',()=>{const account={id:'qa',color:'#a48bdb',type:'savings',openingBalance:123456};const before=structuredClone(account);assert.equal(walletColor(account.color),'#f4ac36');assert.equal(walletColor('#BADA55'),'#BADA55');assert.equal(walletColor('invalid'),'#245af3');assert.equal(accountKind(account),'Compte d’épargne');assert.deepEqual(account,before);});
test('wallet card text has at least 4.5:1 contrast on preset and custom colors',()=>{for(const color of ['#335cff','#a48bdb','#edac69','#5b9b86','#d77992','#5b99c1','#ffffff','#000000','#777777','#777700','#123456','#efc321']){const l=luminance(walletColor(color)),t=luminance(walletInk(color));assert((Math.max(l,t)+.05)/(Math.min(l,t)+.05)>=4.5,color);}});
