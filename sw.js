
const cacheName = 'restaurant-stage1';
const urlsToCache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg',
  '/img/10.jpg',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/js/dbhelper.js',
  '/css/styles.css'
];

self.addEventListener('install', function(event) {
  console.log('Service worker installed');
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  )
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if(response) {
        console.log('Loading cached data');
        return response;
      }
      else {
        console.log('No cached data');
        return fetch(event.request)
        .then(function(response) {
          const network = response.clone();
          caches.open('restaurant-stage1').then(function(cache) {
            cache.put(event.request, network);
          })
          return response;
        })
        .catch(function(error) {
          console.log(error);
        });
      }
    })
  );
});
