// Audit Peringkat A — Hubungan Antara Seksyen (baca sahaja; tiada kod aplikasi diubah)
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const url=process.env.MYAKTA_TEST_URL||'http://127.0.0.1:8080/';
(async()=>{
 const browser=await chromium.launch({headless:true});
 let checks=0, links=0, withRefs=0, failures=[];
 try{
  for(const mode of ['desktop','mobile']){
   const page=await browser.newPage({viewport:mode==='desktop'?{width:1440,height:900}:{width:390,height:844}});
   try{
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{const welcome=document.querySelector('#myaktaWelcome');if(welcome){welcome.hidden=true;welcome.style.display='none'}});
    if(mode==='mobile')await page.evaluate(()=>document.querySelector('#modeMobile').click());
    const nums=await page.evaluate(()=>DATA.sections.map(s=>s.num));
    assert.equal(nums.length,83);
    for(const n of nums){
     const v=await page.evaluate(n=>{
      show(n);
      const section=DATA.sections.find(s=>s.num===n);
      const nums=new Set(DATA.sections.map(x=>x.num));
      const references=[...section.text.matchAll(/\bseksyen\s+(\d+[A-H]?)(?![\dA-Z])/gi)].map(m=>m[1].toUpperCase()).filter(x=>x!==n);
      const expected=[...new Set(references)].slice(0,20).filter(x=>nums.has(x));
      return {expected,actual:[...document.querySelectorAll('#v22RelatedList button')].map(x=>(x.textContent.match(/Seksyen\s+(\d+[A-H]?)/i)||[])[1]).filter(Boolean)};
     },n);
     // Render updates via MutationObserver microtask; wait for next animation frame.
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));
     const actual=await page.locator('#v22RelatedList button').allTextContents();
     const targets=actual.map(x=>(x.match(/Seksyen\s+(\d+[A-H]?)/i)||[])[1]).filter(Boolean);
     try{assert.deepEqual(targets,v.expected,'Hubungan seksyen '+n+' ['+mode+']')}catch(e){failures.push(e.message)}
     if(mode==='desktop'){links+=targets.length;if(targets.length)withRefs++}
     checks++;
    }
    // Click must open the correct destination on both display modes.
    await page.evaluate(()=>show('19'));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));
    const target=page.locator('#v22RelatedList button').filter({hasText:/Seksyen 22/}).first();
    try{
     assert.equal(await target.count(),1,'Seksyen 19 should offer section 22');
     await target.click();
     await page.waitForFunction(()=>document.getElementById('secTitle')?.textContent.includes('22'));
     checks++;
    }catch(e){failures.push('Navigasi Seksyen 19 -> 22 ('+mode+'): '+e.message)}
   }finally{await page.close()}
  }
 }finally{await browser.close()}
 console.log('RELATED_AUDIT',{totalSections:83,sectionsWithLinks:withRefs,uniqueLinks:links,checks,failures:failures.length});
 failures.forEach(f=>console.error('RELATED_FAIL',f));
 if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
