const CACHE="pecule-static-v1";
const ASSETS=["/offline.html","/favicon.svg","/icons/icon-192.png","/icons/icon-512.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin || event.request.method!=="GET") return;
 // Personal pages and API responses are never stored in the browser cache.
 if(event.request.mode==="navigate") {event.respondWith(fetch(event.request).catch(()=>caches.match("/offline.html")));return;}
 if(ASSETS.includes(url.pathname)) event.respondWith(caches.match(event.request).then(cached=>cached || fetch(event.request)));
});

self.addEventListener('push',event=>{let data={};try{data=event.data?.json()??{};}catch{}event.waitUntil(self.registration.showNotification('Pécule',{body:typeof data.body==='string'?data.body:'Un moment pour faire le point sur votre journée ?',icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',tag:data.tag==='pecule-reminder-test'?'pecule-reminder-test':'pecule-daily-review',data:{url:'/?daily-review=1'}}));});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{const url=new URL('/?daily-review=1',self.location.origin).href;const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clients)if(new URL(client.url).origin===self.location.origin){await client.navigate(url);await client.focus();return;}await self.clients.openWindow(url);})());});
