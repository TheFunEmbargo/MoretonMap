// // imports
// var parse_georaster = require("georaster");
// var GeoRasterLayer = require("georaster-layer-for-leaflet");

// config
var apiKey = 'T8tHKbIsWbZzSiecMaPi'
var server = "http://localhost:8000/"
var url_geotiff = "assets/Moreton_1886_MAP.jpg"
var url_geojson = "MoretonPOI.json"
var imageBounds = [[50.712962863, -2.330185700], [50.669812739, -2.242262067]];

// Map
var map = L.map('map',{
    center: [50.7040515,-2.2764808],
    zoom: 17
});

// Tiles
var bright = L.tileLayer("https://maps.geoapify.com/v1/tile/osm-bright-smooth/{z}/{x}/{y}.png",
    {
    attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 17,
    minZoom: 1
})
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
var baseMaps = {
    "OS 1886": bright,
    "OSM Basemap": osm
};
L.control.layers(baseMaps).addTo(map); 

// Raster
raster = L.imageOverlay(server+url_geotiff, imageBounds).addTo(map);
raster.setStyle({
    opacity: 0.6
})

// Geojson
async function fetchData(url) {
    // get data from json
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(err);
    }
}

var featureGroups = [];
var groupBounds;
var latlngs = [];
fetchData(url_geojson)
.then((features) => {
// create markers width "marker-options-id"
features.map((feat) => {
    featureGroups.push(
    L.marker(feat.geometry.coordinates, {
        icon: L.divIcon({
        className: "leaflet-marker-icon",
        html: `${feat.properties.id}`,
        iconSize: L.point(30, 30),
        popupAnchor: [3, -5],
        }),
        "marker-options-id": feat.properties.id,
    })
    );
});

return features;
})
.then((data) => {
// create feature group
// add markers to map
featureGroups.map((marker) => {
    marker.addTo(map);
});

// create feature group with markers
groupBounds = new L.featureGroup(featureGroups);

// fitBounds of feature group to map
map.fitBounds(groupBounds.getBounds(), {
    padding: [50, 50],
});

// add event listener to markers to open sidebar
groupBounds.on("click", function (e) {
    if (e.layer instanceof L.Marker) {
    showSidebarWidthText(e.layer.options["marker-options-id"]);
    }
});

// content to sodebar depending on marker id
function showSidebarWidthText(id) {
    data.filter((marker) => {
    if (marker.properties.id === id) {
        document.body.classList.add("active-sidebar");
        addContentToSidebar(marker);
    }
    });
}
});

// close when click esc
document.addEventListener("keydown", function (event) {
    // close sidebar when press esc
    if (event.key === "Escape") {
      closeSidebar();
    }
});
  
// close sidebar when click on close button
const buttonClose = document.querySelector(".close-button");
buttonClose.addEventListener("click", () => {
    closeSidebar();
});

function closeSidebar() {
    // remove class active-sidebar
    document.body.classList.remove("active-sidebar");

    // bounds map to default
    boundsMap();
}
function addContentToSidebar(marker) {
    const { id, title, img, info } = marker.properties
    const { type, coordinates} = marker.geometry
      
    // create sidebar content
    const sidebarTemplate = `
      <article class="sidebar-content">
        <h1>${title}</h1>
        <div class="marker-id">${id}</div>
        <div class="info-content">
          <img class="img-zoom" src="${img}" alt="photo missing!!">
          <div class="info-description">${info}</div>
        </div>
      </article>
    `;
  
    const sidebar = document.querySelector(".sidebar");
    const sidebarContent = document.querySelector(".sidebar-content");
  
    // always remove content before adding new one
    sidebarContent?.remove();
  
    // add content to sidebar
    sidebar.insertAdjacentHTML("beforeend", sidebarTemplate);
  
    // set bounds depending on marker coords
    boundsMap(coordinates);
  }
  
  // --------------------------------------------------
  // bounds map when sidebar is open
  function boundsMap(coords) {
    const sidebar = document.querySelector(".sidebar").offsetWidth;
  
    const marker = L.marker(coords);
    const currMarkerGroup = L.featureGroup([marker]);
  
    // bounds depending on whether we have a marker or not
    const bounds = coords ? currMarkerGroup.getBounds() : groupBounds.getBounds();
  
    // set bounds of map depending on sidebar
    map.fitBounds(bounds, {
      paddingTopLeft: [coords ? sidebar : 0, 10],
    });
  }