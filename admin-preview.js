/* MyAKTA172 Admin V2 — demonstrasi data rekaan, tiada backend atau simpanan. */
(() => {
  'use strict';
  const P = window.MyAKTAAdminPolicy;
  if (!P) { document.body.textContent = 'Ralat: admin-package-policy.js tidak dimuatkan'; return; }
  const $ = id => document.getElementById(id);
  const DAY = 86400000;
  const now = () => new Date();
  const offset = n => new Date(Date.now() + n * DAY).toISOString();
  const dateLabel = x => x ? new Date(x).toLocaleDateString('ms-MY', {day:'2-digit',month:'short',year:'numeric'}) : '—';
  const money = n => 'RM' + Number(n).toLocaleString('ms-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
  const users = [
    { id:'U001', email:'pengguna01@example.test', plan:'Free', start:null, end:null, status:'Aktif', device:null },
    { id:'U002', email:'pengguna02@example.test', plan:'Basic', start:offset(-8), end:offset(22), status:'Aktif', device:'Peranti-A' },
    { id:'U003', email:'pengguna03@example.test', plan:'Rahmah', start:offset(-10), end:offset(20), status:'Aktif', device:'Peranti-B' },
    { id:'U004', email:'pengguna04@example.test', plan:'Premium', start:offset(-16), end:offset(14), status:'Aktif', device:'Peranti-C' },
    { id:'U005', email:'pengguna05@example.test', plan:'Free', start:null, end:null, status:'Aktif', device:null },
    { id:'U006', email:'pengguna06@example.test', plan:'Basic', start:offset(-48), end:offset(-18), status:'Aktif', device:null },
    { id:'U007', email:'pengguna07@example.test', plan:'Rahmah', start:offset(-4), end:offset(26), status:'Digantung', device:null }
  ];
  const payments = [
    { id:'B001', user:'U002', plan:'Basic', category:'Pembaharuan', amount:15, status:'Menunggu', receipt:'contoh-basic.pdf' },
    { id:'B002', user:'U003', plan:'Rahmah', category:'Pembaharuan', amount:25, status:'Menunggu', receipt:'contoh-rahmah.png' },
    { id:'B003', user:'U004', plan:'Premium', category:'Langganan Baharu', amount:50, status:'Diluluskan', receipt:'contoh-premium.jpg' },
    { id:'B004', user:'U006', plan:'Basic', category:'Pembaharuan', amount:15, status:'Ditolak', receipt:'contoh-tolak.pdf' }
  ];
  let seq = 5;
  const logs = [];
  let selectedUser = null;
  let pendingAction = null;
  let receiptUrl = null;
  function paymentCategory(user, target) {
    if (!user || !P.packages[target] || target === 'Free') return null;
    if (user.plan === 'Free') return 'Langganan Baharu';
    if (user.plan === target) return 'Pembaharuan';
    if (P.order.indexOf(target) > P.order.indexOf(user.plan)) return 'Naik Taraf';
    return null; // penurunan pakej memerlukan proses khusus, bukan pembayaran ini
  }
  function updatePaymentCategory() {
    const category = paymentCategory(getUser($('payUser').value), $('payPlan').value);
    $('payCategory').textContent = category || 'Turun taraf tidak disokong melalui borang ini';
    $('payCategory').classList.toggle('invalid', !category);
    $('receiptForm').querySelector('button[type="submit"]').disabled = !category;
  }
  const getUser = id => users.find(u => u.id === id);
  const getStatus = u => u.status === 'Digantung' ? 'Digantung' : (u.plan !== 'Free' && u.end && new Date(u.end) <= now() ? 'Tamat' : 'Aktif');
  function notify(text) { $('toast').textContent = text; }
  function log(action, target, details) { logs.unshift({at:now().toISOString(),action,target,details}); }
  function element(tag, text, cls) { const n=document.createElement(tag); if(text!==undefined&&text!==null)n.textContent=String(text); if(cls)n.className=cls;return n; }
  function td(tr, text, cls) { const n=element('td',text,cls);tr.append(n);return n; }
  function btn(label, action, id, style='') { const b=element('button',label,'btn '+style);b.type='button';b.dataset.action=action;b.dataset.id=id;return b; }
  function pill(text, state) { return element('span',text,'pill '+(state==='Aktif'||state==='Diluluskan'?'ok':state==='Menunggu'?'warn':state==='Tamat'||state==='Ditolak'||state==='Digantung'?'bad':'')); }
  function selectFill(id, items) {
    const el=$(id), current=el.value;el.replaceChildren();
    for(const x of items){ const o=element('option',x.label);o.value=x.value;el.append(o); }
    el.value=items.some(x=>x.value===current)?current:(items[0]?.value||'');
  }
  function confirmation(title,message,action) {
    pendingAction=action; $('confirmTitle').textContent=title;$('confirmText').textContent=message;
    $('confirmation').showModal();
  }
  function syncSelectedSubscription() {
    const user=getUser($('subUser').value);
    if(user) $('subPlan').value=user.plan;
  }
  function drawerMode() {
    return document.body.classList.contains('preview-mobile') || window.matchMedia('(max-width:760px)').matches;
  }
  function setAdminMenu(open) {
    const expanded=drawerMode() && !!open;
    document.body.classList.toggle('admin-menu-open',expanded);
    $('adminMenuToggle').setAttribute('aria-expanded',String(expanded));
    $('adminMenuToggle').setAttribute('aria-label',expanded?'Tutup menu Admin':'Buka menu Admin');
    $('adminMenuBackdrop').hidden=!expanded;
    $('adminSidebar').inert=drawerMode() && !expanded;
  }
  function switchTab(tab) {
    setAdminMenu(false);
    if(tab==='subscriptions') syncSelectedSubscription();
    document.querySelectorAll('[data-tab]').forEach(b=>{const yes=b.dataset.tab===tab;b.classList.toggle('active',yes);b.setAttribute('aria-current',yes?'page':'false');});
    document.querySelectorAll('main > section.panel').forEach(s=>{s.hidden=s.id!==tab;});
    window.scrollTo({top:0,behavior:'instant'});
  }
  function renderOverview() {
    $('kUsers').textContent=users.length;
    $('kActive').textContent=users.filter(u=>getStatus(u)==='Aktif').length;
    $('kPending').textContent=payments.filter(p=>p.status==='Menunggu').length;
    $('kRevenue').textContent=money(payments.filter(p=>p.status==='Diluluskan').reduce((sum,p)=>sum+p.amount,0));
    $('distribution').replaceChildren();
    for(const name of P.order) {
      const count=users.filter(u=>u.plan===name).length;
      const row=element('div',undefined,'stat-row');
      row.append(element('span',name));const bar=element('div',undefined,'bar');const fill=element('span');fill.style.width=(count/users.length*100)+'%';bar.append(fill);
      row.append(bar,element('b',count));$('distribution').append(row);
    }
    $('recentActivity').replaceChildren();
    if(!logs.length){
      const empty=element('div',undefined,'recent-empty');
      const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
      icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('fill','none');icon.setAttribute('stroke','currentColor');
      icon.setAttribute('stroke-width','1.8');icon.setAttribute('aria-hidden','true');
      const ring=document.createElementNS('http://www.w3.org/2000/svg','circle');ring.setAttribute('cx','12');ring.setAttribute('cy','12');ring.setAttribute('r','9');
      const line=document.createElementNS('http://www.w3.org/2000/svg','path');line.setAttribute('d','M12 11v5m0-8h.01');line.setAttribute('stroke-linecap','round');
      icon.append(ring,line);empty.append(icon,element('p','Tiada perubahan Admin dalam sesi simulasi ini.'));$('recentActivity').append(empty);
    }
    for(const item of logs.slice(0,5))$('recentActivity').append(element('p',dateLabel(item.at)+' · '+item.action+' · '+item.target));
  }
  function renderUsers() {
    const search=$('userSearch').value.trim().toLowerCase(),plan=$('userFilterPlan').value,status=$('userFilterStatus').value;
    const body=$('userRows');body.replaceChildren();
    const records=users.filter(u=>(!search||(u.email.toLowerCase().includes(search)||u.id.toLowerCase().includes(search)))&&(!plan||u.plan===plan)&&(!status||getStatus(u)===status));
    for(const u of records){const tr=element('tr');[u.id,u.email,u.plan].forEach(x=>td(tr,x));
      const s=td(tr);s.append(pill(getStatus(u),getStatus(u)));
      td(tr,dateLabel(u.end));td(tr,u.device?'1 aktif':'0 aktif');
      const cell=td(tr);cell.append(btn('Lihat profil','profile',u.id));body.append(tr);}
    if(!records.length){const tr=element('tr'),col=td(tr,'Tiada padanan pengguna.');col.colSpan=7;body.append(tr);}
    renderUserProfile();
  }
  function renderUserProfile(){
    const box=$('userDetail');box.replaceChildren();
    const u=getUser(selectedUser);box.hidden=!u;if(!u)return;
    box.append(element('h3','Profil Langganan · '+u.id));
    for(const line of ['Emel: '+u.email,'Pakej: '+u.plan+' · '+getStatus(u),'Mula: '+dateLabel(u.start)+' · Tamat: '+dateLabel(u.end),'Sesi peranti: '+(u.device||'Tiada sesi aktif')]) box.append(element('p',line,'small'));
    box.append(element('h3','Sejarah Pembayaran (Simulasi)'));
    const related=payments.filter(p=>p.user===u.id);
    if(!related.length)box.append(element('p','Belum ada rekod pembayaran.','muted'));
    for(const p of related){
      const line=element('div',undefined,'row');line.append(element('span',p.id+' · '+p.category+' · '+p.plan+' · '+money(p.amount)+' · '+p.status,'small'));
      line.append(btn('Lihat Resit','viewReceipt',p.id));box.append(line);
    }
    const b=btn('Pergi ke Langganan','subscriptionUser',u.id,'primary');box.append(b);
  }
  function renderPayments(){
    const body=$('paymentRows');body.replaceChildren();
    for(const p of payments){const tr=element('tr');const u=getUser(p.user);
      [p.id,u?u.email:'—',p.category,p.plan,money(p.amount)].forEach(x=>td(tr,x));
      const receiptCell=td(tr);
      receiptCell.append(element('span',p.receipt,'small'));
      receiptCell.append(document.createTextNode(' '),btn('Lihat Resit','viewReceipt',p.id));
      const s=td(tr);s.append(pill(p.status,p.status));
      const actions=td(tr);
      if(p.status==='Menunggu'){actions.append(btn('Lulus','approvePayment',p.id,'primary'),btn('Tolak','rejectPayment',p.id,'danger'));}
      else actions.textContent='Selesai';
      body.append(tr);
    }
  }
  function clearReceiptUrl(){
    if (receiptUrl) { URL.revokeObjectURL(receiptUrl);receiptUrl=null; }
  }
  function showReceipt(id){
    const p=payments.find(x=>x.id===id);if(!p)return notify('Rekod resit simulasi tidak ditemui.');
    const user=getUser(p.user);
    clearReceiptUrl();
    $('receiptTitle').textContent='Pratonton Resit — '+p.id;
    const details=$('receiptDetails'),view=$('receiptViewport');details.replaceChildren();view.replaceChildren();
    for(const line of ['Rekod: '+p.id,'Emel: '+(user?.email||'—'),
      'Kategori: '+p.category+' · Pakej: '+p.plan,
      'Jumlah: '+money(p.amount)+' · Status: '+p.status,
      'Nama fail: '+p.receipt])details.append(element('div',line));
    if (p.file) {
      receiptUrl=URL.createObjectURL(p.file);
      if (p.file.type==='image/png'||p.file.type==='image/jpeg') {
        const img=element('img');img.src=receiptUrl;img.alt='Pratonton imej resit ujian '+p.id;view.append(img);
      } else if (p.file.type==='application/pdf') {
        const iframe=element('iframe');iframe.src=receiptUrl;iframe.title='Dokumen PDF ujian '+p.id;iframe.setAttribute('sandbox','');view.append(iframe);
        const link=element('a','Buka PDF ujian dalam tab baharu');link.href=receiptUrl;link.target='_blank';link.rel='noopener noreferrer';view.append(link);
      } else {view.append(element('p','Jenis fail ini tidak disokong untuk pratonton.')); }
      view.append(element('p','Fail ini hanya berada dalam memori pelayar sehingga halaman dimuat semula. Jangan gunakan resit pelanggan sebenar.','muted'));
    } else {
      const card=element('article',undefined,'demo-receipt');
      card.append(element('h3','REKOD RESIT SIMULASI'));
      card.append(element('div','BUKAN RESIT BANK SEBENAR','stamp'));
      for(const line of ['No. rujukan DEMO: '+p.id,
        'Pengguna ujian: '+(user?.email||'—'),
        'Tujuan: '+p.category+' — '+p.plan,
        'Nilai: '+money(p.amount),'Status rekod: '+p.status])card.append(element('p',line));
      card.append(element('p','Rekod ini dijana untuk ujian paparan. Tiada imej atau PDF bank sebenar tersedia.','muted'));view.append(card);
    }
    $('receiptDialog').showModal();
  }
  function renderSubscriptions(){
    const body=$('subscriptionRows');body.replaceChildren();
    for(const u of users){const tr=element('tr');[u.id,u.email,u.plan,dateLabel(u.start),dateLabel(u.end)].forEach(x=>td(tr,x));td(tr).append(pill(getStatus(u),getStatus(u)));body.append(tr);}
  }
  function renderPlans(){
    const cards=$('planCards');cards.replaceChildren();
    for(const name of P.order){
      const plan=P.packages[name];const card=element('article',undefined,'tile'+($('sectionPlan').value===name?' active':''));card.append(element('h3',name.toUpperCase()),element('strong',money(plan.price)+' / bulan'),element('p',plan.parts.length+' daripada 12 Bahagian · '+(name==='Free'?'Percuma · Tiada tamat tempoh':'Langganan '+P.subscriptionDays+' hari'),'muted'));
      card.append(btn('Lihat Seksyen','choosePlan',name));cards.append(card);
    }
    const matrix=$('matrixRows');matrix.replaceChildren();
    const addRow=(label,check)=>{const tr=element('tr');td(tr,label);for(const name of P.order){const yes=check(name);const c=td(tr,yes?'✓':'—',yes?'check':'cross');c.setAttribute('aria-label',yes?'Dibenarkan':'Tidak dibenarkan');}matrix.append(tr)};
    for(const part of P.parts)addRow('Bahagian '+part.num+' — '+part.title,n=>P.packages[n].parts.includes(part.num));
    for(const [key,title] of [['search','Carian Seksyen & Kata Kunci, wildcard, Analisis Kes'],['flow','Carta Alir & Cetakan*'],['bookmarks','Kegemaran'],['history','Sejarah Bacaan'],['highlight','Penanda Warna Teks'],['voice','Bacaan Suara'],['glossary','Glosari Istilah'],['related','Hubungan Seksyen Berkaitan (belum aktif)']])addRow(title,n=>P.listedFeature(n,key));
    renderSections();
  }
  function renderSections(){
    const name=$('sectionPlan').value,filter=$('sectionPart').value,body=$('sectionRows');body.replaceChildren();
    for(const part of P.parts.filter(p=>!filter||p.num===filter)){
      for(const id of part.sections){const tr=element('tr');td(tr,'Bahagian '+part.num);td(tr,id,'mono');const status=P.canRead(name,id)?'Dibenarkan':'Dikunci';const cell=td(tr);cell.append(pill(status,status==='Dibenarkan'?'Aktif':'Tamat'));body.append(tr);}
    }
  }
  function renderDevices(){
    const body=$('deviceRows');body.replaceChildren();
    for(const u of users){const tr=element('tr');td(tr,u.email);td(tr,u.plan);td(tr,u.device?'1':'0');td(tr,u.device||'Tiada');body.append(tr);}
  }
  function renderReports(){
    const root=$('reportSummary');root.replaceChildren();
    for(const [label,value] of [['Pengguna',users.length],['Pakej Berbayar',users.filter(u=>u.plan!=='Free').length],['Permohonan Menunggu',payments.filter(p=>p.status==='Menunggu').length],['Kutipan Diluluskan',money(payments.filter(p=>p.status==='Diluluskan').reduce((a,p)=>a+p.amount,0))]]){
      const card=element('article',undefined,'tile');card.append(element('span',label),element('strong',value));root.append(card);
    }
  }
  function renderAudit(){
    const body=$('auditRows');body.replaceChildren();
    if(!logs.length){const tr=element('tr'),c=td(tr,'Belum ada tindakan direkodkan.');c.colSpan=4;body.append(tr);}
    for(const item of logs){const tr=element('tr');[new Date(item.at).toLocaleString('ms-MY'),item.action,item.target,item.details].forEach(x=>td(tr,x));body.append(tr);}
  }
  function renderAll(){renderOverview();renderUsers();renderPayments();renderSubscriptions();renderPlans();renderDevices();renderReports();renderAudit();}
  function approve(id,yes){
    const p=payments.find(x=>x.id===id);if(!p||p.status!=='Menunggu')return notify('Rekod tidak lagi menunggu keputusan.');
    if(yes&&!P.validatePayment(p))return notify('Jumlah bayaran tidak menepati harga pakej.');
    if(yes && p.category!=='Pembaharuan' && p.category!=='Langganan Baharu' && p.category!=='Naik Taraf')return notify('Kategori transaksi tidak sah.');
    if(yes && p.status==='Menunggu' && p.id!=='B003'){
      const expected=paymentCategory(getUser(p.user),p.plan);
      if(expected!==p.category)return notify('Pakej pengguna telah berubah. Permohonan perlu disemak semula sebelum diluluskan.');
    }
    confirmation(yes?'Luluskan pembayaran (demo)?':'Tolak pembayaran (demo)?',
      'Rekod '+p.id+' untuk '+getUser(p.user).email+'. '+(yes?'Simulasi kelulusan akan mengaktifkan akses selama 30 hari.':'Simulasi penolakan tidak akan mengaktifkan akses.'),
      ()=>{p.status=yes?'Diluluskan':'Ditolak';
        if(yes){const u=getUser(p.user),at=now(),renewSamePlan=u.plan===p.plan&&u.end&&new Date(u.end)>at;const base=renewSamePlan?new Date(u.end):at;const dates=P.period30Days(base);u.plan=p.plan;u.start=renewSamePlan?u.start:at.toISOString();u.end=dates.end;u.status='Aktif';}
        log(yes?'Lulus bayaran':'Tolak bayaran',p.user,p.id+' '+p.category+' '+p.plan+' '+money(p.amount));notify('Keputusan '+p.id+' disimpan dalam memori simulasi.');renderAll();}
    );
  }
  function upgrade(){
    const u=getUser($('subUser').value),target=$('subPlan').value,reason=$('subReason').value.trim();
    if(!u||!P.packages[target]||!reason)return notify('Pilih akaun, pakej dan isikan sebab tindakan Admin.');
    if(u.plan===target)return notify('Pengguna sudah berada dalam pakej yang sama.');
    confirmation('Tukar pakej secara manual (demo)?',
      u.email+': '+u.plan+' → '+target+'. Alasan: '+reason+'. Tindakan ini bypass bayaran hanya dalam demonstrasi.',
      ()=>{const prev=u.plan;u.plan=target;u.status='Aktif';if(target==='Free'){u.start=null;u.end=null;}else{const d=P.period30Days(now());u.start=d.start;u.end=d.end;}
        log('Tukar pakej manual',u.id,prev+' → '+target+'; '+reason);$('subReason').value='';notify('Pakej demo ditukar dan log direkod.');renderAll();}
    );
  }
  function renew(){
    const u=getUser($('subUser').value),reason=$('subReason').value.trim();
    if(!u||u.plan==='Free')return notify('Pembaharuan 30 hari hanya untuk pakej berbayar.');
    if(!reason)return notify('Sila isikan sebab pembaharuan.');
    confirmation('Tambah tempoh langganan 30 hari (demo)?',u.email+' · '+u.plan+'. Alasan: '+reason,
      ()=>{const basis=u.end&&new Date(u.end)>now()?new Date(u.end):now(),end=new Date(basis.getTime()+P.subscriptionDays*DAY);
        if(!u.start)u.start=now().toISOString();u.end=end.toISOString();u.status='Aktif';
        log('Pembaharuan 30 hari',u.id,'Tamat baharu: '+dateLabel(u.end)+'; '+reason);$('subReason').value='';notify('Pembaharuan demo dicatat.');renderAll();}
    );
  }
  function resetDevice(){
    const u=getUser($('deviceUser').value),reason=$('deviceReason').value.trim();
    if(!u||!reason)return notify('Pilih akaun dan isikan alasan reset peranti.');
    if(!u.device)return notify('Akaun ini tidak mempunyai peranti aktif.');
    confirmation('Tetapkan semula sesi peranti (demo)?',u.email+' · '+u.device+'. Alasan: '+reason,
      ()=>{const before=u.device;u.device=null;log('Reset peranti',u.id,before+'; '+reason);$('deviceReason').value='';notify('Sesi peranti simulasi telah dikosongkan.');renderAll();}
    );
  }
  function addReceipt(e){
    e.preventDefault();const u=getUser($('payUser').value),plan=$('payPlan').value,f=$('payFile').files[0];
    const category=paymentCategory(u,plan);
    if(!u||!category||!f)return notify('Pilih akaun dan pakej yang layak serta fail resit ujian.');
    const ext=f.name.toLowerCase().split('.').pop();
    const accepted={pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png'};
    if(!accepted[ext]||f.type!==accepted[ext]||f.size<=0||f.size>5*1024*1024)
      return notify('Fail ujian mesti PDF/JPG/PNG dengan jenis fail yang sepadan, 1 bait hingga 5MB.');
    const id='B'+String(seq++).padStart(3,'0');
    payments.unshift({id,user:u.id,plan,category,amount:P.packages[plan].price,status:'Menunggu',receipt:f.name.slice(0,100),file:f});
    log('Permohonan demo',u.id,id+' '+category+' · '+plan+' ('+f.size+' bait)');
    $('payFile').value='';notify('Permohonan '+category+' ('+id+') ditambah. Fail ujian hanya tersedia sementara untuk pratonton, tanpa muat naik.');renderAll();
  }
  function safeCsvValue(value){
    let t=String(value??'');if(/^[\s]*[=+@\-]/.test(t))t="'"+t;
    return '"'+t.replace(/"/g,'""')+'"';
  }
  function exportCsv(filename,headers,records){
    const csv='\ufeff'+[headers,...records].map(r=>r.map(safeCsvValue).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    log('Eksport CSV demo','Admin',filename+' · '+records.length+' rekod');notify('Fail CSV simulasi dijana.');renderAll();
  }
  // Kawalan header rasmi: fungsi UI lokal prototaip, tiada perubahan kepada aplikasi utama.
  let adminScale=1;
  function changeScale(delta){
    adminScale=Math.max(.9,Math.min(1.2,Math.round((adminScale+delta)*10)/10));
    document.documentElement.style.setProperty('--admin-zoom',String(adminScale));
  }
  function setView(mode){
    const mobile=mode==='mobile';
    document.body.classList.toggle('preview-mobile',mobile);
    $('viewDesktop').classList.toggle('active',!mobile);
    $('viewMobile').classList.toggle('active',mobile);
    $('viewDesktop').setAttribute('aria-pressed',String(!mobile));
    $('viewMobile').setAttribute('aria-pressed',String(mobile));
    setAdminMenu(false);
  }
  $('adminMenuToggle').addEventListener('click',()=>setAdminMenu(!document.body.classList.contains('admin-menu-open')));
  $('adminMenuBackdrop').addEventListener('click',()=>setAdminMenu(false));
  $('adminMenuClose').addEventListener('click',()=>{$('adminMenuToggle').focus();setAdminMenu(false);});
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape' && document.body.classList.contains('admin-menu-open')) {
      setAdminMenu(false);$('adminMenuToggle').focus();
    }
  });
  window.addEventListener('resize',()=>setAdminMenu(false));
  $('navHome').addEventListener('click',()=>switchTab('overview'));
  $('fontDecrease').addEventListener('click',()=>changeScale(-.1));
  $('fontIncrease').addEventListener('click',()=>changeScale(.1));
  $('themeToggle').addEventListener('click',()=>{
    const dark=document.body.classList.toggle('theme-dark');
    $('themeToggle').setAttribute('aria-pressed',String(dark));
    $('themeToggle').querySelector('span').textContent=dark?'Siang':'Malam';
  });
  $('viewDesktop').addEventListener('click',()=>setView('desktop'));
  $('viewMobile').addEventListener('click',()=>setView('mobile'));
  $('aboutAdmin').addEventListener('click',()=>$('adminAboutDialog').showModal());
  $('adminAboutClose').addEventListener('click',()=>$('adminAboutDialog').close());
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
  $('userSearch').addEventListener('input',renderUsers);$('userFilterPlan').addEventListener('change',renderUsers);$('userFilterStatus').addEventListener('change',renderUsers);
  $('subUser').addEventListener('change',syncSelectedSubscription);
  $('sectionPlan').addEventListener('change',renderPlans);$('sectionPart').addEventListener('change',renderSections);
  $('payUser').addEventListener('change',updatePaymentCategory);
  $('payPlan').addEventListener('change',updatePaymentCategory);
  $('receiptDialog').addEventListener('close',()=>{clearReceiptUrl();$('receiptViewport').replaceChildren();});
  $('receiptClose').addEventListener('click',()=>$('receiptDialog').close());
  $('receiptForm').addEventListener('submit',addReceipt);$('subUpgrade').addEventListener('click',upgrade);$('subRenew').addEventListener('click',renew);$('resetDevice').addEventListener('click',resetDevice);
  $('exportUsers').addEventListener('click',()=>exportCsv('myakta172-pengguna-demo.csv',['ID','Emel','Pakej','Status','Mula','Tamat','Peranti'],users.map(u=>[u.id,u.email,u.plan,getStatus(u),dateLabel(u.start),dateLabel(u.end),u.device||''])));
  $('exportPayments').addEventListener('click',()=>exportCsv('myakta172-bayaran-demo.csv',['ID','Emel','Kategori','Pakej','RM','Status','Nama Fail Resit'],payments.map(p=>[p.id,getUser(p.user)?.email||'',p.category,p.plan,p.amount,p.status,p.receipt])));
  document.body.addEventListener('click',e=>{
    const b=e.target.closest('button[data-action]');if(!b)return;
    const action=b.dataset.action,id=b.dataset.id;
    if(action==='viewReceipt')showReceipt(id);
    if(action==='profile'){selectedUser=id;renderUserProfile();$('userDetail').scrollIntoView({block:'nearest'});}
    if(action==='subscriptionUser'){$('subUser').value=id;syncSelectedSubscription();switchTab('subscriptions');}
    if(action==='approvePayment')approve(id,true);
    if(action==='rejectPayment')approve(id,false);
    if(action==='choosePlan'){$('sectionPlan').value=id;renderPlans();$('sectionRows').closest('.tablewrap').scrollIntoView({block:'nearest'});}
  });
  $('confirmNo').addEventListener('click',()=>{pendingAction=null;$('confirmation').close();});
  $('confirmation').addEventListener('cancel',()=>{pendingAction=null;});
  $('confirmYes').addEventListener('click',()=>{const callback=pendingAction;pendingAction=null;$('confirmation').close();if(callback)callback();});
  const choices=users.map(u=>({value:u.id,label:u.id+' · '+u.email}));
  for(const id of ['payUser','subUser','deviceUser'])selectFill(id,choices);
  selectFill('sectionPart',[{value:'',label:'Semua Bahagian'},...P.parts.map(p=>({value:p.num,label:'Bahagian '+p.num+' — '+p.title}))]);
  updatePaymentCategory();renderAll();switchTab('overview');setAdminMenu(false);
})();
