/*
 * Trevor English
 * 08-15-2023
 *
 * A program that lets the user access Strava API to visualize all their activities overlayed on a single Leaflet map, similar to Strava's style-guide.
 */

const auth_link = "https://www.strava.com/oauth/token";

function getActivities(res) {
  const activities_link = `https://www.strava.com/api/v3/activities?access_token=${res.access_token}`;
  fetch(activities_link)
    .then((res) => res.json())
    .then(function (data) {
      var map = L.map("map").setView([34.4208, -119.6982], 13);

      var pin = L.icon({
        iconUrl: "pin.svg",
        iconSize: [30, 30], 
        iconAnchor: [15, 25],
      });

      var markers = [];

      L.tileLayer(
        "https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=LxxdRh2WgA3b9Cs6Zo2HvwYIOxmi9mso32RRvHI1ag8OJHfvICCekhFPKtDxrOC1",
        {}
      ).addTo(map);

      data.forEach(function (activity) {
        var coordinates = L.Polyline.fromEncoded(
          activity.map.summary_polyline
        ).getLatLngs();
        var polyline = L.polyline(coordinates, {
          color: "#FC4C02",
          weight: 3,
          opacity: 1,
        }).addTo(map);

        polyline.on("click", function (e) {
          L.popup()
            .setLatLng(e.latlng)
            .setContent(
              `
                            <span style="font-size: 10px;">${
                              activity.type
                            } on ${formatDate(activity.start_date)}</span><br>
                            <span style="font-weight: bold; font-size: 16px; line-height: 1.75;">${
                              activity.name
                            }</span><br>
                            Distance: ${getMiles(activity.distance)} Miles<br>
                            Avg Speed: ${getAverageSpeedInMPH(
                              activity.average_speed
                            )} mi/hr<br>
                            `
            )
            .openOn(map);
        });
        map.on("zoomend", function () {
          if (map.getZoom() < 12) {
            var bounds = polyline.getBounds();
            var centerLatLng = bounds.getCenter();
            var marker = L.marker(centerLatLng, { icon: pin }).addTo(map);

            marker.on("click", function (e) {
              L.popup()
                .setLatLng(e.latlng)
                .setContent(
                    `
                    <span style="font-size: 10px;">${activity.type} on ${formatDate(activity.start_date)}</span><br>
                    <span style="font-weight: bold; font-size: 16px; line-height: 1.75;">${activity.name}</span><br>
                    Distance: ${getMiles(activity.distance)} Miles<br>
                    Avg Speed: ${getAverageSpeedInMPH(activity.average_speed)} mi/hr<br>
                    `
                )
                .openOn(map);
            });
            markers.push(marker);
          }

          // Remove previously added markers and clear the array of markers
          else if (map.getZoom() >= 12) {
            markers.forEach(function (marker) {
              map.removeLayer(marker);
            });
            markers = [];
          }
        });
      });
    });
}

function getMiles(meters) {
  return (meters * 0.000621371192).toFixed(2);
}

function getAverageSpeedInMPH(average_speed) {
  return (average_speed * 0.000621371192 * 3600).toFixed(2);
}

function formatDate(inputDate) {
  const date = new Date(inputDate);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function reAuthorize() {
  fetch(auth_link, {
    method: "post",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },

    // The information below can be found at https://www.strava.com/settings/api once you create an API application
    body: JSON.stringify({
      client_id: "112194",
      client_secret: "7598102ddc7589d0e381a43bb9f6a776073c26f1",
      refresh_token: "6eb570cc320bba56b0aa278db0ca820418d7f097",
      grant_type: "refresh_token",
    }),
  })
    .then((res) => res.json())
    .then((res) => getActivities(res));
}

reAuthorize();
