let restaurants,
  neighborhoods,
  cuisines;
var newMap;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiYWxpbWFobW91ZDciLCJhIjoiY2pqdm1ncXQ4MHR4ZjNycnJobXFoYmwweiJ9.TMWFJkGRL-d-OYFfOfKbdw',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
};
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const picture = document.createElement('picture');
  picture.className = 'restaurant-img';
  // picture.setAttribute('role', 'img');
  const imgUrl = DBHelper.imageUrlForRestaurant(restaurant);
  // const [imgUrlName, imgType] = imgUrl.split('.');
  const [imgUrlName, imgType] = [imgUrl, 'jpg'];
  const source1 = document.createElement('source');
  const source2 = document.createElement('source');
  const image = document.createElement('img');

  source1.setAttribute('media', '(min-width: 701px)');
  source1.setAttribute('srcset', `${imgUrlName}-800_2x.${imgType} 2x, ${imgUrlName}-800_1x.${imgType} 1x`);

  source2.setAttribute('media', '(max-width: 700px)');
  source2.setAttribute('srcset', `${imgUrlName}-400_2x.${imgType} 2x, ${imgUrlName}-400_1x.${imgType} 1x`);

  image.className = 'restaurant-img';
  image.src = `${imgUrlName}-800_1x.${imgType}`;
  image.setAttribute('srcset', `${imgUrlName}-800_2x.${imgType} 2x, ${imgUrlName}-400_1x.${imgType} 1x`);
  image.alt = `An Image of ${restaurant.name} Restaurant`;

  picture.append(source1);
  picture.append(source2);
  picture.append(image);
  li.append(picture);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  name.setAttribute('tabindex', '0');
  li.append(name);

  const favBtn = document.createElement('button');
  favBtn.innerHTML = '❤';
  favBtn.classList.add("fav-btn");
  if(restaurant.is_favorite) {
    favBtn.classList.add('fav-active');
    favBtn.setAttribute('aria-label', 'Remove as favorite');
  } else {
    favBtn.setAttribute('aria-label', 'Mark as favorite');
  }

  favBtn.onclick = (e) => {
    // Toggle button favorite status
    const isFav = !restaurant.is_favorite;
    restaurant.is_favorite = isFav;

    if(isFav) {
      favBtn.classList.add('fav-active');
      favBtn.setAttribute('aria-label', 'Remove as favorite');
    } else {
      favBtn.classList.remove('fav-active');
      favBtn.setAttribute('aria-label', 'Mark as favorite');
    }

    // Update the server and indexedDB restaurant favorite status
    DBHelper.updateFavoriteStatus(restaurant.id, isFav);
  };
  li.append(favBtn);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('role', 'button');
  more.title = `View Details about ${restaurant.name} Restaurant`;
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

};
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

