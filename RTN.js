async function calculateRoute(start, end) {
    const baseUrl = 'https://api.openrouteservice.org/v2/directions/driving-car';
    const noTrafficUrl = `${baseUrl}?api_key=${apiKey}&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`;
    const withTrafficUrl = `${noTrafficUrl}&attributes=road_type,traffic`;

    try {
        // Fetch route with traffic data
        const responseWithTraffic = await fetch(withTrafficUrl);
        const resultWithTraffic = await responseWithTraffic.json();
        
        if (resultWithTraffic.features) {
            const route = resultWithTraffic.features[0];
            const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            const distance = (route.properties.segments[0].distance / 1000).toFixed(2); // km
            const etaWithTraffic = Math.ceil(route.properties.segments[0].duration / 60); // minutes

            // Fetch route without traffic for comparison
            const responseNoTraffic = await fetch(noTrafficUrl);
            const resultNoTraffic = await responseNoTraffic.json();
            const etaWithoutTraffic = Math.ceil(resultNoTraffic.features[0].properties.segments[0].duration / 60); // minutes

            // Calculate the ETA difference due to traffic
            const trafficDelay = etaWithTraffic - etaWithoutTraffic;
            document.getElementById('info').textContent = `Distance: ${distance} km | ETA: ${etaWithTraffic} mins | Delay due to traffic: ${trafficDelay} mins`;

            // Trigger rerouting if delay is substantial (e.g., more than 10 minutes)
            if (trafficDelay > 10) {
                alert("Heavy traffic detected! Rerouting...");
                findAlternativeRoute(start, end);
            } else {
                if (routeLayer) map.removeLayer(routeLayer);
                routeLayer = L.polyline(coordinates, { color: 'blue' }).addTo(map);
                map.fitBounds(routeLayer.getBounds());
                displayDirections(route.properties.segments[0].steps);
            }
        } else {
            alert("Could not retrieve route information.");
        }
    } catch (error) {
        console.error("Error fetching route data:", error);
    }
}
