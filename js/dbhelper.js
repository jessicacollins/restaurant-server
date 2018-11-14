/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database URL.
     */
     static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}`;
      }

    /**
     * IndexedDB Promised
     */
     static get dbPromise() {
      if (!navigator.serviceWorker) {
        return Promise.resolve();
      } else {
        return idb.open('db', 1, function (upgradeDb) {
          upgradeDb.createObjectStore('all-restaurants', {keyPath: 'id'});
          upgradeDb.createObjectStore('all-reviews', {keyPath: 'id'});
          upgradeDb.createObjectStore('offline-reviews', {keyPath: 'updatedAt'});
        });
      }
    }

    /**
     * Fetch all restaurants.
     */
     static fetchRestaurants(callback) {

      DBHelper.dbPromise.then(db => {
        if (!db) return;
        const tx = db.transaction('all-restaurants');
        const store = tx.objectStore('all-restaurants');

        store.getAll().then(results => {
          if (results.length === 0) {
            fetch(`${DBHelper.DATABASE_URL}/restaurants`)
            .then(response => {
              return response.json();
            })
            .then(restaurants => {
              const tx = db.transaction('all-restaurants', 'readwrite');
              const store = tx.objectStore('all-restaurants');
              restaurants.forEach(restaurant => {
                store.put(restaurant);
              });
              callback(null, restaurants);
            })
            .catch(error => {
             callback(error, null);
           });
          } else {
            callback(null, results);
          }
        })
      });
    }

    /**
     * Fetch all Reviews.
     */
     static fetchReviews(restaurant, callback) {
      DBHelper.dbPromise.then(db => {
        if (!db) return;

        let restaurantId = restaurant.id;
        const tx = db.transaction('all-reviews');
        const store = tx.objectStore('all-reviews');

        store.getAll()
        .then(results => {
          let reviewList = [];
          for (let i = 0; i < results.length; i++) {
            if (results[i].restaurant_id == restaurantId) {
              reviewList.push(results[i]);
            }
          }
          return reviewList;
        })
        .then(results => {
          if (results && results.length > 0) {
            callback(null, results);
          } else {
            fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurant.id}`)
            .then(response => {
              return response.json();
            })
            .then(reviews => {
              this.dbPromise.then(db => {
                if (!db) return;
                const tx = db.transaction('all-reviews', 'readwrite');
                const store = tx.objectStore('all-reviews');
                reviews.forEach(review => {
                  store.put(review);
                })
              });
              callback(null, reviews);
            })
            .catch(error => {
              callback(error, null);
            })
          }
        })
      })
    }

    static fetchOfflineReviews(restaurantID, callback) {
      DBHelper.dbPromise.then(db => {
        if (!db) return;

        const tx = db.transaction('offline-reviews');
        const store = tx.objectStore('offline-reviews');
        store.getAll()
        .then(results => {
          let offlineReviewList = [];
          for (let i = 0; i < results.length; i++) {
            if (results[i].restaurant_id == restaurantID) {
              offlineReviewList.push(results[i]);
            }
          }
          return offlineReviewList;
        }).then(results => {
          if (results && results.length > 0) {
            callback(null, results);
          }
        })
      })
    }

    /**
     * Fetch a restaurant by its ID.
     */
     static fetchRestaurantById(id, callback) {
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          const restaurant = restaurants.find(r => r.id == id);
          if (restaurant) {
            callback(null, restaurant);
          } else {
            callback('Restaurant does not exist', null);
          }
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
     static fetchRestaurantByCuisine(cuisine, callback) {
        DBHelper.fetchRestaurants((error, restaurants) => {
          if (error) {
            callback(error, null);
          } else {
            const results = restaurants.filter(r => r.cuisine_type == cuisine);
            callback(null, results);
          }
        });
      }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
     static fetchRestaurantByNeighborhood(neighborhood, callback) {
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          const results = restaurants.filter(r => r.neighborhood == neighborhood);
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
     static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          let results = restaurants
          if (cuisine != 'all') {
            results = results.filter(r => r.cuisine_type == cuisine);
          }
          if (neighborhood != 'all') {
            results = results.filter(r => r.neighborhood == neighborhood);
          }
          callback(null, results);
        }
      });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
     static fetchNeighborhoods(callback) {
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
          const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
          callback(null, uniqueNeighborhoods);
        }
      });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
     static fetchCuisines(callback) {
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
          const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
          callback(null, uniqueCuisines);
        }
      });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
      return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
      if (restaurant.photograph) {
        return (`/img/${restaurant.photograph}.jpg`);
      } else {
        return (`/img/restaurant.jpg`);
      }
    }

    /**
     * Restaurant image Alt Text.
     */
    static imageAltForRestaurant(restaurant) {
      return (`${restaurant.name}`);
    }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }

  /**
   * Check restuarant favorite status
   */
   static getFavoriteStatus(restaurant, id) {
    restaurant["is_favorite"] = "false";

    fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/`, {
      method: 'PUT'
    }).then(response => {
      return response.json();
    }).catch(error => {
      callback(error, null);
    });
  }

  /**
   * Update Favorite Status
   */
   static updateFavoriteStatus(restaurant, favorite) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/?is_favorite=${favorite}`, {
      method: 'PUT'
    }).then(response => {
      return response.json();
    }).then(favoriteStatus => {
      DBHelper.dbPromise.then(db => {
        if (!db) return;
        const tx = db.transaction('all-restaurants', 'readwrite');
        const store = tx.objectStore('all-restaurants');
        store.put(favoriteStatus)
      });
      return favoriteStatus;
    }).catch(error => {
      restaurant.is_favorite = favorite;
      DBHelper.dbPromise.then(db => {
        if (!db) return;
        const tx = db.transaction('all-restaurants', 'readwrite');
        const store = tx.objectStore('all-restaurants');
        store.put(restaurant);
      }).catch(error => {
        callback(error, null);
      });
    });
  }

  /**
   * Save Review Form
   */
   static saveReview(data) {
    return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: new Headers({'Content-Type': 'application/json'})
    }).then(response => {
      response.json()
      .then(data => {
        this.dbPromise.then(db => {
          if (!db) return;
          const tx = db.transaction('all-reviews', 'readwrite');
          const store = tx.objectStore('all-reviews');
          store.put(data);
        });
        return data;
      })
    }).catch(error => {
     data['updatedAt'] = new Date().getTime();
     console.log(data);

     this.dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('offline-reviews', 'readwrite');
      const store = tx.objectStore('offline-reviews');
      store.put(data);
    });
     return;
   });
  }

  /**
   * Save Offline Reviews
   */
   static saveOfflineReviews() {
    DBHelper.dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('offline-reviews');
      const store = tx.objectStore('offline-reviews');
      store.getAll().then(offlineReviews => {
        offlineReviews.forEach(review => {
          DBHelper.saveReview(review);
        });
        DBHelper.clearReviews();
      })
    })
  }

  static clearReviews() {
    DBHelper.dbPromise.then(db => {
      const tx = db.transaction('offline-reviews', 'readwrite');
      const store = tx.objectStore('offline-reviews').clear();
    });
    return;
  }
}
