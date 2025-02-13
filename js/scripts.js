// Step 1: Define the map
const map = L.map('cities').setView([37.8, -96], 4); // Centered on the U.S.

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Step 2: Fetch request and convert JSON to GeoJSON
fetch('./data/cities.json')
    .then(response => response.json())
    .then(data => {
        // Convert raw city data into GeoJSON format
        const geoJsonData = {
            "type": "FeatureCollection",
            "features": data.map(city => ({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [parseFloat(city.longitude), parseFloat(city.latitude)]  // Ensure these are numbers
                },
                "properties": {
                    "city": city.city,
                    "state": city.state,
                    "rank": parseInt(city.rank, 10),  // Convert rank to integer
                    "population": parseInt(city.population, 10)  // Convert population to integer
                }
            }))
        };

        // Call function to create proportional symbols
        L.geoJson(geoJsonData, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: scaleRadius(feature.properties.population),
                    fillColor: "red",
                    color: "black",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.6
                }).bindPopup(`<b>${feature.properties.city}</b>, ${feature.properties.state}<br>Population: ${feature.properties.population.toLocaleString()}`);
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// Step 3. Function to determine marker size based on population categories
function scaleRadius(population) {
    if (population < 50000) {
        return 4;  // Smallest size
    } else if (population < 100000) {
        return 5;
    } else if (population < 200000) {
        return 7;
    } else if (population < 500000) {
        return 11;
    } else if (population < 1000000) {
        return 17;
    } else {
        return 25;  // Largest size for >1M
    }
}
///////// Chloropleth Map ////////////
// Step 1: Define the map
// Code adapted from Leaflet Tutorial https://leafletjs.com/examples/choropleth/

var map2 = L.map('density').setView([37.8, -96], 4);

var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map2);

// Fetch GeoJSON data and add to map with styling
fetch('/data/states.geojson') // Adjust the path as necessary
    .then(response => response.json())
    .then(data => {
        geojson = L.geoJson(data, {
            style: style,  // Apply the style
            onEachFeature: function (feature, layer) {
                // Add event listeners for mouseover and mouseout
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight
                });
            }
        }).addTo(map2); // Add GeoJSON layer to map

        legend.addTo(map2); //add legend
    })
    .catch(error => console.error('Error loading GeoJSON: ', error));

// Definte color of chloropleth map
function getColor(d) {
    return d > 1000 ? '#662506' :  // Almost black-brown
           d > 500  ? '#993404' :  // Darker brown
           d > 200  ? '#d95f0e' :  // Deep orange-brown
           d > 100  ? '#fe9929' :  // Medium burnt orange
           d > 50   ? '#fec44f' :  // Golden yellow-orange
           d > 20   ? '#fee391' :  // Light tan-yellow
           d > 10   ? '#fff7bc' :  // Pale cream
                      '#ffffe5';  // Very light tan
}



// Function for fill color to be based on density
function style(feature) {
    return {
        fillColor: getColor(feature.properties.density),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

// Add interaction - define mouseover event
// Code adapted from chat GPT3.5-4o
function highlightFeature(e) {
    var layer = e.target;

    // Format density with commas
    var formattedDensity = layer.feature.properties.density.toLocaleString();

    // Display a popup with state name and density on hover
        var popupContent = "<strong>" + layer.feature.properties.name + "</strong><br>" +
        "Density: " + formattedDensity + " people/sq mi";
layer.bindPopup(popupContent).openPopup();
}

// Define what happens on mouseout
function resetHighlight(e) {
    e.target.closePopup(); // Close the popup when the mouse leaves
}

// Add a legend
var legend = L.control({position: 'bottomright'});

var legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 10, 20, 50, 100, 200, 500, 1000],
        labels = [];

    // Add the title with a line break
    div.innerHTML = "<strong>Density</strong><br>(people/sq mi)<br><br>";

    // Generate labels with colored squares
    for (var i = 0; i < grades.length; i++) {
        labels.push(
            '<i style="background:' + getColor(grades[i] + 1) + '; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] : '+')
        );
    }

    div.innerHTML += labels.join('<br>');
    return div;
};

legend.addTo(map2);
