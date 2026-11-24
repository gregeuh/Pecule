import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {waitForWallet,chromiumOptions} from './ui-helpers.mjs';
const origin=process.env.PECULE_E2E_BASE_URL||'http://127.0.0.1:3001',output=process.env.PECULE_E2E_OUTPUT||'outputs/financial-editors';
await mkdir(output,{recursive:true});
const browser=await chromium.launch(chromiumOptions);const checks=[];
try{for(const {width,theme} of [{width:390,theme:'dark'},{width:1440,theme:'light'}]){
 const context=await browser.newContext({viewport:{width,height:900},isMobile:width<760,hasTouch:width<760,locale:'fr-FR',reducedMotion:'reduce'});
 await context.addInitScript(t=>localStorage.setItem('pecule-theme',t),theme);
 const page=await context.newPage(),writes=[],errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='PUT')writes.push(r.url());});
 await page.goto(origin);await waitForWallet(page);const dialog=page.getByRole('dialog');
 const action=async name=>{
  if(width<760&&name.test('Un compte')){await accounts();await page.locator('.add-tile').click();}
  else{
   await page.locator(width<760?'.mobile-add':'.floating-action-trigger').click();
   if(width>=760||!name.test('Une dépense'))await dialog.getByRole('button',{name}).click();
  }
  await dialog.waitFor();
 };
 const nav=page.getByRole('navigation',{name:width<760?'Navigation mobile':'Navigation principale'});
 const accounts=()=>nav.getByRole('button',{name:width<760?'Comptes':'Mes comptes',exact:true}).click();
 const account=()=>page.locator('.account-card').filter({hasText:'Compte QA éditeurs'});
 const cents=value=>Math.round(Number(value.replace(/[^\d,−-]/g,'').replace('−','-').replace(',','.'))*100);
 const balance=async()=>cents(await account().locator('.account-balance').innerText());
 await action(/^Un compte/);await dialog.getByRole('button',{name:'Enregistrer le compte',exact:true}).click();assert.equal(await dialog.count(),1);assert(await dialog.locator('[aria-invalid=true]').count()>0);
 await dialog.locator('input[name=name]').fill('Compte QA éditeurs');await dialog.locator('input[name=balance]').fill('100');await dialog.getByRole('button',{name:'Enregistrer le compte',exact:true}).click();await dialog.waitFor({state:'hidden'});await accounts();assert.equal(await balance(),10000);
 await action(/^Une dépense/);await dialog.locator('select[name=account]').selectOption({label:'Compte QA éditeurs'});await dialog.locator('input[name=amount]').fill('12.34');await dialog.locator('input[name=label]').fill('QA opération éditeurs');await dialog.getByRole('button',{name:'Enregistrer l’opération',exact:true}).click();await dialog.waitFor({state:'hidden'});await accounts();assert.equal(await balance(),8766);
 await nav.getByRole('button',{name:'Opérations',exact:true}).click();await page.getByRole('textbox',{name:'Rechercher une opération'}).fill('QA opération éditeurs');await page.locator('.operation-gesture>button').first().click();await dialog.locator('input[name=amount]').fill('15.50');await dialog.getByRole('button',{name:'Enregistrer l’opération',exact:true}).click();await dialog.waitFor({state:'hidden'});await accounts();assert.equal(await balance(),8450);
 const allBalances=async()=>Promise.all((await page.locator('.account-card .account-balance').allTextContents()).map(cents));const before=await allBalances();
 await action(/^Virement entre comptes/);await dialog.locator('select[name=to]').selectOption({label:'Compte QA éditeurs'});await dialog.locator('input[name=amount]').fill('25');await dialog.getByRole('button',{name:'Enregistrer le virement',exact:true}).click();await dialog.waitFor({state:'hidden'});await accounts();assert.equal(await balance(),10950);assert.equal((await allBalances()).reduce((a,b)=>a+b,0),before.reduce((a,b)=>a+b,0));
 await account().getByRole('button',{name:/Ajuster le solde/}).click();
 await dialog.getByRole('button',{name:'Solde négatif'}).click();
 assert.equal(await dialog.locator('input[name=balance]').inputValue(),'-');
 await dialog.locator('input[name=balance]').pressSequentially('25,50');
 await dialog.getByRole('button',{name:'Enregistrer le solde',exact:true}).click();
 await dialog.waitFor({state:'hidden'});
 assert.equal(await balance(),-2550);
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);checks.push({width,theme,status:'passed',accountCreation:true,operationCreateAndEdit:true,transferConservesTotal:true,serverWrites:0});console.log(`PASS ${width} ${theme}: account, validation, operation create/edit, transfer and balances`);await context.close();
}}finally{await writeFile(`${output}/report.json`,JSON.stringify(checks,null,2));await browser.close();}
