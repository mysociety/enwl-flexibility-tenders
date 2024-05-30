$(function(){
    console.log('jQuery ready')
    console.log('_.now()', _.now())
    console.log('bootstrap.Modal', bootstrap.Modal);
    console.log('leaflet', leaflet);

    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    var marker = L.marker([51.5, -0.09]).addTo(map);

})
