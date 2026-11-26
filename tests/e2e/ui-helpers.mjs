import {existsSync} from "node:fs";

export const chromiumOptions = {executablePath:process.env.PECULE_E2E_CHROMIUM||(existsSync("/usr/bin/chromium")?"/usr/bin/chromium":undefined),args:process.platform==="win32"?[]:["--no-sandbox"]};

/** Wait for the hydrated app, rather than matching transient streamed markup. */
/** The home is ready: the account stack on a wide screen, the tiles on an iPhone (one of them, once). */
export async function waitForWallet(page) {
 await page.waitForFunction(()=>document.querySelectorAll('.wallet-stack, .home-tiles').length===1);
 await page.locator('.wallet-front, .home-tiles').first().waitFor();
}

/** Follow the same disclosures and filter confirmation as a real visitor. */
export async function openOperationComposer(page) {
 const mobile=(page.viewportSize()?.width??1440)<=760;
 await page.locator(mobile?'.mobile-add':'.floating-action-trigger').click();
 if(!mobile)await page.getByRole('button',{name:/Une dépense/}).click();
 await page.locator('input[name="amount"]').waitFor();
}

export async function revealHomeDetails(page) {
 const wallet=page.getByRole('tab',{name:'Prévisions',exact:true});if(await wallet.count()){await wallet.click();return;}
 const panel=page.locator('.clarte-more');
 if((page.viewportSize()?.width??1440)<=760)await panel.waitFor();
 if(await panel.count()&&!await panel.evaluate(n=>n.open))await panel.locator(':scope > summary').click();
}
export async function revealLedgerTools(page) {
 const panel=page.locator('.ledger-tools');
 if(await panel.count()&&!await panel.evaluate(n=>n.open))await panel.locator(':scope > summary').click();
}
export async function chooseOperationType(page,name) {
 const trigger=page.locator('.operation-filter-trigger');
 if(await trigger.count())await trigger.click();
 await page.getByRole('button',{name,exact:true}).click();
 if(await trigger.count()){
  await page.getByRole('button',{name:'Appliquer les filtres',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
 }
}
export async function shiftOperationMonth(page,name) {
 const trigger=page.locator('.operation-filter-trigger');
 if(await trigger.count())await trigger.click();
 await page.getByRole('button',{name,exact:true}).click();
 const month=await page.locator('.month-control > strong').innerText();
 if(await trigger.count()){
  await page.getByRole('button',{name:'Appliquer les filtres',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
 }
 return month;
}

export async function revealMerchantOptions(page){const panel=page.locator('.merchant-options');if(await panel.count()&&!await panel.evaluate(n=>n.open))await panel.locator(':scope > summary').click();}
export async function acknowledgeBalanceCorrection(page){const panel=page.locator('.balance-correction');if(await panel.count()){if(!await panel.evaluate(n=>n.open))await panel.locator(':scope > summary').click();await panel.getByRole('checkbox',{name:/J’ai vérifié les opérations/}).check();}}
export async function setOperationDirection(page,value){const native=page.locator('select[name="direction"]');if(await native.count())await native.selectOption(value);else await page.locator(`input[type="radio"][name="direction"][value="${value}"]`).check();}

export async function revealCaptureRoutine(page){const panel=page.locator('.wallet-capture');if(await panel.count()&&!await panel.evaluate(e=>e.open))await panel.locator(':scope > summary').click();}
