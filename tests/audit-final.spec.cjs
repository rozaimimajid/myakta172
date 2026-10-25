const { test, expect } = require('@playwright/test');
const sections = ['3','11A','12A','17','20','20A','21C','31A','35','35B','35C','35F','35G','42','43','44','49','51','52','52A','53','54','55','56'];
for (const device of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]) {
 test.describe(device.name,()=>{
  test.use({viewport:{width:device.width,height:device.height}});
  test('welcome screen and access', async ({page})=>{
   await page.goto('/');
   await expect(page.locator('#myaktaWelcome')).toBeVisible();
   await expect(page.locator('#myaktaWelcome .wl-brand-footer img')).toBeVisible();
   await expect(page.locator('#myaktaWelcome .wl-foot')).toContainText('MyAKTA172');
   await expect(page.locator('#myaktaWelcome .wl-grid')).not.toContainText('Eksport Sandaran Penanda');
   await page.locator('#myaktaWelcomeEnter').click();
   await expect(page.locator('#myaktaWelcome')).not.toBeVisible();
  });
  test('24 previously damaged legal sections: no vertical column or right overflow',async({page})=>{
   await page.goto('/');
   await page.locator('#myaktaWelcomeEnter').click();
   for(const n of sections) {
    await page.evaluate(n=>{if(typeof show!=='function')throw new Error('show() unavailable');show(n)},n);
    const result=await page.locator('#lawText').evaluate(el=>{
     const panel=el.getBoundingClientRect(), rows=[...el.querySelectorAll('p.act-entry')];
     let errors=[];
     for(const row of rows){
      const box=row.getBoundingClientRect(),body=row.querySelector('.act-entry-body');
      if(!body)continue;
      const r=body.getBoundingClientRect();
      if(r.width<Math.min(80,panel.width*0.3))errors.push('narrow:'+Math.round(r.width));
      if(r.right>panel.right+3)errors.push('overflow:'+Math.round(r.right-panel.right));
      if(box.right>panel.right+3)errors.push('row-overflow');
     }
     return {rows:rows.length,errors};
    });
    expect(result.rows,n).toBeGreaterThan(0);
    expect(result.errors,n).toEqual([]);
   }
  });
  test('numeric search and keyword highlighting',async({page})=>{
   await page.goto('/');
   await page.locator('#myaktaWelcomeEnter').click();
   await page.locator('#caseOpen').click();
   await page.locator('#caseInput').fill('21B');
   await page.locator('#caseAnalyse').click();
   await expect(page.locator('#caseResults [data-case-sec]')).toHaveCount(1);
   await expect(page.locator('#caseResults [data-case-sec]').first()).toHaveAttribute('data-case-sec','21B');
   await page.locator('#caseInput').fill('material');
   await page.locator('#caseAnalyse').click();
   await expect(page.locator('#caseResults [data-case-sec="19"]')).toBeVisible();
   await page.locator('#caseResults [data-case-sec="19"]').click();
   await expect(page.locator('#lawText mark.act-search-match').first()).toBeVisible();
  });
  test('desktop/mobile toggle does not break section text',async({page})=>{
   await page.goto('/');
   await page.locator('#myaktaWelcomeEnter').click();
   await page.evaluate(()=>show('19'));
   await page.locator('#modeMobile').click();
   await expect(page.locator('#lawText')).toContainText('Tiada seorang pun');
   await page.locator('#modeDesktop').click();
   await expect(page.locator('#lawText')).toContainText('Tiada seorang pun');
  });
 });
}
