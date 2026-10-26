// Ujian khusus Dashboard Admin berasingan. Tidak memeriksa/mengubah aplikasi utama.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url);
const P = require('../admin-package-policy.js');
const origin = process.env.ADMIN_TEST_URL || 'http://127.0.0.1:8000';
let passes = 0;
function verifyPolicy(){
  assert.equal(P.parts.length,12);
  assert.equal(P.knownSections.length,83);
  assert.equal(new Set(P.knownSections).size,83);
  assert.deepEqual(P.order,['Free','Basic','Rahmah','Premium']);
  assert.deepEqual(P.order.map(p=>P.packages[p].price),[0,15,25,50]);
  const expected={Free:['I','II'],Basic:['I','II','IIA','IIB','III'],Rahmah:['I','II','IIA','IIB','III','IV'],Premium:P.parts.map(p=>p.num)};
  for(const plan of P.order) {
    assert.deepEqual(P.packages[plan].parts, expected[plan]);
    for(const part of P.parts)for(const id of part.sections)
      assert.equal(P.canRead(plan,id),expected[plan].includes(part.num),plan+' section '+id);
  }
  assert.equal(P.canRead('Free','2A'),true);
  assert.equal(P.canRead('Free','6A'),false);
  assert.equal(P.canRead('Basic','17'),true);
  assert.equal(P.canRead('Basic','18'),false);
  assert.equal(P.canRead('Rahmah','18'),true);
  assert.equal(P.canRead('Rahmah','32'),false);
  assert.equal(P.canRead('Premium','35H'),true);
  assert.equal(P.canUseFeature('Basic','flow'),false);
  assert.equal(P.canUseFeature('Rahmah','flow'),true);
  assert.equal(P.listedFeature('Basic','related'),true);
  assert.equal(P.canUseFeature('Basic','related'),false);
  assert.equal(P.canUseChart('Rahmah',[]),false); // gagal tertutup jika tiada pemetaan seksyen disahkan
  assert.equal(P.canPrintChart('Rahmah',['18','32']),false); // Bahagian V terlarang
  assert.equal(P.canUseChart('Premium',[]),false);
  assert.equal(P.validatePayment({plan:'Basic',amount:15}),true);
  assert.equal(P.validatePayment({plan:'Basic',amount:25}),false);
  assert.equal(new Date(P.period30Days('2026-10-27T00:00:00Z').end).getTime()-new Date('2026-10-27T00:00:00Z').getTime(),30*24*3600000);
  passes++;console.log('PASS dasar hak akses 12 Bahagian / 83 Seksyen + matriks 4 pakej');
}
async function main(){
  verifyPolicy();
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try {
    const page=await browser.newPage({viewport:{width:1350,height:850}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/admin-preview.html',{waitUntil:'load'});
    await assert.equal(await page.locator('#kUsers').innerText(),'7');
    await assert.equal(await page.locator('#kPending').innerText(),'2');
    assert.equal(errors.length,0,errors.join('\n')); passes++;console.log('PASS halaman desktop dan KPI data demo');
    await page.locator('[data-tab=plans]').click();
    assert.equal(await page.locator('#matrixRows tr').count(),20);
    assert.equal(await page.locator('#sectionRows tr').count(),83);
    await page.locator('#sectionPlan').selectOption('Rahmah');
    await page.locator('#sectionPart').selectOption('V');
    assert.equal(await page.locator('#sectionRows tr').count(),4);
    assert.equal(await page.locator('#sectionRows tr:first-child td:last-child').innerText(),'Dikunci');
    passes++;console.log('PASS matriks dan tapisan seksyen berasaskan DATA.parts');
    await page.locator('[data-tab=users]').click();
    await page.locator('#userSearch').fill('pengguna02');
    assert.equal(await page.locator('#userRows tr').count(),1);
    await page.locator('#userRows button').click();
    assert.match(await page.locator('#userDetail').innerText(),/pengguna02@example.test/);
    passes++;console.log('PASS carian emel dan profil pengguna');
    const previousExpiry=await page.locator('#subscriptionRows tr:nth-child(2) td:nth-child(5)').textContent();
    await page.locator('[data-tab=payments]').click();
    await page.locator('#paymentRows button[data-action=approvePayment]').first().click();
    await page.locator('#confirmYes').click();
    assert.equal(await page.locator('#kPending').innerText(),'1');
    assert.notEqual(await page.locator('#subscriptionRows tr:nth-child(2) td:nth-child(5)').textContent(),previousExpiry,'Pembaharuan aktif patut memanjangkan tempoh');
    assert.match(await page.locator('#paymentRows').innerText(),/Diluluskan/);
    await page.locator('#payUser').selectOption('U005');
    await page.locator('#payPlan').selectOption('Rahmah');
    await page.locator('#payFile').setInputFiles({name:'resit-ujian.pdf',mimeType:'application/pdf',buffer:Buffer.from('Ujian sahaja')});
    await page.locator('#receiptForm button[type=submit]').click();
    assert.match(await page.locator('#paymentRows').innerText(),/resit-ujian.pdf/);
    assert.equal(await page.locator('#kPending').innerText(),'2');
    passes++;console.log('PASS kelulusan rekod demo dan kemas kini status');
    await page.locator('[data-tab=subscriptions]').click();
    await page.locator('#subUser').selectOption('U002');
    await page.locator('#subPlan').selectOption('Premium');
    await page.locator('#subReason').fill('Pelarasan ujian Admin');
    await page.locator('#subUpgrade').click();
    await page.locator('#confirmYes').click();
    assert.match(await page.locator('#subscriptionRows').innerText(),/Premium/);
    await page.locator('#subReason').fill('Pembaruan ujian');
    await page.locator('#subRenew').click();
    await page.locator('#confirmYes').click();
    await page.locator('[data-tab=audit]').click();
    assert.match(await page.locator('#auditRows').innerText(),/Pembaharuan 30 hari/);
    passes++;console.log('PASS tukar pakej dan pembaharuan 30 hari dengan audit');
    await page.locator('[data-tab=devices]').click();
    await page.locator('#deviceUser').selectOption('U002');
    await page.locator('#deviceReason').fill('Peranti rosak');
    await page.locator('#resetDevice').click();
    await page.locator('#confirmYes').click();
    assert.match(await page.locator('#deviceRows').innerText(),/0/);
    passes++;console.log('PASS reset peranti demo');
    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await mobile.goto(origin+'/admin-preview.html',{waitUntil:'load'});
    assert.equal(await mobile.locator('#kUsers').innerText(),'7');
    const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
    assert.equal(overflow,false,'Halaman tidak patut overflow secara global pada mobile');
    passes++;console.log('PASS mod mobile + tiada overflow global');
    await page.reload({waitUntil:'load'});
    assert.equal(await page.locator('#kPending').innerText(),'2','Simulasi tidak boleh kekal di storan');
    passes++;console.log('PASS tiada persistence selepas reload');
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('SEMUA '+passes+' KUMPULAN UJIAN DASHBOARD ADMIN LULUS');
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
