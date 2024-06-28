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
    } else if ( percentage <= 0 ) {
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

var n = function(thing) {
    return Number(thing || 0);
};

createApp({
    delimiters: ["${", "}"], // avoid conflict with Jekyll `{{ }}` delimiters
    data() {
        return {
            map: null,
            inspector: {
                label: null,
                records: []
            },
            dataLayers: [
                {
                    id: 'tender-areas',
                    label: 'ENWL tender areas',
                    layer: null
                },
                {
                    id: 'smart-meters',
                    label: 'ENWL smart meter adoption',
                    layer: null,
                },
                {
                    id: 'dumb-meters',
                    label: 'Electricity & Gas, 2022',
                    shaders: [
                        {
                            id: 'none',
                            label: 'No shading',
                            getStyle: function(feature, dataLayer) {
                                return {
                                    color: '#3388ff'
                                };
                            }
                        },
                        {
                            id: 'electricity_all_meters',
                            label: 'Number of electricity meters',
                            getStyle: function(feature, dataLayer) {
                                var stat = dataLayer.stats['electricity_all_meters'];
                                var pct = (n(feature.properties.electricity_all_meters) - n(stat.min)) / n(stat.max) * 100;

                                return {
                                    color: quintileBand(
                                        pct, // 0-100
                                        '#ff0000', // red
                                        '#ffc100', // orange
                                        '#ffff00', // yellow
                                        '#d6ff00', // lime
                                        '#63ff00', // green
                                        '#999999'  // grey for errors/missing data
                                    )
                                };
                            }
                        },
                        {
                            id: 'electricity_all_consumption_kwh',
                            label: 'Total electricity consumption',
                            getStyle: function(feature, dataLayer) {
                                var stat = dataLayer.stats['electricity_all_consumption_kwh'];
                                var pct = (n(feature.properties.electricity_all_consumption_kwh) - n(stat.min)) / n(stat.max) * 100;

                                return {
                                    color: quintileBand(
                                        pct, // 0-100
                                        '#ff0000', // red
                                        '#ffc100', // orange
                                        '#ffff00', // yellow
                                        '#d6ff00', // lime
                                        '#63ff00', // green
                                        '#999999'  // grey for errors/missing data
                                    )
                                };
                            }
                        },
                        {
                            id: 'electricity_economy7_meters',
                            label: 'Number of Economy7 meters',
                            getStyle: function(feature, dataLayer) {
                                var stat = dataLayer.stats['electricity_economy7_meters'];
                                var pct = (n(feature.properties.electricity_economy7_meters) - n(stat.min)) / n(stat.max) * 100;

                                return {
                                    color: quintileBand(
                                        pct, // 0-100
                                        '#ff0000', // red
                                        '#ffc100', // orange
                                        '#ffff00', // yellow
                                        '#d6ff00', // lime
                                        '#63ff00', // green
                                        '#999999'  // grey for errors/missing data
                                    )
                                };
                            }
                        },
                        {
                            id: 'economy7_percent',
                            label: 'Proportion of meters that are Economy7',
                            getStyle: function(feature, dataLayer) {
                                var economy7_percent = Math.round(
                                    n(feature.properties.electricity_economy7_meters) / n(feature.properties.electricity_all_meters) * 100
                                );

                                return {
                                    color: quintileBand(
                                        economy7_percent, // 0-100
                                        '#ff0000', // red
                                        '#ffc100', // orange
                                        '#ffff00', // yellow
                                        '#d6ff00', // lime
                                        '#63ff00', // green
                                        '#999999'  // grey for errors/missing data
                                    )
                                };
                            }
                        },
                        {
                            id: 'gas_meters',
                            label: 'Number of gas meters',
                            getStyle: function(feature, dataLayer) {
                                var stat = dataLayer.stats['gas_meters'];
                                var pct = (n(feature.properties.gas_meters) - n(stat.min)) / n(stat.max) * 100;

                                return {
                                    color: quintileBand(
                                        pct, // 0-100
                                        '#ff0000', // red
                                        '#ffc100', // orange
                                        '#ffff00', // yellow
                                        '#d6ff00', // lime
                                        '#63ff00', // green
                                        '#999999'  // grey for errors/missing data
                                    )
                                };
                            }
                        },
                        {
                            id: 'gas_consumption_kwh',
                            label: 'Total gas consumption',
                            getStyle: function(feature, dataLayer) {
                                var stat = dataLayer.stats['gas_consumption_kwh'];
                                var pct = (n(feature.properties.gas_consumption_kwh) - n(stat.min)) / n(stat.max) * 100;

                                return {
                                    color: quintileBand(
                                        pct, // 0-100
                                        '#ff0000', // red
                                        '#ffc100', // orange
                                        '#ffff00', // yellow
                                        '#d6ff00', // lime
                                        '#63ff00', // green
                                        '#999999'  // grey for errors/missing data
                                    )
                                };
                            }
                        }
                    ],
                    selectedShader: 'none',
                    layer: null
                }
                // Carbon Co-op member data gets added later
            ],
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

            _this.map.createPane('polygonPane');
            _this.map.createPane('pointPane');
            _this.map.getPane('polygonPane').style.zIndex = 300;
            _this.map.getPane('pointPane').style.zIndex = 350;

            L.tileLayer(
                'https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=7ac28b44c7414ced98cd4388437c718d',
                {
                    maxZoom: 19,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }
            ).addTo(toRaw(_this.map));

            $.when(
                $.ajax({
                    type: 'GET',
                    dataType: 'json',
                    url: 'static/data/tender-areas.geojson'
                }),
                $.ajax({
                    type: 'GET',
                    dataType: 'text',
                    url: 'static/data/tenders.csv'
                }),
            ).done(function(responseObj1, responseObj2){
                var tenders = Papa.parse(responseObj2[0], {
                    dynamicTyping: true,
                    header: true,
                    skipEmptyLines: true
                }).data;

                var layer = L.geoJSON(
                    responseObj1[0].features,
                    {
                        pane: 'polygonPane',
                        style: {
                            fillOpacity: 0.2,
                            color: "#FC832A"
                        },
                        onEachFeature: function(feature, layer){
                            var label = renderTemplate('areas-tooltip', {
                                substation_name: feature.properties.substation_name,
                                pr_tenders: _.where(tenders, {
                                    Substation_Name: feature.properties.substation_name,
                                    Need_Type: 'Peak Reduction'
                                }).length,
                                ou_tenders: _.where(tenders, {
                                    Substation_Name: feature.properties.substation_name,
                                    Need_Type: 'Operational Utilisation'
                                }).length,
                                ouva_tenders: _.where(tenders, {
                                    Substation_Name: feature.properties.substation_name,
                                    Need_Type: 'Operational Utilisation Variable Availability'
                                }).length
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
                                _this.inspector = {
                                    label: feature.properties.substation_name,
                                    records: _.where(tenders, {
                                        Substation_Name: feature.properties.substation_name
                                    })
                                };
                            });
                            layer.bindTooltip(label, {
                                className: "pe-none" // prevent flicker when mousing over tooltip
                            });
                        }
                    }
                );

                _this.getDataLayer('tender-areas').layer = layer;
                _this.showDataLayer('tender-areas');

                toRaw(_this.map).fitBounds(
                    _this.getDataLayer('tender-areas').layer.getBounds()
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
                                pane: 'pointPane',
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
                                        _this.inspector = {
                                            label: label,
                                            records: [ feature.properties ]
                                        };
                                    });
                                    layer.bindTooltip(label, {
                                        className: "pe-none" // prevent flicker when mousing over tooltip
                                    });
                                }
                            }
                        );

                        _this.dataLayers.push({
                            id: category,
                            label: 'Carbon Co-op: ' + category,
                            layer: layer
                        });
                        _this.getDataLayer(category).layer = layer;
                    }
                );
            });

            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: 'static/data/smart-meters.geojson'
            }).done(function(geojsonObj){
                var layer = L.geoJSON(
                    geojsonObj.features,
                    {
                        pane: 'pointPane',
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
                                _this.inspector = {
                                    label: 'Substation ' + feature.properties.dist_number,
                                    records: [ feature.properties ]
                                };
                            });
                            layer.bindTooltip(label, {
                                className: "pe-none" // prevent flicker when mousing over tooltip
                            });
                        }
                    }
                );

                _this.getDataLayer('smart-meters').layer = layer;
            });

            $.when(
                $.ajax({
                    type: 'GET',
                    dataType: 'json',
                    url: 'static/data/postcode-units.geojson'
                }),
                $.ajax({
                    type: 'GET',
                    dataType: 'text',
                    url: 'static/data/dumb-meters.csv'
                })
            ).done(function(responseObj1, responseObj2){
                var meters = Papa.parse(responseObj2[0], {
                    dynamicTyping: true,
                    header: true,
                    skipEmptyLines: true
                }).data;

                var layer = L.geoJSON(
                    responseObj1[0].features,
                    {
                        pane: 'polygonPane',
                        style: {
                            color: '#3388ff',
                            weight: 1,
                            fillOpacity: 0.2
                        },
                        onEachFeature: function(feature, layer){
                            // Enrich GeoJSON feature properties with data from CSV,
                            // to make data easier to work with in Leaflet.GeoJSON.eachLayer
                            feature.properties = _.extend(
                                feature.properties,
                                _.findWhere(
                                    meters,
                                    { postcode: feature.properties.postcodes }
                                )
                            );

                            var label = renderTemplate('dumb-meters-tooltip', {
                                postcode: feature.properties.postcode || feature.properties.postcodes,
                                tender_area: feature.properties.tender_area,
                                electricity_meters: n(feature.properties.electricity_all_meters),
                                economy7_percent: Math.round(
                                    n(feature.properties.electricity_economy7_meters) / n(feature.properties.electricity_all_meters) * 100
                                ),
                                electricity_consumption: Math.round(
                                    n(feature.properties.electricity_all_consumption_kwh)
                                ).toLocaleString(),
                                electricity_mean_consumption: Math.round(
                                    n(feature.properties.electricity_all_consumption_kwh) / n(feature.properties.electricity_all_meters)
                                ).toLocaleString(),
                                gas_meters: n(feature.properties.gas_meters),
                                gas_consumption: Math.round(
                                    n(feature.properties.gas_consumption_kwh)
                                ).toLocaleString(),
                                gas_mean_consumption: Math.round(
                                    n(feature.properties.gas_consumption_kwh) / n(feature.properties.gas_meters)
                                ).toLocaleString()
                            });

                            layer.bindTooltip(label, {
                                className: "pe-none" // prevent flicker when mousing over tooltip
                            });

                            layer.on({
                                click: function(e){
                                    _this.inspector = {
                                        label: feature.properties.postcode || feature.properties.postcodes,
                                        records: [ feature.properties ]
                                    };
                                },
                                mouseover: function(e){
                                    e.target.setStyle({
                                        weight: 2,
                                        fillOpacity: 0.4
                                    });
                                },
                                mouseout: function(e){
                                    e.target.setStyle({
                                        weight: 1,
                                        fillOpacity: 0.2
                                    });
                                }
                            });
                        }
                    }
                );

                var dataLayer = _this.getDataLayer('dumb-meters');
                dataLayer.layer = layer;

                // Create min/max stats and save them to the layer,
                // so they're available to shaders later on
                dataLayer.stats = {};
                _.each([
                    'electricity_all_meters',
                    'electricity_all_consumption_kwh',
                    'electricity_economy7_meters',
                    'gas_meters',
                    'gas_consumption_kwh'
                ], function(field){
                    var values = _.pluck(meters, field);
                    dataLayer.stats[field] = {
                        min: _.min(values),
                        max: _.max(values)
                    };
                });
            });
        },

        getDataLayer(id){
            var _this = this;
            return _.findWhere(_this.dataLayers, {id: id});
        },

        hideDataLayer(id){
            var _this = this;
            _this.getDataLayer(id).layer.removeFrom(_this.visibleLayers);
        },

        showDataLayer(id){
            var _this = this;
            _this.getDataLayer(id).layer.addTo(_this.visibleLayers);
        },

        dataLayerIsVisible(id){
            // console.log('dataLayerIsVisible', id);
            var _this = this;
            var dataLayer = _this.getDataLayer(id);

            if ( _.isNull(_this.visibleLayers) ) {
                // console.log('_this.visibleLayers is Null');
                return false;
            } else if ( typeof dataLayer === 'undefined' ) {
                // console.log('dataLayer', id, 'does not exist (yet?)');
                return false;
            } else if ( _.isNull(dataLayer.layer) ) {
                // console.log('dataLayer', id, 'does not have a Leaflet layer (yet?)');
                return false;
            } else {
                // console.log('_this.visibleLayers is not Null');
                return _this.visibleLayers.hasLayer( _this.getDataLayer(id).layer );
            }
        },

        dataLayerIsLoaded(id){
            var _this = this;
            return ! _.isNull(_this.getDataLayer(id).layer);
        },

        toggleDataLayer(id){
            var _this = this;
            if ( _this.dataLayerIsVisible(id) ) {
                _this.hideDataLayer(id);
            } else {
                _this.showDataLayer(id);
            }
        },

        onDataLayerShaderSelect($event, dataLayerId) {
            var _this = this;
            var dataLayer = _this.getDataLayer(dataLayerId);
            var shader = _.findWhere(
                toRaw(dataLayer).shaders,
                { id: $event.target.value }
            );

            dataLayer.layer.eachLayer(function(layer){
                layer.setStyle(
                    shader.getStyle(layer.feature, dataLayer)
                );
            });
        },

        clearInspector() {
            var _this = this;
            _this.inspector = {
                label: null,
                records: []
            };
        }
    }
}).mount('#app');
