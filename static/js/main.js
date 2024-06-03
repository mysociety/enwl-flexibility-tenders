const { createApp, ref, toRaw } = Vue;

createApp({
    delimiters: ["${", "}"], // avoid conflict with Jekyll `{{ }}` delimiters
    data() {
        return {
            map: null,
            areas: null, // Leaflet.GeoJSON layer, for storing all areas
            points: null, // Leaflet.GeoJSON layer, for storing points
            points2: null, // TODO: Sort this out!!
            colors: {
                tender: "#FC832A",
                member: "#FF0000",
                monitor: "#0000FF",
                flex: "#FFFF00",
                boiler: "#00FFFF"
            }
        }
    },
    computed: {

    },
    mounted() {
        var _this = this;
        _this.setUpMap();
    },
    watch: {

    },
    methods: {
        setUpMap(){
            var _this = this;

            _this.map = L.map(_this.$refs.map).setView([54.0934, -2.8948], 7);

            L.tileLayer(
                'https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=7ac28b44c7414ced98cd4388437c718d',
                {
                    maxZoom: 19,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }
            ).addTo(toRaw(_this.map));

            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: 'static/js/areas.geojson'
            }).done(function(geojsonObj){
                _this.areas = L.geoJSON(
                    geojsonObj.features,
                    {
                        style: {
                            fillOpacity: 0.2,
                            color: _this.colors['tender']
                        },
                        onEachFeature: function(feature, layer){
                            layer.on('mouseover', function(e){
                                this.setStyle({ fillOpacity: 0.4 });
                                this.openTooltip(e.latlng);
                            });
                            layer.on('mousemove', function(e){
                                this.openTooltip(e.latlng);
                            });
                            layer.on('mouseout', function(){
                                this.setStyle({ fillOpacity: 0.2 });
                                this.closeTooltip();
                            });
                            layer.on('click', function(e){
                                console.log(feature.properties);
                                this.openTooltip(e.latlng);
                            });
                            layer.bindTooltip(feature.properties.tenders[0].substation_name, {
                                className: "pe-none" // prevent flicker when mousing over tooltip
                            });
                        }
                    }
                ).addTo(toRaw(_this.map));
                toRaw(_this.map).fitBounds(_this.areas.getBounds());
            });

            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: 'static/js/points.geojson'
            }).done(function(geojsonObj){
                _this.points = L.geoJSON(
                    geojsonObj.features,
                    {
                        pointToLayer: function(feature, latlng){
                            return L.circleMarker(latlng, {
                                radius: 4,
                                color: _this.colors[feature.properties.category] || "#999"
                            });
                        },
                        onEachFeature: function(feature, layer){
                            layer.on('click', function(e){
                                console.log(feature.properties);
                            });
                            layer.bindTooltip(feature.properties.category, {
                                className: "pe-none" // prevent flicker when mousing over tooltip
                            });
                        }
                    }
                ).addTo(toRaw(_this.map));
            });

            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: 'static/js/smart-meter-installation.geojson'
            }).done(function(geojsonObj){
                _this.points2 = L.geoJSON(
                    geojsonObj.features,
                    {
                        pointToLayer: function(feature, latlng){
                            var getColor = function(percentage) {
                                if ( percentage < 20 ) {
                                    return '#ff0000'; // red
                                } else if ( percentage < 40 ) {
                                    return '#ffc100'; // orange
                                } else if ( percentage < 60 ) {
                                    return '#ffff00'; // yellow
                                } else if ( percentage < 80 ) {
                                    return '#d6ff00'; // lime
                                } else {
                                    return '#63ff00'; // green
                                }
                            };
                            return L.polyMarker(latlng, {
                                marker: "D",
                                radius: 6,
                                stroke: false,
                                fillColor: getColor(feature.properties.sm_installation),
                                fillOpacity: 1
                            });
                        },
                        onEachFeature: function(feature, layer){
                            var label = '<small class="d-block text-muted">Substation ' + feature.properties.dist_number + '</small>' + feature.properties.smart_meters + ' out of ' + feature.properties.all_customers + ' customers (' + feature.properties.sm_installation + '%) have a smart meter';
                            layer.on('click', function(e){
                                console.log(feature.properties);
                            });
                            layer.bindTooltip(label, {
                                className: "pe-none" // prevent flicker when mousing over tooltip
                            });
                        }
                    }
                ).addTo(toRaw(_this.map));
            });
        }
    }
}).mount('#app');
