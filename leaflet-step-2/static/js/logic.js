

// https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson
// https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson
// https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson
var quakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
var platesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

function createDepthColors(numOfColors) {
  var colors = [];
  for (let index = 1; index <= numOfColors; index++) {
    const perc = Math.round((100 / numOfColors) * index);
    console.log(`prec: ${perc}`)
    colors.push(`hsl(${perc}, 100%, 50%)`);
  }
  return colors.reverse();
}

// Generate the colors for the markers based on depth.
var depthColors = createDepthColors(6);

// Perform an API call to the USGS earthquake API. Call createMarkers when complete
d3.json(quakeUrl, createFeatures);

function createFeatures(response) {
  //Grab the features from the response
  var earthquakeData = response.features;
  console.log(earthquakeData);

  // Function to give each feature a popup with the desired data
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3>" + feature.properties.place +
      "</h3><hr><ul><li>" + new Date(feature.properties.time) + "</li>" +
      "<li>Magnitude: " + feature.properties.mag + "</li>" +
      "<li>Depth: " + feature.geometry.coordinates[2] + "</li></ul>");

  }

  // Function to set the color of the marker based on depth
  function depthColor(depth) {
    if (depth > 90)
      return depthColors[5]
    else if (depth > 70)
      return depthColors[4]
    else if (depth > 50)
      return depthColors[3]
    else if (depth > 30)
      return depthColors[2]
    else if (depth > 10)
      return depthColors[1]
    else
      return depthColors[0]
  }

  // Not the true intensity but will give better interpretation vs. just multiplication of radius
  function calcRadius(mag) {
    return 3 * (mag ** 1.5);
  }

  // Create the markers for each earthquake.
  var earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature,
    pointToLayer: function (feature, latlng) { return L.circleMarker(latlng) },
    style: function (feature, latlng) { return { radius: calcRadius(feature.properties.mag), fillOpacity: 0.55, fillColor: depthColor(feature.geometry.coordinates[2]) } },
  });

  // Do the plates layer.
  var tectonicPlates = new L.LayerGroup();
  
  d3.json(platesURL, function (plateData) {
    L.geoJson(plateData, {
      color: "hsl(350,80%,50%)",
      weight: 2
    }).addTo(tectonicPlates);
  });

  // Send it all to the createMap function.
  createMap(earthquakes, tectonicPlates);
}

function createMap(earthquakes, tectonicPlates) {

  // Define streetmap and darkmap layers
  var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    tileSize: 512,
    maxZoom: 18,
    zoomOffset: -1,
    id: "mapbox/streets-v11",
    accessToken: API_KEY
  });

  var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "dark-v10",
    accessToken: API_KEY
  });

  var satelliteMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.satellite",
    accessToken: API_KEY
  });

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Street Map": streetmap,
    "Dark Map": darkmap,
    "SatalliteMap": satelliteMap
  };

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    "Earthquakes": earthquakes,
    "Fault Lines": tectonicPlates
  };

  // Create our map, giving it the streetmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [40, -98],
    zoom: 5,
    layers: [streetmap, earthquakes]
  });

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  var legend = L.control({ position: 'bottomright' });

  legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
      grades = [-10, 10, 30, 50, 70, 90],
      colors = depthColors,
      labels = [];
    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
      div.innerHTML +=
        '<i style="background:' + colors[i] + '"></i> ' +
        grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    return div;
  };

  legend.addTo(myMap);
}







