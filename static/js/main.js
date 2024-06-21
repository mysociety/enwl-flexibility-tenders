const { createApp, ref, toRaw } = Vue;

// nicer than underscore’s default ERB-style `<% %>` delimiters
// but without conflicting with Jekyll’s `{{ }}` delimiters
_.templateSettings = {
    evaluate: /\[\[(.+?)\]\]/g,
    interpolate: /\[\[=(.+?)\]\]/g,
    escape: /\[\[-(.+?)\]\]/g,
};

var renderTemplate = function(id, data){
    return _.template(document.getElementById(id).innerHTML)(data);
};

var quintileBand = function(percentage, band1, band2, band3, band4, band5, noband) {
    if ( ! _.isFinite(percentage) ) {
        return noband;
    } else if ( percentage < 20 ) {
        return band1;
    } else if ( percentage < 40 ) {
        return band2;
    } else if ( percentage < 60 ) {
        return band3;
    } else if ( percentage < 80 ) {
        return band4;
    } else {
        return band5;
    }
};

createApp({
    delimiters: ["${", "}"], // avoid conflict with Jekyll `{{ }}` delimiters
    data() {
        return {
            map: null,
            dataLayers: {}, // dataset details and Leaflet layers, keyed by dataset ID
            visibleLayers: null // Leaflet.FeatureGroup
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
                url: 'static/data/tender-areas.geojson'
            }).done(function(geojsonObj){
                var layer = L.geoJSON(
                    geojsonObj.features,
                    {
                        style: {
                            fillOpacity: 0.2,
                            color: "#FC832A"
                        },
                        onEachFeature: function(feature, layer){
                            var label = renderTemplate('areas-tooltip', {
                                substation_name: feature.properties.tenders[0].substation_name,
                                pr_tenders: _.where(
                                    feature.properties.tenders,
                                    { need_type: 'Peak Reduction' }
                                ).length,
                                ou_tenders: _.where(
                                    feature.properties.tenders,
                                    { need_type: 'Operational Utilisation' }
                                ).length,
                                ouva_tenders: _.where(
                                    feature.properties.tenders,
                                    { need_type: 'Operational Utilisation Variable Availability'}
                                ).length
                            });
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
                            layer.bindTooltip(label, {
                                className: "pe-none" // prevent flicker when mousing over tooltip
                            });
                        }
                    }
                );

                _this.dataLayers['tender-areas'] = {
                    id: 'tender-areas',
                    label: 'ENWL tender areas',
                    layer: layer
                };

                _this.showDataLayer('tender-areas');

                toRaw(_this.map).fitBounds(
                    _this.dataLayers['tender-areas'].layer.getBounds()
                );
            });

            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: 'static/data/points.geojson'
            }).done(function(geojsonObj){
                _.each(
                    _.groupBy(geojsonObj.features, function(feature){ return feature.properties.category; }),
                    function(group, category){
                        var layer = L.geoJSON(
                            group,
                            {
                                pointToLayer: function(feature, latlng){
                                    return L.circleMarker(latlng, {
                                        fillOpacity: 0,
                                        radius: {
                                            member: 9,
                                            monitor: 6,
                                            flex: 3,
                                            boiler: 3
                                        }[feature.properties.category] || 4,
                                        color: {
                                            member: "#FF0000",
                                            monitor: "#0000FF",
                                            flex: "#00CCFF",
                                            boiler: "#FFCC00"
                                        }[feature.properties.category] || "#999"
                                    });
                                },
                                onEachFeature: function(feature, layer){
                                    if ( 'external_id' in feature.properties ) {
                                        var label = feature.properties.category + ' ' + feature.properties.external_id;
                                    } else if ( 'boiler_type' in feature.properties ) {
                                        var label = feature.properties.category + ' type ' + feature.properties.boiler_type;
                                    } else {
                                        var label = feature.properties.category;
                                    }
                                    layer.on('click', function(e){
                                        console.log(feature.properties);
                                    });
                                    layer.bindTooltip(label, {
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
                url: 'static/data/smart-meter-installation.geojson'
            }).done(function(geojsonObj){
                var layer = L.geoJSON(
                    geojsonObj.features,
                    {
                        pointToLayer: function(feature, latlng){
                            return L.polyMarker(latlng, {
                                marker: "D",
                                radius: 6,
                                stroke: false,
                                fillColor: quintileBand(
                                    feature.properties.sm_installation, // 0-100
                                    '#ff0000', // red
                                    '#ffc100', // orange
                                    '#ffff00', // yellow
                                    '#d6ff00', // lime
                                    '#63ff00', // green
                                    '#cccccc'  // grey for errors/missing data
                                ),
                                fillOpacity: 1
                            });
                        },
                        onEachFeature: function(feature, layer){
                            var label = renderTemplate('smart-meters-tooltip', feature.properties);
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
                    label: 'ENWL smart meter adoption',
                    layer: layer
                };
            });

            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: 'static/data/postcode-units.geojson'
            }).done(function(geojsonObj){
                var layer = L.geoJSON(
                    geojsonObj.features,
                    {
                        style: {
                            fillOpacity: 0.00001,
                            color: "#000",
                            weight: 1
                        },
                        onEachFeature: function(feature, layer){
                            // NOTE: Click doesn’t work because there’s no fill
                            layer.on({
                                click: function(e){
                                    console.log(feature.properties);
                                },
                                mouseover: function(e){
                                    e.target.setStyle({
                                        weight: 2,
                                        fillOpacity: 0.1
                                    });
                                },
                                mouseout: function(e){
                                    e.target.setStyle({
                                        weight: 1,
                                        fillOpacity: 0.00001
                                    });
                                }
                            });
                            layer.bindTooltip('<small>' + feature.properties.postcodes + '</small>', {
                                className: "pe-none" // prevent flicker when mousing over tooltip
                            });
                        }
                    }
                );

                _this.dataLayers['postcode-units'] = {
                    id: 'postcode-units',
                    label: 'Postcode units',
                    layer: layer
                };
            });

            $.ajax({
                type: 'GET',
                dataType: 'text',
                url: 'static/data/dumb-meters.csv'
            }).done(function(text){
                var n = function(thing) {
                    return Number(thing || 0);
                };

                var rows = Papa.parse(text, {
                    dynamicTyping: true,
                    header: true,
                    skipEmptyLines: true
                }).data;

                var electricLayer = L.layerGroup();
                var gasLayer = L.layerGroup();

                var gasConsumption = _.pluck(rows, 'gas_consumption_kwh');
                var gasConsumptionMin = _.min(gasConsumption);
                var gasConsumptionMax = _.max(gasConsumption);

                _.each(
                    rows,
                    function(row){
                        var latlng = L.latLng(row.latlon.split(', '));

                        var economy7_percent = Math.round(
                            n(row.electricity_economy7_meters) / n(row.electricity_all_meters) * 100
                        );
                        var gas_percent = Math.round(
                            (n(row.gas_consumption_kwh) - n(gasConsumptionMin)) / n(gasConsumptionMax) * 100
                        );
                        var gas_word = quintileBand(
                            gas_percent, // 0-100
                            'Very low',
                            'Low',
                            'Medium',
                            'High',
                            'Very high',
                            'Unknown'
                        );

                        var electricLabel = renderTemplate('electric-meters-tooltip', {
                            postcode: row.postcode,
                            tender_area: row.tender_area,
                            meters: n(row.electricity_all_meters),
                            economy7_percent: economy7_percent,
                            consumption: Math.round(
                                n(row.electricity_all_consumption_kwh)
                            ).toLocaleString(),
                            mean_consumption: Math.round(
                                n(row.electricity_all_consumption_kwh) / n(row.electricity_all_meters)
                            ).toLocaleString()
                        });
                        var gasLabel = renderTemplate('gas-meters-tooltip', {
                            postcode: row.postcode,
                            tender_area: row.tender_area,
                            meters: n(row.gas_meters),
                            word: gas_word,
                            consumption: Math.round(
                                n(row.gas_consumption_kwh)
                            ).toLocaleString(),
                            mean_consumption: Math.round(
                                n(row.gas_consumption_kwh) / n(row.gas_meters)
                            ).toLocaleString()
                        });

                        L.polyMarker(latlng, {
                            marker: "^",
                            radius: 6,
                            stroke: false,
                            fillColor: quintileBand(
                                economy7_percent, // 0-100
                                '#ff0000', // red
                                '#ffc100', // orange
                                '#ffff00', // yellow
                                '#d6ff00', // lime
                                '#63ff00', // green
                                '#cccccc'  // grey for errors/missing data
                            ),
                            fillOpacity: 1
                        }).bindTooltip(electricLabel, {
                            className: "pe-none" // prevent flicker when mousing over tooltip
                        }).addTo(electricLayer);

                        L.polyMarker(latlng, {
                            marker: "v",
                            radius: 6,
                            stroke: false,
                            fillColor: quintileBand(
                                gas_percent, // 0-100
                                '#ff0000', // red
                                '#ffc100', // orange
                                '#ffff00', // yellow
                                '#d6ff00', // lime
                                '#63ff00', // green
                                '#cccccc'  // grey for errors/missing data
                            ),
                            fillOpacity: 1
                        }).bindTooltip(gasLabel, {
                            className: "pe-none" // prevent flicker when mousing over tooltip
                        }).addTo(gasLayer);
                    }
                );

                _this.dataLayers['electric-meters'] = {
                    id: 'electric-meters',
                    label: 'Domestic electricity, 2022',
                    layer: electricLayer
                };

                _this.dataLayers['gas-meters'] = {
                    id: 'gas-meters',
                    label: 'Domestic gas, 2022',
                    layer: gasLayer
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
