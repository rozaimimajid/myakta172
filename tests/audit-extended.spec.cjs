const {test,expect}=require('@playwright/test');
for(const device of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
test.describe('extended '+device.name,()=>{
test.use({viewport:{width:device.width,height:device.height}});
test.beforeEach(async({page})=>{await page.goto('/');await page.locator('#myaktaWelcomeEnter').click()});
test('planning charts: all four charts and tabs have content',async({page})=>{
 for(const id of ['kmFlowChart','rsnV24Chart','rtV25Chart','rkkV26Chart']){
  await expect(page.locator('#'+id)).toHaveCount(1);
  const result=await page.locator('#'+id).evaluate(el=>({content:el.innerHTML.length,steps:el.querySelectorAll('button,a,.km-step,.km-node,.km-decision').length}));
  expect(result.content,id).toBeGreaterThan(100);
 }
 for(const kind of ['rsn','rt','rkk']){
  const tabs=page.locator('[data-'+kind+'-tab]');
  expect(await tabs.count(),kind).toBeGreaterThanOrEqual(2);
 }
});
test('bookmarks persist across reload',async({page})=>{
 await page.evaluate(()=>{localStorage.clear();show('19');document.getElementById('bookmarkBtn').click()});
 await expect(page.locator('#bookmarkBtn')).toContainText('Kegemaran');
 await expect(page.locator('#bookmarkBtn')).toHaveClass(/active/);
 await page.reload();
 await page.locator('#myaktaWelcomeEnter').click().catch(()=>{});
 await page.evaluate(()=>show('19'));
 await expect(page.locator('#bookmarkBtn')).toHaveClass(/active/);
});
test('voice controls exist and theme can toggle',async({page})=>{
 for(const id of ['voiceToggle','speakBtn','speakExplainBtn','pauseBtn','voiceStatus','printBtn']){
  await expect(page.locator('#'+id)).toHaveCount(1);
 }
 await page.evaluate(()=>document.getElementById('theme').click());
 const changed=await page.evaluate(()=>document.body.className);
 expect(changed).toContain('dark');
});
test('print button triggers browser print request',async({page})=>{
 await page.evaluate(()=>show('19'));
 await page.evaluate(()=>{window.__printCalled=0;window.print=()=>window.__printCalled++});
 await page.locator('#printBtn').evaluate(el=>el.click());
 expect(await page.evaluate(()=>window.__printCalled)).toBe(1);
});
test('PWA manifest, service worker and core assets',async({page,request})=>{
 for(const url of ['/manifest.webmanifest','/sw.js','/index.html','/icon-v2.svg','/welcome-background.svg']){
  const response=await request.get(url);expect(response.ok(),url).toBeTruthy();
 }
 await expect.poll(()=>page.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()))).toBeTruthy();
});
});
}
