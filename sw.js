const CACHE='myakta172-pwa-v36';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-v2.svg','./welcome-background.svg','./icon-bacaan-suara.svg','./icon-carta-alir.svg'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('myakta172-pwa-')&&key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const requestUrl=new URL(event.request.url);
  if(requestUrl.origin!==self.location.origin || !event.request.url.startsWith(self.registration.scope))return;
  event.respondWith(
    fetch(event.request).then(response=>{
      const policy=response.headers.get('Cache-Control')||'';
      if(response.ok && !/\b(?:no-store|private)\b/i.test(policy)){
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}));
      }
      return response;
    }).catch(async()=>{
      const ownCache=await caches.open(CACHE);
      const cached=await ownCache.match(event.request);
      if(cached)return cached;
      if(event.request.mode==='navigate'){
        const home=await ownCache.match('./index.html');
        if(home)return home;
      }
      return Response.error();
    })
  );
});