const staticPATT = "dev-coffee-site-v1"
const assets = [
	"/",
	"/index.html",
	"/css/style.css",
	"/js/app.js",
	"/images/icons/icon-512.png",
	"/images/icons/icon-72.png",
	"/scripts/indtrain.js",
	"/scripts/newtrain.js",
	"/scripts/savedtrains.js",
	"/about.html",
	"/new.html",
	"/view.html",
]

self.addEventListener("install", installEvent => {
	installEvent.waitUntil(
		caches.open(staticPATT).then(cache => {
			cache.addAll(assets)
		})
	)
})

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request)
    })
  )
})
