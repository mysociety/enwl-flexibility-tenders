const { createApp, ref, toRaw } = Vue;

createApp({
    delimiters: ["${", "}"], // avoid conflict with Jekyll `{{ }}` delimiters
    data() {
        return {
            map: null,
            dataLayers: {}, // dataset details and Leaflet layers, keyed by dataset ID
            visibleLayers: null, // Leaflet.FeatureGroup
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
            _this.visibleLayers = L.featureGroup().addTo(toRaw(_this.map));

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
                var layer = L.geoJSON(
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
                );

                _this.dataLayers['areas'] = {
                    id: 'areas',
                    label: 'ENWL tender areas',
                    layer: layer
                };

                _this.showDataLayer('areas');

                toRaw(_this.map).fitBounds(
                    _this.dataLayers['areas'].layer.getBounds()
                );
            });

            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: 'static/js/points.geojson'
            }).done(function(geojsonObj){
                _.each(
                    _.groupBy(geojsonObj.features, function(feature){ return feature.properties.category; }),
                    function(group, category){
                        var layer = L.geoJSON(
                            group,
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
                        );

                        _this.dataLayers[category] = {
                            id: category,
                            label: 'Carbon Co-op: ' + category,
                            layer: layer
                        };
                    }
                );
            });

            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: 'static/js/smart-meter-installation.geojson'
            }).done(function(geojsonObj){
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

                var layer = L.geoJSON(
                    geojsonObj.features,
                    {
                        pointToLayer: function(feature, latlng){
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
                );

                _this.dataLayers['smart-meters'] = {
                    id: 'smart-meters',
                    label: 'ENWL smart meter adoption rate',
                    layer: layer
                };
            });
        },

        hideDataLayer(id){
            var _this = this;
            _this.dataLayers[id].layer.removeFrom(_this.visibleLayers);
        },

        showDataLayer(id){
            var _this = this;
            _this.dataLayers[id].layer.addTo(_this.visibleLayers);
        },

        dataLayerIsVisible(id){
            var _this = this;
            return _this.visibleLayers.hasLayer( _this.dataLayers[id].layer );
        },

        toggleDataLayer(id){
            var _this = this;
            if ( _this.dataLayerIsVisible(id) ) {
                _this.hideDataLayer(id);
            } else {
                _this.showDataLayer(id);
            }
        }
    }
}).mount('#app');
