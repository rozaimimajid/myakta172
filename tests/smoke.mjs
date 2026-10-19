// MyAKTA172 audit-only browser regression checks (Playwright).
// Run against a local static HTTP server serving files from audit/stabilization-v1.
// Requires: npm install --no-save playwright; npx playwright install chromium
// Usage: MYAKTA_TEST_URL=http://127.0.0.1:8080 node tests/smoke.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const url = process.env.MYAKTA_TEST_URL;
if (!url || !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) {
  throw new Error('Provide a localhost MYAKTA_TEST_URL ending with /; production URLs are intentionally blocked.');
}
const browser = await chromium.launch({ headless: true });
const errors = [];
let failures = 0;
const check = async (name, fn) => {
  try { await fn(); console.log('PASS', name); }
  catch (e) { failures++; console.error('FAIL', name, e.message); }
};
try {
 const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
 page.on('pageerror', e => errors.push(e.message));
 await page.goto(url, {waitUntil:'domcontentloaded'});
 // Neutralize welcome screen without altering source files or invoking app functions.
 await page.evaluate(() => {
   const welcome=document.getElementById('myaktaWelcome');
   if(welcome){welcome.hidden=true;welcome.style.display='none';}
 });
 await check('Essential page components', async () => {
   for(const id of ['nav','desktopHomeButton','desktopHome','kmFlowChart','rsnV24Chart','rtV25Chart','rkkV26Chart'])
     assert.equal(await page.locator('#'+id).count(),1,'missing or duplicate '+id);
 });
 await check('Homepage and collapsed sidebar', async () => {
   await page.locator('#desktopHomeButton').click();
   assert.equal(await page.locator('#desktopHome.open').count(),1,'home is not open');
   const open=await page.locator('#nav .sections').evaluateAll(ls=>ls.filter(e=>e.classList.contains('open') || (getComputedStyle(e).display!=='none')).length);
   assert.equal(open,0,'sidebar sections remain expanded/visible');
 });
 await check('Can reopen part after Home', async()=>{
   await page.locator('#nav .part-head').first().click();
   assert.equal(await page.locator('#nav .sections.open').count(),1,'section list did not expand');
 });
 await check('Four planning flow elements retained', async()=>{
   for(const id of ['kmFlowChart','rsnV24Chart','rtV25Chart','rkkV26Chart'])
     assert.equal(await page.locator('#'+id).count(),1);
 });
 await check('Open statute section from sidebar', async()=>{
   await page.locator('#desktopHomeButton').click();
   await page.locator('#nav .part-head').first().click();
   await page.locator('#nav .sections.open .sec-link').first().click();
   assert.match((await page.locator('#secTitle').innerText()).toUpperCase(),/SEKSYEN/);
   assert.ok((await page.locator('#lawText').innerText()).trim().length>10,'law text is empty');
 });
 await check('Return to Home after reading section', async()=>{
   await page.locator('#desktopHomeButton').click();
   assert.equal(await page.locator('#desktopHome.open').count(),1);
   assert.equal(await page.locator('#nav .sections.open').count(),0);
 });
 await check('Planning tabs render content without JavaScript errors', async()=>{
   for (const prefix of ['rsn','rt','rkk']) {
     const selector='[data-'+prefix+'-tab]';
     const tabs=page.locator(selector);
     const count=await tabs.count();
     assert.ok(count>=2,'missing '+prefix+' tabs');
     for(let i=0;i<count;i++) {
       await tabs.nth(i).evaluate(el=>el.click());
       const chartId={rsn:'#rsnV24Chart',rt:'#rtV25Chart',rkk:'#rkkV26Chart'}[prefix];
       assert.ok((await page.locator(chartId).innerText()).trim().length>5,prefix+' chart empty on tab '+i);
     }
   }
 });
 await check('Three different parts collapse on Home and reopen',async()=>{
   await page.locator('#desktopHomeButton').click();
   const heads=page.locator('#nav .part-head');
   assert.ok(await heads.count()>=3,'fewer than three parts');
   for(let i=0;i<3;i++){
     await heads.nth(i).click();
     assert.ok(await page.locator('#nav .sections.open').count()>=1,'part '+i+' did not open');
     await page.locator('#desktopHomeButton').click();
     assert.equal(await page.locator('#nav .sections.open').count(),0,'part '+i+' remained open after Home');
     await heads.nth(i).click();
     assert.ok(await page.locator('#nav .sections.open').count()>=1,'part '+i+' cannot reopen');
     await page.locator('#desktopHomeButton').click();
   }
 });
 await check('Statute sections change title and populated law text',async()=>{
   await page.locator('#desktopHomeButton').click();
   await page.locator('#nav .part-head').first().click();
   const links=page.locator('#nav .sections.open .sec-link');
   assert.ok(await links.count()>=2,'not enough sections to compare');
   await links.nth(0).click();
   const firstTitle=(await page.locator('#secTitle').innerText()).trim();
   const firstBody=(await page.locator('#lawText').innerText()).trim();
   assert.ok(firstBody.length>20,'first law text empty');
   await page.locator('#nav .part-head').first().click();
   if(!(await page.locator('#nav .sections.open').count())) await page.locator('#nav .part-head').first().click();
   await page.locator('#nav .sections.open .sec-link').nth(1).click();
   const secondTitle=(await page.locator('#secTitle').innerText()).trim();
   const secondBody=(await page.locator('#lawText').innerText()).trim();
   assert.ok(secondBody.length>20,'second law text empty');
   assert.notEqual(firstTitle,secondTitle,'section title did not change');
   assert.notEqual(firstBody,secondBody,'section body did not change');
 });
 await check('Mobile viewport initial navigation has no uncaught errors',async()=>{
   const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(e.message));
   try{
     await mobile.goto(url,{waitUntil:'domcontentloaded'});
     await mobile.evaluate(()=>{const w=document.getElementById('myaktaWelcome');if(w){w.hidden=true;w.style.display='none';}});
     assert.equal(await mobile.locator('#mobileHome').count(),1,'mobile home missing');
     assert.equal(await mobile.locator('#mobileBottomNav').count(),1,'mobile navigation missing');
     assert.equal(await mobile.locator('#nav').count(),1,'nav missing on mobile');
     assert.deepEqual(mobileErrors,[],'mobile JavaScript exception');
   }finally{await mobile.close();}
 });
 await check('Four flowcharts open, link to statute, return and close',async()=>{
   const flows=[
     ['KM','kmDesktopLaunch','kmFlowOverlay','kmFlowChart','kmReturnBar','kmReturnButton','kmFlowClose'],
     ['RSN','rsnDesktopLaunch','rsnV24Overlay','rsnV24Chart','rsnV24ReturnBar','rsnV24ReturnButton','rsnV24Close'],
     ['RT','rtDesktopLaunch','rtV25Overlay','rtV25Chart','rtV25ReturnBar','rtV25ReturnButton','rtV25Close'],
     ['RKK','rkkDesktopLaunch','rkkV26Overlay','rkkV26Chart','rkkV26ReturnBar','rkkV26ReturnButton','rkkV26Close']
   ];
   for(const [name,launch,overlay,chart,returnBar,returnButton,close] of flows){
     await page.locator('#desktopHomeButton').click();
     await page.locator('#'+launch).evaluate(el=>el.click());
     assert.equal(await page.locator('#'+overlay+'[hidden]').count(),0,name+' failed to open');
     assert.ok(await page.locator('#'+chart+' .km-step').count()>0,name+' has no steps');
     const refs=page.locator('#'+chart+' .km-ref-links button');
     assert.ok(await refs.count()>0,name+' lacks section links');
     const expected=(await refs.first().innerText()).match(/Seksyen\s+(\w+)/i)?.[1];
     await refs.first().evaluate(el=>el.click());
     assert.equal(await page.locator('#'+overlay+'[hidden]').count(),1,name+' did not close for statute');
     assert.equal(await page.locator('#'+returnBar+'[hidden]').count(),0,name+' return control missing');
     const actualTitle=await page.locator('#secTitle').innerText();
     assert.match(actualTitle,new RegExp('Seksyen\\s+'+expected,'i'),name+' wrong section opened: requested '+expected+' actual '+JSON.stringify(actualTitle));
     await page.locator('#'+returnButton).evaluate(el=>el.click());
     assert.equal(await page.locator('#'+overlay+'[hidden]').count(),0,name+' failed to return');
     await page.locator('#'+close).evaluate(el=>el.click());
     assert.equal(await page.locator('#'+overlay+'[hidden]').count(),1,name+' failed to close');
   }
 });
 await check('No uncaught page errors on initial navigation',async()=>{
   assert.deepEqual(errors,[]);
 });
} finally { await browser.close(); }
if (failures) process.exitCode=1;
