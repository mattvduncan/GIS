require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/views/MapView",
  "esri/layers/CSVLayer",
  "esri/layers/WebTileLayer",
  "esri/renderers/SimpleRenderer",
  "esri/symbols/PictureMarkerSymbol",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/widgets/Legend",
  "esri/Basemap",
  "esri/widgets/BasemapToggle",
  "esri/widgets/ScaleBar",
  "esri/widgets/Home",
  "esri/widgets/Search",
  "esri/layers/GraphicsLayer",
  "esri/rest/support/Query",
  "esri/views/layers/FeatureLayerView"//classes
], (Map, SceneView, MapView, CSVLayer, WebTileLayer, SimpleRenderer, PictureMarkerSymbol, SimpleMarkerSymbol, Legend, Basemap, BasemapToggle, ScaleBar, Home, Search, GraphicsLayer, Query,FeatureLayerView) => { //anonymous callback function
  
 // url for CSV endpoint 
  const url = "https://data.cityofchicago.org/resource/bbyy-e7gq.csv";
  
  let bikeSymbol = {  //I want to use one of ESRI's pngs for bikes here
  type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
    url: "https://cdn.arcgis.com/sharing/rest/content/items/b117b6e14d7b429a9ea8c58a5cb6abad/resources/styles/thumbnails/Bicycle%20Unit.png",
  width: "60px",
  height: "60px"
};
  
  //Map module defines the map class
  const myMap = new Map({
    //class constructor
    basemap: "topo-vector"
  });
  
  const baseLayer = new WebTileLayer({  //OpenStreetMap WebTileLayer
  urlTemplate: 'https://{subDomain}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  subDomains: ["a","b","c"]
});
  
  const OSMBase = new Basemap({  //use my OSM tile layer for a basemap option
  baseLayers: [baseLayer],
  title: "OSM",
  id: "basemap",
  thumbnailUrl: 
"http://www.arcgis.com/sharing/rest/content/items/d9118dcf7f3c4789aa66834b6114ec70/info/thumbnail/terrain.png"
});
  
  // configure my Point Clustering behavior here
  const clusterConfig = {
    type: "cluster",
    clusterMinSize: 12,
    clusterMaxSize: "60px",
    symbol: {  //cluster symbol will have its own unique display
            type: "simple-marker",
            style: "circle",
            color: "#69dcff",
            outline: {
              color: "rgba(0, 139, 174, 0.5)",
              width: 6
            }
          },
     // defines the label within each cluster
    labelingInfo: [
            {
              deconflictionStrategy: "none",
              labelExpressionInfo: {
                expression: "Text($feature.cluster_count, '#,###')"
              },
              symbol: {
                type: "text",
                color: "white",
                haloSize: 1,
                haloColor: "black",
                font: {
                  weight: "bold",
                  family: "Noto Sans",
                  size: "12px"
                }
              },
              labelPlacement: "center-center"
            }
          ],
          // information to display when the user clicks a cluster
          popupTemplate: {
            title: "Cluster Summary",
            content: "This cluster represents <b>{cluster_count}</b> stations. <br /><br />",
            fieldInfos: [{
              fieldName: "cluster_count",
              format: {
                places: 0,
                digitSeparator: true
              }
            },
              {
              fieldName: "{Docks in Service}",
              label: "Average wind direction (degrees)",
              format: {
                places: 0
              }
            }]
          }
        };
  
  // popup for individual bike points
  const template = {
    title: "Station: <br />{Station Name}",
    // href takes Lat and Lon from CSV and crafts URL to load Street View
    content:
      "<b>Status: </b> {Status} <br /> <b>Total Docks: </b> {Total Docks} <br /> <b>Docks in Service: </b> {Docks in Service} <br /><a href=\"https://www.google.com/maps/@?api=1&map_action=pano&viewpoint={Latitude}%2C{Longitude}&heading=25&pitch=5&fov=90\" target=\" _blank\">Go to Street View</a>",
    fieldInfos: [
      {
        fieldName: "Status"
      },
      {
        fieldName: "Total Docks"
      },
      {
        fieldName: "Docks in Service"
      },
      {
        fieldName: "Latitude"
      },
      {
        fieldName: "Longitude"
      }
    ]
  };
  
   const bikeRenderer = new SimpleRenderer({
    symbol: bikeSymbol   // uses a PictureMarkerSymbol  
  });
  
  // Finally create my CSVLayer containing Bike Station locations
  const csvLayer = new CSVLayer({
          url: url,
          copyright: "Divvy LLC",
          latitudeField: "Latitude",
          longitudeField: "Longitude",
          featureReduction: clusterConfig,
          popupTemplate: template,
          renderer: {
            type: "simple",
            symbol: bikeSymbol
          }
        });
 
  
  //this is what shows on the page
  const view = new MapView({
    //properties below
    container: "viewDiv",
    map: myMap,
    zoom: 11,
    center: [-87.6298, 41.8781] // longitude, latitude
  });
  
  myMap.add(csvLayer);
  const stationField = "Station Name";
  
  const resultsLayer = new GraphicsLayer();
  

  // set up the search widget. Note the BUG dealing with auto-suggestions. 
// suggestions return the first field by default, and then 'Untitled' when using displayField
  const searchWidget = new Search({
    view: view,
    sources: [
      {
        layer: csvLayer,
        searchFields: ["Station Name"],
        displayField: "station_name",  //BUG 
        exactMatch: false,
        outFields: ["Station Name"],
        placeholder: "Ex. 'Austin' for Austin Blvd & Lake St...",
        suggestionsEnabled: true,
        zoomScale: 10000
      }
    ],
    includeDefaultSources: false
  });
  
  const legend = new Legend({
    view: view,
    layerInfos: [
      {
        layer: csvLayer,
        title: "Stations"
      }
    ]
  });
  
  
  const sBar = new ScaleBar({ //let's have a scalebar!
    view: view,
    style: "line",
    unit: "non-metric"
  });
  const toggle = new BasemapToggle({ //widget to toggle two basemaps
 view: view, 
 nextBasemap: OSMBase 
});
  
  view.ui.add(toggle, "top-left");
  view.ui.add(legend, "bottom-left");
  view.ui.add(sBar, {
    position: "bottom-right"
  });
  view.ui.add(searchWidget, {
  position: "top-left",
  index: 1
});
  
  view.ui.add(
          new Home({
            view: view
          }),
          "top-left"
        );

});
