/** Follow the same disclosures and filter confirmation as a real visitor. */
export async function revealHomeDetails(page) {
 const panel=page.locator('.clarte-more');
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
