/// <reference types='@runette/leaflet-fullscreen' />
import { Component, OnInit, AfterViewInit, TemplateRef, ViewChild } from '@angular/core';
import { RestServicesService } from 'src/app/services/rest-services.service';
import * as L from 'leaflet';
import { EdgeAnomalyServices } from 'src/app/services/edge-anomaly-services.service';
import { NodeAnomalyServices } from 'src/app/services/node-anomaly-services.service';
import { RenderingServicesService } from 'src/app/services/rendering-services.services';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { NetworkVis } from './network_vis';
declare const $: any;
declare const d3: any;
declare const NodePieBuilder: any;
var edgelabels: any, pairing_nodes:any = {}, index_holder:any;
//@ts-ignore
var contxt:any;
var tooltip_div:any;
var network_viz:any;


@Component({
  selector: 'app-arena',
  templateUrl: './arena.component.html',
  styleUrls: ['./arena.component.scss']
})
export class ArenaComponent implements OnInit {
  datasets = [];
  selected_dataset = '';
  fsControl = false
  private svg:any
  private g_outer:any;
  private g:any;
  private g_stats1:any;
  private g_structure1:any;
  private g_ffade:any;

  private g_stats1_node:any;
  private g_stats2_node:any;
  private g_outlier_node:any;
  private nodes:any;
  private nodes_stats1:any;
  private nodes_stats2:any;
  private nodes_outlier:any;
  private links:any;
  private links_stat1:any;
  private links_structure1:any;
  private path:any;
  mapCanvas:any;
  links_json: any = [];
  selected_elements = []
  selected_interval:any = {}
  selected_edge_interval:any = {}
  selected_node_interval:any = {}
  elements:any = []
  
  /** Non Location based variables */
  height:any = null
  width:any = null
  selectorNetwork = '#network-vis';
  margin = { top: 0, right: 10, bottom: 10, left: 10 };


  intervals = [{interval: "3 Month", value: "3M"},{interval: "1 Month", value: "1M"},{interval: "15 Days", value: "15D"},{interval: "1 Week", value: "1W"},{interval: "1 Day", value: "1D"},{interval: "1 Hour", value: "1H"}]
  config = {
    displayKey:"label", //if objects array passed which key to be displayed defaults to description
    search:true, //true/false for the search functionlity defaults to false,
    height: 'auto', //height of the list so that if there are more no of items it can show a scroll defaults to auto. With auto height scroll will never appear
    placeholder:'Select element(s)', // text to be displayed when no item is selected defaults to Select,
    noResultsFound: 'No results found!', // text to be displayed when no items are found while searching
    searchPlaceholder:'Search Element', // label thats displayed in search input,
    searchOnKey: 'label' // key on which search should be performed this will be selective search. if undefined this will be extensive search on all keys
    }
  config_timeline = {
        displayKey:"interval", //if objects array passed which key to be displayed defaults to description
        search:false, //true/false for the search functionlity defaults to false,
        height: 'auto', //height of the list so that if there are more no of items it can show a scroll defaults to auto. With auto height scroll will never appear
        }
  options = {
	layers: [
		L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
	],
	zoom: 5,
	center: L.latLng(46.879966, -121.726909)
  };
  fullscreenOptions: {[key:string]:any} = {
    position: 'topleft',
    title: 'View Fullscreen',
    titleCancel: 'Exit Fullscreen',
  };
  layersControl = {
	baseLayers: {
        'Carto': L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),  
        'Statman': L.tileLayer("http://{s}.sm.mapstack.stamen.com/(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '...' })
	},
	overlays: {}
  }
  //Edge Stats1
  stat1_duration = 'avg_duration'
  stat1_weight = "avg_weight"
  structure1 = "path_breakage"

  //Node Stats1
  stat1_radius = "avg_duration"
  stat1_node_duration = 'income_vs_outgoing'

  avg_edges:any = []
  avg_nodes:any = []
  structure_edges: any = []
  top_5_labels:any = []


  main_layer_enabled = true;
  
  stat1_layer = false
  structure1_layer = false
  ffade_layer = false
  stat1_node_layer = false
  stat2_node_layer = false
  outlier_node_layer = false

  stat1_width_slider = [0.5, 3]
  stat1_radius_slider = [4, 10]


  stat1_colorMap_low = "#00aeff"
  stat1_colorMap_high = "#f50000"
  stat1_in_color = "#00aeff"
  stat1_out_color = "#f50000"

  stat1_r1_color = "#00b029"
  stat1_r2_color = "#93b000"
  stat1_r3_color = "#b09300"
  stat1_r4_color = "#b05500"
  stat1_r5_color = "#b01d00"

  structure1_loop_color = "#10756b"
  structure1_breakage_color = "#d42a17"

  stat1_width_scale:any
  stat1_colorMap_scale:any 
  stat1_radius_scale:any


  outlier_weight_sentiment: any = "total_edges"
  outlier_weight_sentiments = [{label: 'Total Edges', key: 'total_edges'},
                               {label: 'Total Weights', key: 'total_weights'},
                               {label: 'Outgoing Edges', key: 'outgoing'},
                               {label: 'Incoming Edges', key: 'incoming'},
                               {label: 'Outgoing Weight Edges', key: 'outgoing_weights'},
                               {label: 'Incoming Weight Edges', key: 'incoming_weights'},
                               {label: 'Average Idle Time', key: 'avg_duration'},
                               {label: 'Total Idle Time', key: 'total_duration'}] 
  outlier_weight_sentiments_noduration = [{label: 'Total Edges', key: 'total_edges'},
                                {label: 'Total Weights', key: 'total_weights'},
                                {label: 'Outgoing Edges', key: 'outgoing'},
                                {label: 'Incoming Edges', key: 'incoming'},
                                {label: 'Outgoing Weight Edges', key: 'outgoing_weights'},
                                {label: 'Incoming Weight Edges', key: 'incoming_weights'}] 

  outlier_top_n: any = 5
  outlier_top_n_options = [{key: 5},{key: 10},{key: 15},{key: 20},{key: 25},{key: 30}] 
  selected_sota:any = 'dnoda'

  locationbased = true
  durationbased = false
  selected_layout = 'no_layout'
  positioned_nodes = []

  nonlocation_graph_holder:any
  location_graph_holder:any


  selected_layer_edge:any = "normal"
  selected_layer_node:any = "normal"

  
  scales = [{"label": "Linear", 
            "function" : (min:any,  max:any, range_min:any, range_max:any) =>  d3.scaleLinear().domain([min, max]).range([range_min, range_max])},  
            {"label": "Logarithmic", 
            "function" : (min:any,  max:any, range_min:any, range_max:any) =>  d3.scaleLog().domain([min, max]).range([range_min, range_max])},
            {"label": "Square Root", 
            "function" : (min:any,  max:any, range_min:any, range_max:any) =>  d3.scaleSqrt().domain([min, max]).range([range_min, range_max])}    
           ]
  scales_ls = [{"label": "Linear", 
                "function" : (min:any,  max:any, range_min:any, range_max:any) =>  d3.scaleLinear().domain([min, max]).range([range_min, range_max])},  
                {"label": "Square Root", 
                "function" : (min:any,  max:any, range_min:any, range_max:any) =>  d3.scaleSqrt().domain([min, max]).range([range_min, range_max])}    
                ]

  //@ts-ignore
  @ViewChild('edge_details', { static: false }) private edge_details;
  //@ts-ignore
  @ViewChild('node_details', { static: false }) private node_details;
    //@ts-ignore
    @ViewChild('ffade', { static: false }) private ffade;
    //@ts-ignore
    @ViewChild('dnoda', { static: false }) private dnoda;



  

  //DEMO
  thesis = true;


  ffade_api_training = false
  ffade_args = {
    embedding_size: 200,
    batch_size: 32,
    t_setup: 8000,
    W_upd: 720,
    alpha: 0.999,
    T_th: 120,
    epochs: 5,
    online_train_steps: 10,
    M: 1
  }  

  ffade_subscription:any

  ffade_holder:any
  outlier_holder:any


  top_5_node_anomalies:any = []
  top_5_edge_anomalies:any = []


  constructor(private restService: RestServicesService, 
            private renderingServices: RenderingServicesService,
            private edgeAnomalyServices: EdgeAnomalyServices,
            private nodeAnomalyServices: NodeAnomalyServices,
            private modalService: NgbModal) { 
    contxt = this;
  }

  ngOnInit(): void {
        this.stat1_colorMap_scale = this.scales[0]['function'];
        this.stat1_width_scale = this.scales[0]['function']
        this.stat1_radius_scale = this.scales[0]['function']

        this.outlier_weight_sentiment = this.outlier_weight_sentiments[0]['key']
        this.outlier_top_n = this.outlier_top_n_options[0]['key']

        this.selected_interval = this.intervals[1];
        this.selected_edge_interval = this.intervals[4];
        this.selected_node_interval = this.intervals[4];

        //@ts-ignore
        document.getElementById("defaultOpen").click();
        $("#stat1-start-color").smallColorPicker({
            placement: { popup: true },
            colors: { colorOld: this.stat1_colorMap_low, colorNew: this.stat1_colorMap_low }
        }).on({
            scp_ok: (color:any, picker:any) => { 
                this.stat1_colorMap_low =  picker
                this.stat1_selected();
             },
        });
        $("#stat1-end-color").smallColorPicker({
            placement: { popup: true },
            colors: { colorOld: this.stat1_colorMap_high, colorNew: this.stat1_colorMap_high }
        }).on({
            scp_ok: (color:any, picker:any) => { 
                this.stat1_colorMap_high =  picker
                this.stat1_selected();
             },
        });
        $("#stat1_in_color").smallColorPicker({
            placement: { popup: true },
            colors: { colorOld: this.stat1_in_color, colorNew: this.stat1_in_color }
        }).on({
            scp_ok: (color:any, picker:any) => { 
                this.stat1_in_color =  picker
                this.stat1_node_selected();
             },
        });
        $("#stat1_out_color").smallColorPicker({
            placement: { popup: true },
            colors: { colorOld: this.stat1_out_color, colorNew: this.stat1_out_color }
        }).on({
            scp_ok: (color:any, picker:any) => { 
                this.stat1_out_color =  picker
                this.stat1_node_selected();
             },
        });


        // Colour Picker Inititalization for Node Stat1 Top 5 Labels Carrying weights
        $("#stat1_r1_color").smallColorPicker({
            placement: { popup: true },
            colors: { colorOld: this.stat1_r1_color, colorNew: this.stat1_r1_color }
        }).on({
            scp_ok: (color:any, picker:any) => { 
                this.stat1_r1_color =  picker
                this.stat1_top5_node_selected();
             },
        });
        $("#stat1_r2_color").smallColorPicker({
            placement: { popup: true },
            colors: { colorOld: this.stat1_r2_color, colorNew: this.stat1_r2_color }
        }).on({
            scp_ok: (color:any, picker:any) => { 
                this.stat1_r2_color =  picker
                this.stat1_top5_node_selected();
             },
        });
        $("#stat1_r3_color").smallColorPicker({
            placement: { popup: true },
            colors: { colorOld: this.stat1_r3_color, colorNew: this.stat1_r3_color }
        }).on({
            scp_ok: (color:any, picker:any) => { 
                this.stat1_r3_color =  picker
                this.stat1_top5_node_selected();
             },
        });
        $("#stat1_r4_color").smallColorPicker({
            placement: { popup: true },
            colors: { colorOld: this.stat1_r4_color, colorNew: this.stat1_r4_color }
        }).on({
            scp_ok: (color:any, picker:any) => { 
                this.stat1_r4_color =  picker
                this.stat1_top5_node_selected();
             },
        });
        $("#stat1_r5_color").smallColorPicker({
            placement: { popup: true },
            colors: { colorOld: this.stat1_r5_color, colorNew: this.stat1_r5_color }
        }).on({
            scp_ok: (color:any, picker:any) => { 
                this.stat1_r5_color =  picker
                this.stat1_top5_node_selected();
             },
        });


        // Structure1 Color Initialization
        $("#structure1_loop_color").smallColorPicker({
            placement: { popup: true },
            colors: { colorOld: this.structure1_loop_color, colorNew: this.structure1_loop_color }
        }).on({
            scp_ok: (color:any, picker:any) => { 
                this.structure1_loop_color =  picker
                this.structure1_selected();
             },
        });
        $("#structure1_breakage_color").smallColorPicker({
            placement: { popup: true },
            colors: { colorOld: this.structure1_breakage_color, colorNew: this.structure1_breakage_color }
        }).on({
            scp_ok: (color:any, picker:any) => { 
                this.structure1_breakage_color =  picker
                this.structure1_selected();
             },
        });


        // Tooltip Initialize
        tooltip_div = d3.select("body").append("div")	
                    .attr("class", "tooltip")				
                    .style("opacity", 0);


        // Range slider for edge width stat1
        var sliderRange = d3
        .sliderBottom()
        .min(0.5)
        .max(8)
        .width($('.stat1_slider_div').width() - 50)
        .tickFormat(d3.format('.2'))
        .ticks(5)
        .default(this.stat1_width_slider)
        .fill('#2196f3')
        .on('end', (val:any) => {
            this.stat1_width_slider = val;
            this.stat1_selected()
        });

        var gRange = d3
        .select('div#slider-range')
        .append('svg')
        .attr('width', $('.stat1_slider_div').width())
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(12,8)');

        gRange.call(sliderRange);

        // Range slider for node radius stat1
        sliderRange = d3
        .sliderBottom()
        .min(0.5)
        .max(10)
        .width($('.stat1_slider_div').width() - 50)
        .tickFormat(d3.format('.2'))
        .ticks(4)
        .default(this.stat1_radius_slider)
        .fill('#2196f3')
        .on('end', (val:any) => {
            this.stat1_radius_slider = val;
            this.stat1_node_selected()
        });

        gRange = d3
        .select('div#slider-range-radius')
        .append('svg')
        .attr('width', $('.stat1_slider_div').width())
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(12,8)');

        gRange.call(sliderRange);

        this.ffade_slider_init()

       
  }
  getDataset(interval:any){
    this.selected_layout = 'no_layout'
    $('.layout_option_div').hide();
    if(this.selected_dataset && interval){

            this.restService.fetchDataset(this.selected_dataset, interval).subscribe(
            (response:any) => {
                console.log("Dataset:", response)
                if(this.selected_dataset == 'bitcoin-trust-network'){
                    this.intervals = [{interval: "3 Month", value: "3M"},{interval: "1 Month", value: "1M"},{interval: "15 Days", value: "15D"},{interval: "1 Week", value: "1W"}]
                }else{
                    this.intervals = [{interval: "3 Month", value: "3M"},{interval: "1 Month", value: "1M"},{interval: "15 Days", value: "15D"},{interval: "1 Week", value: "1W"},{interval: "1 Day", value: "1D"},{interval: "1 Hour", value: "1H"}]
                }

                this.locationbased = response.metadata.geograph;
                this.durationbased = response.metadata.duration_traversal
                
                if(!response.metadata.geograph){
                        // No Location based
                        setTimeout(() => {
                          this.nonlocation_graph_holder = response;
                          this.showNonLocation();
                          this.renderingServices.renderTimeline(response.analytics);
                          this.showOptions(response.nodes, response.edges);
                          this.renderingServices.renderKPIs(response);
                          $('.layout_option_div').show();

                        

                        })
                }else{
                        // Location based
                        this.location_graph_holder = response;
                        if(this.selected_dataset == 'train_system'){
                            this.mapCanvas.setView(new L.LatLng(22.421461, 79.8153306), 5, { animation: true }); 
                        }
                        //console.log("Selected Data's data: ", response)
                        this.displayStateMachine(response.nodes, response.edges);
                        this.renderingServices.renderKPIs(response);
                        this.renderingServices.renderTimeline(response.analytics);
                        this.showOptions(response.nodes, response.edges);
        
                        // Stat1 Edge Analytics
                        this.avg_edges =  this.edgeAnomalyServices.avg_edge(response.edges);
                        //console.log("Edge Average", this.avg_edges)
                        this.displayStateMachine_stats1(this.avg_edges, {avg_duration: this.stat1_duration == 'avg_duration', avg_weight: this.stat1_weight == 'avg_weight', total_duration: this.stat1_duration == 'total_duration', total_weight: this.stat1_weight == 'total_weight'})
        
                        // Structure1 Edge Mismatch Loops & Breakage
                        this.structure_edges =  this.edgeAnomalyServices.mismatch_breakage_loop_edge(response.edges);
                        //console.log("Edge Structured", this.structure_edges, EdgeAnomalyServices.loop_edges)
                        this.displayStateMachine_structure1(this.structure_edges, {path_loop: this.structure1 == 'path_loop', path_breakage: this.structure1 == 'path_breakage'})
                        
                        // Stat1 Node Analytics
                        this.avg_nodes =  this.nodeAnomalyServices.avg_node(response.edges);
                        //console.log("Node Average", this.avg_nodes)
                        this.displayStateMachine_stat1_node(this.avg_nodes, {avg_duration: this.stat1_radius == 'avg_duration', total_duration: this.stat1_radius == 'total_duration' })
        
        
                        // Stat1 Node Top 5 Weights
                        this.top_5_labels =  this.nodeAnomalyServices.top_5_node(response.edges);
                        //console.log("Node Top 5", this.top_5_labels)
                        this.displayStateMachine_stat2_node(this.top_5_labels)
                }

                
                
            }
        );
  }
  }
  showNonLocation(){


        const elm = $(this.selectorNetwork);
        this.width = parseInt(elm.width())
        this.height = parseInt(elm.height()) * 1;
      
        let selector = d3
          .select(this.selectorNetwork)
          .append('div')
          .classed('svg-container', true)
          
        this.svg = selector.append('svg')
          .attr('preserveAspectRatio', 'xMinYMin meet')
          .attr('viewBox', '0 0 ' + this.width + ' ' + this.height + '')
          .classed('svg-content-responsive', true);
      
        /* depends on svg ratio, for 1240/1900 = 0.65 so padding-bottom = 65% */
        const percentage = Math.ceil((this.height / this.width) * 100);
        $(this.selectorNetwork).append(
          $(
            '<style>' +
            this.selectorNetwork +
              '::after {padding-top: ' +
              percentage +
              '%;display: block;content: "";}</style> '
          )
        );
      
       
        this.renderNetworkVis();
       
  }
  renderNetworkVis(){
    //
    // Stat1 Node Analytics
    this.avg_nodes =  this.nodeAnomalyServices.avg_node_category(this.nonlocation_graph_holder.edges);
    //console.log("Node Average", this.avg_nodes)
    //this.displayStateMachine_stat1_node(this.avg_nodes, {avg_duration: this.stat1_radius == 'avg_duration', total_duration: this.stat1_radius == 'total_duration' })


    // Stat1 Node Top 5 Weights
    this.top_5_labels =  this.nodeAnomalyServices.top_5_node(this.nonlocation_graph_holder.edges);
    //console.log("Node Top 5", this.top_5_labels)
    //this.displayStateMachine_stat2_node(this.top_5_labels)


    // Stat1 Edge Analytics
    this.avg_edges =  this.edgeAnomalyServices.avg_edge_category(this.nonlocation_graph_holder.edges);
    //console.log("Edge Average", this.avg_edges)
    //this.displayStateMachine_stats1(this.avg_edges, {avg_duration: this.stat1_duration == 'avg_duration', avg_weight: this.stat1_weight == 'avg_weight', total_duration: this.stat1_duration == 'total_duration', total_weight: this.stat1_weight == 'total_weight'})


     // Structure1 Edge Mismatch Loops & Breakage
     this.structure_edges =  this.edgeAnomalyServices.mismatch_breakage_loop_edge(this.nonlocation_graph_holder.edges);
     //console.log("Edge Structured", this.structure_edges, EdgeAnomalyServices.loop_edges)
     //this.displayStateMachine_structure1(this.structure_edges, {path_loop: this.structure1 == 'path_loop', path_breakage: this.structure1 == 'path_breakage'})
    
    /*$('#layout-option').on('change', function() {
      updateDataset();
    });
  
    $('#bundling-option').on('change', function() {
      updateDataset();
    });
  
    $('#dataset-option').on('change', function() {
      const newIDX = +$('#dataset-option')
        .find('option:selected')
        .attr('data');
  
      loadDataset(newIDX).then(function() {
        updateDataset();
      });
    });
  
    // init bootstrap tooltips
    $(function() {
      $('[data-toggle="tooltip"]').tooltip();
    });*/
    $('.layout_option_div').show();
    setTimeout(() => {
        this.forced_directed_graphlayer()
    })
  }
  layoutChanged(layout:string){
    if(this.selected_dataset && layout != "no_layout"){
                
        this.restService.fetchLayout(this.selected_dataset, layout).subscribe(
        (response:any) => {

           // console.log("Fetch Layout Response:", response)
            this.nonlocation_graph_holder.nodes = response.nodes

            this.renderNetworkVis()
            
        }
    );
   }else{
       // Force Layout
       this.showNonLocation();
   }
  }
  onMapReady(map: L.Map):void {
    
     this.mapCanvas = map;
     this.mapCanvas.L_PREFER_CANVAS = true;
     //@ts-ignore
     L.svg().addTo(this.mapCanvas);
     this.layersControl.baseLayers.Carto.addTo(this.mapCanvas);
      // We pick up the SVG from the map object
     this.svg = d3.select("#map").select("svg"),
     
     //@ts-ignore
     this.g_outer = this.svg.append("g").attr("class", "leaflet-zoom-hide").attr('style', 'pointer-events: all');
     //@ts-ignore
     this.g = this.g_outer.append("g").attr("id", "mainlayer").attr('style', 'pointer-events: all;')
     this.g_stats1 = this.g_outer.append("g").attr("id", "stats1layer").attr('style', 'pointer-events: all; display: none;')
     this.g_structure1 = this.g_outer.append("g").attr("id", "structure1layer").attr('style', 'pointer-events: all; display: none;')
     this.g_ffade = this.g_outer.append("g").attr("id", "ffadelayer").attr("style", "pointer-events: all; display:none;")
        
     this.g_stats1_node = this.g_outer.append("g").attr("id", "stats1nodelayer").attr('style', 'pointer-events: all; display: none;')
     this.g_stats2_node = this.g_outer.append("g").attr("id", "stats2nodelayer").attr('style', 'pointer-events: all; display: none;')
     this.g_outlier_node = this.g_outer.append("g").attr("id", "outliernodelayer").attr('style', 'pointer-events: all; display: none;')

     this.fsControl = true;

     this.restService.getDatabases().subscribe(
        (response:any) => {
            this.datasets = response;
            this.selected_dataset = this.datasets[0];
            this.getDataset('1M');

        }
    );
   }
  drag(simulation: any){
        
    function dragstarted(d: any) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(d: any) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }
      
      function dragended(d: any) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
  }
  ngAfterViewInit(): void {
    //Drag func. for the force simulation graph.
      
  }
  checkForMismatchInFiles(nodes_main:any, edges_main:any){
    let error_flag = 0;
    let missing_nodes:any = [];
    //debugger;
    let nodes_temp_json = JSON.parse(JSON.stringify(nodes_main.map((e:any) => e['node'])))
    edges_main.forEach((e:any) => {
        if(!(nodes_temp_json.includes(e.from) && nodes_temp_json.includes(e.to))){
            missing_nodes.push(nodes_temp_json.includes(e.from) ? e.to : e.from)
            missing_nodes.push(nodes_temp_json.includes(e.to) ? e.from : e.to)
            error_flag = 1;
        }
    })
    if(error_flag){
        missing_nodes = [...new Set(missing_nodes)];
        //alert("Mismatching node and edges files. Missing nodes found in the edges file: " + missing_nodes.join());
        edges_main = [];
        //this.displayStateMachine(nodes_main, edges_main);
    }

}

  displayStateMachine(nodes_main: any, edges_main: any) {

    //Check for mismatch between nodes and edges files.
    this.checkForMismatchInFiles(nodes_main, edges_main);
    // Normal Flow
    const links = [];
    const nodes = [];
    //Create paths for each of the edges in the file.
    for (let i = 0; i < edges_main.length; i++) {
        let pos_arr_from = edges_main[i]['from_location'] ? edges_main[i]['from_location'] : edges_main[i].from.split('y');
        let pos_arr_to = edges_main[i]['to_location'] ? edges_main[i]['to_location'] : edges_main[i].to.split('y');
        
        const link = {
            source: edges_main[i].from,
            target: edges_main[i].to,
            weight: edges_main[i].weight,
            label: edges_main[i].label,
            timestamp_start: edges_main[i].timestamp_start,
            timestamp_end: edges_main[i].timestamp_end,
            LatLng_from: new L.LatLng(+pos_arr_from[0],
                +pos_arr_from[1]),
            LatLng_to: new L.LatLng(+pos_arr_to[0],
                    +pos_arr_to[1]),

        };
        //Finally push the node into the object.
        links.push(link);
    }

    //Create nodes for each of the nodes in the file.
    for (let i = 0; i < nodes_main.length; i++) {
        let pos_arr = nodes_main[i]['node_location'] ? nodes_main[i]['node_location'] : nodes_main[i].node.split('y');
        
        let node_temp = {
            node_name: nodes_main[i].node,
            //x: this.mapCanvas.latLngToLayerPoint(new L.LatLng(+pos_arr[1], +pos_arr[0])).x,
            //y: this.mapCanvas.latLngToLayerPoint([pos_arr[0], pos_arr[1]]).y,
            lat: +pos_arr[0],
            lng: +pos_arr[1],
            LatLng: new L.LatLng(+pos_arr[0],
                +pos_arr[1])
          };
          nodes.push(node_temp);
        }

    const nodeclicked = (d:any) => {
        //console.log("Node Clicked", d)
        this.modalService.open(this.node_details, { size: 'xl' });
            setTimeout(() => {
                this.renderingServices.show_node_details(d, '1D');
            })
 
    }
    
    const edgeclicked = (d:any) => {
        
        let already_exist = 0;
        let already_exist_index = 0;
        //@ts-ignore
        contxt.selected_elements.forEach((element,i) => {
            if(element['label'] == d['label']){
                already_exist = 1;
                already_exist_index = i;
            }
        });
        if(already_exist){
            //@ts-ignore
            contxt.selected_elements.splice(already_exist_index, 1);
        }else{
            //@ts-ignore
            this.selected_elements.push({label: d['label']});
            this.modalService.open(this.edge_details, { size: 'xl' });
            setTimeout(() => {
                this.renderingServices.show_edge_details(d, '1D');
            })
        }
        //@ts-ignore
        contxt.select_elements();
        
    }

    //Dimensions for the scatterplot.
    this.g.html('');       
    
    // this.svg
        this.g.append('defs')
        .append('marker')
        .attr('id', 'arrow_self')
        .attr('viewBox', [0, 0, 12, 12])
        .attr('markerUnits', 'strokeWidth')
        .attr('refX', 10)
        .attr('refY', 6)
        .attr('xoverflow', 'visible')
        .attr('markerWidth', 12)
        .attr('markerHeight', 12)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', "M2,2 L10,6 L2,10 L6,6 L2,2")
        .attr('fill', '#0d6efd');

        ////console.log("links", links)

        this.links_json = links;

        this.nodes = this.g.append("g").attr("class", "nodes").attr('style', 'pointer-events: all').selectAll("cicle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("stroke","black")
        .style('cursor','pointer')
        .style("fill", "#a3c5f7") 
        .attr('id', (d:any) =>  "node_"+d.node_name.replace(/ /g, '_').replace(/\./g, '_'))
        .attr("r", 10)
        .on('click', nodeclicked)
        .on("mouseover", function(d:any) {	
            tooltip_div.transition()		
                .duration(200)		
                .style("opacity", .9);		
            tooltip_div.html(d.node_name)	
                .style("left", (d3.event.pageX + 10) + "px")		
                .style("top", (d3.event.pageY - 35) + "px");	
            })					
        .on("mouseout", function(d:any) {		
            tooltip_div.transition()		
                .duration(500)		
                .style("opacity", 0);	
        })

            

        var transform = d3.geoTransform({point: projectPoint})
        this.path = d3.geoPath().projection(transform);

            function projectPoint(x:any, y:any) {
                //@ts-ignore
                var point = contxt.mapCanvas.latLngToLayerPoint(new L.LatLng(y, x));
                //@ts-ignore
                this.stream.point(point.x, point.y);
            }


        this.links = 
        this.g.append('g') //this.svg
            .attr('class', 'edges')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 1)
            .selectAll('path')
            .data(links)
            .join('path')
        // .attr('d', this.path)
            .attr('id', function (d:any, i:any) {
            let sourceNode = d.source.replaceAll('.','_');
            let targetNode = d.target.replaceAll('.','_');
            return 'link_' + sourceNode + "-" + targetNode
            })
            .attr('item_selector', (d:any) => d.label)
            .attr('timestamp', (d:any) => d.timestamp_start + "to" + d.timestamp_end)
            .attr('stroke-width', 1)
            .attr('marker-end', (d:any,i:any) => {
                    return 'url(#arrow_self)';
            })
            .style('fill', 'transparent')
            .style('stroke', '#4590ff')
            .style('pointer-events','visibleStroke')
            .style('cursor','pointer')
            .on('click', edgeclicked)
            .on("mouseover", function(d:any) {	
                let html_string = "<b>Entity: </b>" + d.label + "<br>" +
                                  "<b>From: </b>" + d.source + ", <b>at</b> " + moment(d.timestamp_start).format('DD/MM/YYYY hh:mm:ss A') + "<br>" +
                                  "<b>To: </b>" + d.target + ", <b>at</b> " + moment(d.timestamp_end).format('DD/MM/YYYY hh:mm:ss A') + "<br>" +
                                  "<b>Weight: </b>" + d.weight + "<br>";
                tooltip_div.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                tooltip_div.html(html_string)	
                    .style("left", (d3.event.pageX + 10) + "px")		
                    .style("top", (d3.event.pageY - 35) + "px");	
                })					
            .on("mouseout", function(d:any) {		
                tooltip_div.transition()		
                    .duration(500)		
                    .style("opacity", 0);	
            });

    
    
            this.mapCanvas.on("zoom", () => {
                this.updatePositions();
            });
            this.updatePositions();

        return this.g.node();
    }


    displayStateMachine_stats1(edges_main: any, options: any) {
        //Options: avg_weight, total_weight, avg_duration, total_duration
        // Normal Flow
        const links = [];
        //console.log("STAT1 Edges", edges_main)
        //Create paths for each of the edges in the file.
        for (let i = 0; i < edges_main.length; i++) {
            let pos_arr_from = edges_main[i].edges[0]['from_location'] ? edges_main[i].edges[0]['from_location'] : edges_main[i].edges[0].from.split('y');
            let pos_arr_to = edges_main[i].edges[0]['to_location'] ? edges_main[i].edges[0]['to_location'] : edges_main[i].edges[0].to.split('y');
            const link = {
                source: edges_main[i].edges[0].from,
                target: edges_main[i].edges[0].to,
                label: [...new Set(edges_main[i].edges.map((e:any) => e.label))].join(", "), // Combining all the entities passed from this route
            
                avg_duration: edges_main[i].avg_minutes,
                total_duration: edges_main[i].total_minutes,
                avg_weight: edges_main[i].avg_weights,
                total_weights: edges_main[i].total_weights,
                
                timestamp_start: edges_main[i].edges[0].timestamp_start,
                timestamp_end: edges_main[i].edges[0].timestamp_end,
                LatLng_from: new L.LatLng(+pos_arr_from[0],
                    +pos_arr_from[1]),
                LatLng_to: new L.LatLng(+pos_arr_to[0],
                        +pos_arr_to[1]),

            };
            //Finally push the node into the object.
            links.push(link);
        }


        const edgeclicked_stats1 = (d:any) => {
        
            this.modalService.open(this.edge_details, { size: 'xl' });
                setTimeout(() => {
                    this.renderingServices.show_edge_details(d, '1D');
                })
            
        }

        //Dimensions for the scatterplot.
        this.g_stats1.html('');
        
    
        ////console.log("links", links)



        let maxCount_weights = 0
        let minCount_weights = 0
        let maxCount_duration = 0
        let minCount_duration = 0

        
        maxCount_weights = d3.max(links, (d:any) => {
                if(options.avg_weight){
                    return d.avg_weight;
                }else if(options.total_weight){
                    return d.total_weights;
                }
        });

        minCount_weights = d3.min(links, (d:any) => {
            if(options.avg_weight){
                return d.avg_weight;
            }else if(options.total_weight){
                return d.total_weights;
            }
        });

        maxCount_duration = d3.max(links, (d:any) => {
            if(options.avg_duration){
                return d.avg_duration;
            }else if(options.total_duration){
                return d.total_duration;
            }
        });

        minCount_duration = d3.min(links, (d:any) => {
            if(options.avg_duration){
                return d.avg_duration;
            }else if(options.total_duration){
                return d.total_duration;
            }
        });   


        
        let myWidth:any
        if(typeof this.stat1_width_scale === 'string'){
            myWidth = eval(''+this.stat1_width_scale)
            myWidth = myWidth(minCount_weights, maxCount_weights, this.stat1_width_slider[0], this.stat1_width_slider[1])
        }else{
            myWidth = this.stat1_width_scale(minCount_weights, maxCount_weights, this.stat1_width_slider[0], this.stat1_width_slider[1])
        }

        let mycolor:any
        if(typeof this.stat1_colorMap_scale === 'string'){
            mycolor = eval(''+this.stat1_colorMap_scale)
            mycolor = mycolor(minCount_duration, maxCount_duration, this.stat1_colorMap_low, this.stat1_colorMap_high)
        }else{
            mycolor = this.stat1_colorMap_scale(minCount_duration, maxCount_duration, this.stat1_colorMap_low, this.stat1_colorMap_high)
        }
        

        this.links_stat1 = 
        this.g_stats1.append('g') //this.svg
            .attr('class', 'edges')
            .attr('stroke', '#4590ff')
            .attr('stroke-opacity', 1)
            .selectAll('path')
            .data(links)
            .join('path')
        // .attr('d', this.path)
            .attr('id', function (d:any, i:any) {
                let sourceNode = d.source.replaceAll('.','_');
                let targetNode = d.target.replaceAll('.','_');
                return 'link_' + sourceNode + "-" + targetNode
            })
            .attr('item_selector', (d:any) => d.label)
            .attr('timestamp', (d:any) => d.timestamp_start + "to" + d.timestamp_end)
            .attr('stroke-width', (d:any) => {
                if(options.avg_weight){
                    return myWidth(d.avg_weight)
                }
                return myWidth(d.total_weights)
            })
            .style('fill', 'transparent')
            .style('stroke', (d:any) => {
                if(options.avg_duration){
                    return mycolor(d.avg_duration)
                }
                return mycolor(d.total_duration)
            })
            .style('pointer-events','visibleStroke')
            .style('cursor','pointer')
            .on('click', edgeclicked_stats1)
            .on("mouseover", function(d:any) {	
                let html_string = "<b>Entity: </b>" + d.label + "<br>" +
                                  "<b>From: </b>" + d.source + ", <b>at</b> " + moment(d.timestamp_start).format('DD/MM/YYYY hh:mm:ss A') + "<br>" +
                                  "<b>To: </b>" + d.target + ", <b>at</b> " + moment(d.timestamp_end).format('DD/MM/YYYY hh:mm:ss A') + "<br><br>" +
                                  "<b>Average Duration: </b>" + d.avg_duration + " Minutes<br>" +
                                  "<b>Total Duration: </b>" + d.total_duration + " Minutes<br>" +
                                  "<b>Average Weights: </b>" + d.avg_weight + "<br>" +
                                  "<b>Total Weights: </b>" + d.total_weights + "<br>";
                tooltip_div.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                tooltip_div.html(html_string)	
                    .style("left", (d3.event.pageX + 10) + "px")		
                    .style("top", (d3.event.pageY - 35) + "px");	
                })					
            .on("mouseout", function(d:any) {		
                tooltip_div.transition()		
                    .duration(500)		
                    .style("opacity", 0);	
            })
            
            
            this.updatePositions();

        return this.g_stats1.node();
    }


    displayStateMachine_structure1(edges_main: any, options: any) {
        //Options: path_loop, path_breakage
        //console.log(edges_main, options)
        // herehere
        // Normal Flow
        const links = [];

        edges_main = options['path_loop'] ? edges_main['loops'] : edges_main['breaked_edges']

        //Create paths for each of the edges in the file.
        for (let i = 0; i < edges_main.length; i++) {

            let pos_arr_from = edges_main[i]['from_location'] ? edges_main[i]['from_location'] : edges_main[i].from.split('y');
            let pos_arr_to = edges_main[i]['to_location'] ? edges_main[i]['to_location'] : edges_main[i].to.split('y');

            const link:any = {
                source: edges_main[i].from,
                target: edges_main[i].to,
                label: edges_main[i].label,
                weight: edges_main[i].weight,
                    
                timestamp_start: edges_main[i].timestamp_start,
                timestamp_end: edges_main[i].timestamp_end,
                LatLng_from: new L.LatLng(+pos_arr_from[0],
                    +pos_arr_from[1]),
                LatLng_to: new L.LatLng(+pos_arr_to[0],
                        +pos_arr_to[1]),

            };

            if(options['path_loop']){
                link['loop_no'] = edges_main[i].loop_no
            }
            //Finally push the node into the object.
            links.push(link);
        }
        
        


        const edgeclicked_structure1 = (d:any) => {
        
            this.modalService.open(this.edge_details, { size: 'xl' });
                setTimeout(() => {
                    this.renderingServices.show_edge_details(d, '1D');
                })
            
        }

        //Dimensions for the scatterplot.
        this.g_structure1.html('');
        



        // Declaring Width & Color based on the options        
        let myWidth = 2
        let mycolor = options['path_loop'] ? this.structure1_loop_color : this.structure1_breakage_color



        this.links_structure1 = 
        this.g_structure1.append('g') //this.svg
            .attr('class', 'edges')
            .attr('stroke', mycolor)
            .attr('stroke-width', myWidth)
            .attr('stroke-opacity', 1)
            .selectAll('path')
            .data(links)
            .join('path')
        // .attr('d', this.path)
            .attr('id', function (d:any, i:any) {
                let sourceNode = d.source.replaceAll('.','_');
                let targetNode = d.target.replaceAll('.','_');
                return 'structure1link_' + sourceNode + "-" + targetNode
            })
            .attr('item_selector', (d:any) => d.label)
            .attr('loop_no', (d:any) => d['loop_no'] ? d['loop_no'] : null) // Adding Conditional Loop Number
            .attr('timestamp', (d:any) => d.timestamp_start + "to" + d.timestamp_end)
            .attr('marker-end', (d:any,i:any) => {
                return 'url(#arrow_self)';
            })
            .style('fill', 'transparent')
            .style('pointer-events','visibleStroke')
            .style('cursor','pointer')
            .on('click', edgeclicked_structure1)
            .on("mouseover", function(d:any) {	
                let html_string = "<b>Entity: </b>" + d.label + "<br>" +
                                  "<b>From: </b>" + d.source + ", <b>at</b> " + moment(d.timestamp_start).format('DD/MM/YYYY hh:mm:ss A') + "<br>" +
                                  "<b>To: </b>" + d.target + ", <b>at</b> " + moment(d.timestamp_end).format('DD/MM/YYYY hh:mm:ss A') + "<br>" +
                                  "<b>Weight: </b>" + d.weight + "<br><br>" +
                                  (d['loop_no'] || d['loop_no'] == 0  ? ("<b>Loop Number: </b>" + d.loop_no + "<br>") : "");
                tooltip_div.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                tooltip_div.html(html_string)	
                    .style("left", (d3.event.pageX + 10) + "px")		
                    .style("top", (d3.event.pageY - 35) + "px");	
                if(d['loop_no'] || d['loop_no'] == 0){
                    $('[loop_no='  + d.loop_no + '][item_selector=' + d.label + ']').attr('stroke-width', 7).attr('stroke', 'orange')
                }
                
                })					
            .on("mouseout", function(d:any) {		
                tooltip_div.transition()		
                    .duration(500)		
                    .style("opacity", 0);
                if(d['loop_no'] || d['loop_no'] == 0){
                    $('[loop_no='  + d.loop_no + '][item_selector=' + d.label + ']').attr('stroke-width', 2).attr('stroke', mycolor)
                }	
            })

            this.updatePositions();

        return this.g_structure1.node();
    }

    //this.displayStateMachine_stat1_node(this.avg_nodes, {avg_duration: this.stat1_radius == 'avg_duration', total_duration: this.stat1_radius == 'total_duration' })
    displayStateMachine_stat1_node(nodes_main: any, options: any) {

        // Normal Flow
        const nodes = [];
        //Create nodes for each of the nodes in the file.
        for (let i = 0; i < nodes_main.length; i++) {
            let pos_arr = nodes_main[i]['node_location'] ? nodes_main[i]['node_location'] : nodes_main[i].node.split('y');
            let node_temp = {
                node_name: nodes_main[i].node,
                lat: +pos_arr[0],
                lng: +pos_arr[1],
                LatLng: new L.LatLng(+pos_arr[0],
                    +pos_arr[1]),
                
                avg_duration: nodes_main[i].avg_duration,
                total_duration: nodes_main[i].total_duration,
                incoming: nodes_main[i].incoming,
                outgoing: nodes_main[i].outgoing,
            };
            nodes.push(node_temp);
            }
    
        const nodeclicked_stat1 = (d:any) => {
            //console.log("Node Clicked", d)
            this.modalService.open(this.node_details, { size: 'xl' });
                setTimeout(() => {
                    this.renderingServices.show_node_details(d, '1D');
                })
     
        }
        this.g_stats1_node.html('');  

        let maxCount_duration = 0
        let minCount_duration = 0

        maxCount_duration = d3.max(nodes, (d:any) => {
            if(options.avg_duration){
                return d.avg_duration;
            }else if(options.total_duration){
                return d.total_duration;
            }
        });

        minCount_duration = d3.min(nodes, (d:any) => {
            if(options.avg_duration){
                return d.avg_duration;
            }else if(options.total_duration){
                return d.total_duration;
            }
        });

        let myRadius:any
        if(typeof this.stat1_radius_scale === 'string'){
            myRadius = eval(''+this.stat1_radius_scale)
            myRadius = myRadius(minCount_duration, maxCount_duration, this.stat1_radius_slider[0], this.stat1_radius_slider[1])
        }else{
            myRadius = this.stat1_radius_scale(minCount_duration, maxCount_duration, this.stat1_radius_slider[0], this.stat1_radius_slider[1])
        }
           
        this.nodes_stats1 = this.g_stats1_node.append("g").attr("class", "nodes").attr('style', 'pointer-events: all').selectAll("circle")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .style('cursor','pointer')
            .attr('id', (d:any) =>  "node_"+d.node_name)
            .on('click', nodeclicked_stat1)
            .on("mouseover", function(d:any) {	
                let html_string = "<b>Node: </b>" + d.node_name + "<br><br>" +
                                  "<b>Average Duration: </b>" + d.avg_duration + " Minutes<br>" +
                                  "<b>Total Duration: </b>" + d.total_duration + " Minutes<br>" +
                                  "<b>No. Incoming Edges: </b>" + d.incoming + "<br>" +
                                  "<b>No. Outgoing Edges: </b>" + d.outgoing + "<br>";
                tooltip_div.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                tooltip_div.html(html_string)	
                    .style("left", (d3.event.pageX + 10) + "px")		
                    .style("top", (d3.event.pageY - 35) + "px");	
                })					
            .on("mouseout", function(d:any) {		
                tooltip_div.transition()		
                    .duration(500)		
                    .style("opacity", 0);	
            })
        

        let in_color = this.stat1_in_color
        let out_color = this.stat1_out_color
        
        /* Draw the respective pie chart for each node */
        this.nodes_stats1.each(function (d:any) {
            let percent1 = (d.incoming/(d.incoming + d.outgoing)) * 100
            let percent2 = (d.outgoing/(d.incoming + d.outgoing)) * 100
            let radius = 0;
            if(options.avg_duration){
                radius = myRadius(d.avg_duration)
             }else{
                radius = myRadius(d.total_duration)
             } 
            //@ts-ignore
            NodePieBuilder.drawNodePie(d3.select(this), 
               [{color: in_color, percent: percent1},{color: out_color, percent: percent2}],
                {
                    parentNodeColor: "#aaa",
                    outerStrokeWidth: 1,
                    radius: radius
                });
        });
            
            this.updatePositions();
    
            return this.g_stats1_node.node();
    }



    displayStateMachine_stat2_node(nodes_main: any) {

        // Normal Flow
        const nodes = [];
        //Create nodes for each of the nodes in the file.
        for (let i = 0; i < nodes_main.length; i++) {
            let pos_arr = nodes_main[i]['node_location'] ? nodes_main[i]['node_location'] : nodes_main[i].node.split('y');
            let node_temp:any = {
                node_name: nodes_main[i].node,
                lat: +pos_arr[0],
                lng: +pos_arr[1],
                LatLng: new L.LatLng(+pos_arr[0],
                    +pos_arr[1]),
                edges: nodes_main[i]['edges']
            };
            nodes.push(node_temp);
        }
    
        const nodeclicked_stat2 = (d:any) => {
            //console.log("Node Clicked", d)
            this.modalService.open(this.node_details, { size: 'xl' });
                setTimeout(() => {
                    this.renderingServices.show_node_details(d, '1D');
                })
     
        }
        this.g_stats2_node.html('');  

       
           
        this.nodes_stats2 = this.g_stats2_node
            .append("g")
            .attr("class", "nodes")
            .attr('style', 'pointer-events: all')
            .selectAll("cicle")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .style('cursor','pointer')
            .attr('id', (d:any) =>  "node_"+d.node_name)
            .on('click', nodeclicked_stat2)
            .on("mouseover", function(d:any) {	
                let html_string = "<b>Node: </b>" + d.node_name + "<br><br>"
                d.edges.forEach((edge:any, index:any) => {
                    html_string = html_string + "<b>#" + (index+1) + " Entity:</b>" + edge.label + ", <b>Weight: </b>" + edge.weight + "<br>"; 
                });
                tooltip_div.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                tooltip_div.html(html_string)	
                    .style("left", (d3.event.pageX + 10) + "px")		
                    .style("top", (d3.event.pageY - 35) + "px");	
                })					
            .on("mouseout", function(d:any) {		
                tooltip_div.transition()		
                    .duration(500)		
                    .style("opacity", 0);	
            });
        

        let rank_colors = [this.stat1_r1_color, this.stat1_r2_color, this.stat1_r3_color, this.stat1_r4_color, this.stat1_r5_color]
        
        /* Draw the respective pie chart for each node */
        this.nodes_stats2.each(function (d:any) {
            let glyph_data:any = [];
            let total_weight = 0
            d.edges.forEach((e:any) => {
                total_weight = total_weight + e.weight
            })
            d.edges.forEach((element:any, index: any) => {
                glyph_data.push({color: rank_colors[index], percent: (element.weight/total_weight) * 100 } )
            });

            let radius = 9;
        
            //@ts-ignore
            NodePieBuilder.drawNodePie(d3.select(this), 
              glyph_data,
                {
                    parentNodeColor: "#aaa",
                    outerStrokeWidth: 1,
                    radius: radius
                });
        });
            
            this.updatePositions();
    
            return this.g_stats2_node.node();
    }

    showOptions(nodes_main: any, edges_main: any) {
        let elements = [...new Set(edges_main.map((e:any) =>  e['label'] ))];
        this.elements = elements.map((e:any) => {return {'label': e}})
        ////console.log(this.elements)
    }

    updatePositions(){                
        this.nodes.attr("transform", 
                    (d:any) => { 
                        return "translate("+ 
                        this.mapCanvas.latLngToLayerPoint(d.LatLng).x +","+ 
                        this.mapCanvas.latLngToLayerPoint(d.LatLng).y +")";
                        }
                    )
        this.links.attr("d", 
                    (d:any) => { 
                        return 'M' + this.mapCanvas.latLngToLayerPoint(d.LatLng_from).x + "," + this.mapCanvas.latLngToLayerPoint(d.LatLng_from).y + 'L' + 
                        this.mapCanvas.latLngToLayerPoint(d.LatLng_to).x + "," + this.mapCanvas.latLngToLayerPoint(d.LatLng_to).y;
                    }
                    )
        if(this.links_stat1){
            this.links_stat1.attr("d", (d:any) => { 
                            return 'M' + this.mapCanvas.latLngToLayerPoint(d.LatLng_from).x + "," + this.mapCanvas.latLngToLayerPoint(d.LatLng_from).y + 'L' + 
                            this.mapCanvas.latLngToLayerPoint(d.LatLng_to).x + "," + this.mapCanvas.latLngToLayerPoint(d.LatLng_to).y;
                            }
                        )
        }
        if(this.links_structure1){
            this.links_structure1.attr("d", (d:any) => { 
                            return 'M' + this.mapCanvas.latLngToLayerPoint(d.LatLng_from).x + "," + this.mapCanvas.latLngToLayerPoint(d.LatLng_from).y + 'L' + 
                            this.mapCanvas.latLngToLayerPoint(d.LatLng_to).x + "," + this.mapCanvas.latLngToLayerPoint(d.LatLng_to).y;
                            }
                        )
        }
        if(this.nodes_stats1){
            this.nodes_stats1.attr("transform", 
                    (d:any) => { 
                        return "translate("+ 
                        this.mapCanvas.latLngToLayerPoint(d.LatLng).x +","+ 
                        this.mapCanvas.latLngToLayerPoint(d.LatLng).y +")";
                        }
                    )
        }
        if(this.nodes_stats2){
            this.nodes_stats2.attr("transform", 
                    (d:any) => { 
                        return "translate("+ 
                        this.mapCanvas.latLngToLayerPoint(d.LatLng).x +","+ 
                        this.mapCanvas.latLngToLayerPoint(d.LatLng).y +")";
                        }
                    )
        }
        
    }
    select_interval(){
        ////console.log(this.selected_interval)
        if(this.selected_interval && this.selected_interval != undefined ){
            this.getDataset(this.selected_interval['value'])
        }
    
    }
    select_edge_interval(){
        ////console.log(this.selected_edge_interval)
        if(this.selected_edge_interval && this.selected_edge_interval != undefined ){
            this.renderingServices.show_edge_details(null, this.selected_edge_interval['value']);
        }
    
    }
    select_node_interval(){
        ////console.log(this.selected_node_interval)
        if(this.selected_node_interval && this.selected_node_interval != undefined ){
            this.renderingServices.show_node_details(null, this.selected_node_interval['value']);
        }
    
    }
    select_elements(){
            ////console.log(this.selected_elements)
            $('path').each(function(i:any, obj:any) {
                //@ts-ignore
                $(this).css('stroke', $(this).attr('oldstroke'))
                //@ts-ignore
                $(this).attr('stroke-width', $(this).attr('oldstrokewidth'))
                ////console.log(i, obj)
                
            });
            if(this.selected_elements.length){
                let jquery_search_string = ''
                //@ts-ignore
                this.selected_elements.forEach((element:any) => {
                        if(!jquery_search_string){
                            jquery_search_string = "[item_selector= " + element['label'] + "]";
                        }else{
                            jquery_search_string = jquery_search_string + ",[item_selector= " + element['label'] + "]";
                        }
                });

                $(jquery_search_string).each(function(i:any, obj:any) {
                    //@ts-ignore
                    if(!$(this).attr('oldstroke')){
                        //@ts-ignore
                        $(this).attr('oldstroke', $(this).css('stroke'))
                        //@ts-ignore
                        $(this).attr('oldstrokewidth', $(this).attr('stroke-width'))
                    }
                    //@ts-ignore
                    $(this).css('stroke', '#cc7700')
                    //@ts-ignore
                    $(this).attr('stroke-width', '2')
                    
                });
            }
    }

    openModule(evt:any, cityName:any) {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            //@ts-ignore
        tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        //@ts-ignore
        document.getElementById(cityName).style.display = "block";
        evt.currentTarget.className += " active";
    }

    stat1_selected(){
        // Check
        if(this.locationbased){
            this.displayStateMachine_stats1(this.avg_edges, {avg_duration: this.stat1_duration == 'avg_duration', avg_weight: this.stat1_weight == 'avg_weight', total_duration: this.stat1_duration == 'total_duration', total_weight: this.stat1_weight == 'total_weight'})
        }else{
            this.renderNetworkVis()
        }
       
    }

    structure1_selected(){
        if(this.locationbased){
          this.displayStateMachine_structure1(this.structure_edges, {path_loop: this.structure1 == 'path_loop', path_breakage: this.structure1 == 'path_breakage'})
        }else{
            this.renderNetworkVis()
        }
    }

    stat1_node_selected(){
       if(this.locationbased){
         this.displayStateMachine_stat1_node(this.avg_nodes, {avg_duration: this.stat1_radius == 'avg_duration', total_duration: this.stat1_radius == 'total_duration' })
        }else{
            this.stat1_radius_slider = [0.1, 0.5]
            this.renderNetworkVis()
        }
    }

    stat1_top5_node_selected(){
        if(this.locationbased){
            this.displayStateMachine_stat2_node(this.top_5_labels)
        }else{
            this.renderNetworkVis()
        }
     }

    outlier_node_selected(temp_edges?:any){
        if(this.selected_layer_node == 'outlier'){
        let avg_nodes = JSON.parse(JSON.stringify(this.avg_nodes));
            let avg_nodes_filtered = avg_nodes.map((e:any) => {
                delete e['edges']
                return e
            })

            //console.log("For CNA, DNODA, GLODA", avg_nodes_filtered);
            this.restService.sotaNode(this.selected_sota, this.outlier_weight_sentiment, avg_nodes_filtered, this.outlier_top_n).subscribe(
                (response:any) => {
                    
                    //console.log("Anomalous Nodes:", response)

                    this.outlier_holder = response;    
                    if(temp_edges){
                        response['edges'] = temp_edges
                    }
                    this.top_5_anomalies(response)
                    d3.selectAll(".outlier_node").attr("class","node")

                    $('#mainlayer').find('.nodes').show()

                    response['anomalous_nodes'].forEach((node:any) => {
                        d3.select("#node_" + node).attr("class","node outlier_node")
                    });

                    d3.selectAll(".node").attr("style", "cursor: pointer; fill: rgb(163, 197, 247); display: none")
                    d3.selectAll(".outlier_node").attr("style", "cursor: pointer; fill: rgb(163, 197, 247); display: block;")
                    
                }
            );
        }

    }


    cancel_request(){
        if(this.ffade_subscription){
            this.ffade_subscription.unsubscribe()
            this.ffade_subscription = null
            this.ffade_api_training = false;
            return true
        }
        return false
    }

    ffade_edge_selected(temp_nodes?:any){
        if(this.selected_layer_edge == 'ffade'){
        this.ffade_api_training = true
        let avg_nodes = JSON.parse(JSON.stringify(this.avg_nodes));
            
            let args = {
                ds: this.selected_dataset,
                embedding_size: this.ffade_args.embedding_size,
                batch_size: this.ffade_args.batch_size,
                t_setup: this.ffade_args.t_setup,
                W_upd: this.ffade_args.W_upd,
                alpha: this.ffade_args.alpha,
                T_th: this.ffade_args.T_th,
                epochs: this.ffade_args.epochs,
                online_train_steps: this.ffade_args.online_train_steps,
                M: this.ffade_args.M
            }
            
            if(this.cancel_request()){
                return
            }

            //console.log("For FFADE", args);
            
            this.ffade_subscription = this.restService.sotaEdge(args).subscribe(
                (response:any) => {
                    this.ffade_api_training = false;
                    //console.log("Anomalous Edges:", response)

                    this.ffade_holder = response;   
                    if(temp_nodes){
                        response['nodes'] = temp_nodes
                    }
                    this.top_5_anomalies(response)
                    d3.selectAll(".outlier_edge").attr("class","category_link")
                    $('#mainlayer').find('.edges').show()
                    
                    response['anomalous_edges'].forEach((link:any) => {
                        d3.select("#link_" + link['from'] + "-" + link['to']).attr("class","category_link outlier_edge")
                    });
                    d3.selectAll(".category_link").attr("style", "display: none")
                    d3.selectAll(".outlier_edge").attr("style", "display: block")
                    
                }
            );
        }
    }


    changeLayer_edge(flag?:any){
        let analysis_data:any = {nodes:null, edges:null, anomalous_nodes:null}
        if(this.selected_layout == "no_layout" || this.selected_layer_node == "stats1_node"){
            analysis_data['nodes'] = this.avg_nodes
        }else if(this.selected_layer_node == "stats2_node"){
            analysis_data['nodes'] = this.top_5_labels
        }else if(this.selected_layout == "outlier"){
            analysis_data['anomalous_nodes'] = this.outlier_holder['anomalous_nodes']
        }else{
            analysis_data['nodes'] = this.locationbased ? this.location_graph_holder.nodes : this.nonlocation_graph_holder.nodes
        }

        this.top_5_edge_anomalies = []
        this.top_5_node_anomalies = []

        if(!this.stat1_layer && !this.structure1_layer && !this.ffade_layer){
           
            //Here remove ffade edges class
            d3.selectAll(".outlier_edge").attr("class","category_link")
            this.selected_layer_edge = 'normal'
            if(this.locationbased){
                $('#mainlayer').find('.edges').show();
            }else{
                // Apply Forced Directed graph layer
                $('.layout_option_div').show();
                setTimeout(() => {
                    this.forced_directed_graphlayer()
                })
                
            }
        }else{
            if(!this.ffade_layer){
                $('#mainlayer').find('.edges').hide();
            }else{
                $('#mainlayer').find('.edges').show();
            }
           
        }
        
        if(this.stat1_layer && flag == 1){
            this.selected_layer_edge = 'stats1'
            $('#structure1layer').hide();
            $("#ffadelayer").hide()
           
            // Apply show layer as location based or forced directed
            if(this.locationbased){
                analysis_data['edges'] = this.avg_edges;
                this.top_5_anomalies(analysis_data)
                $('#stats1layer').show();
            }else{
                // Apply Forced Directed graph layer
                $('.layout_option_div').show();
                setTimeout(() => {
                    this.forced_directed_graphlayer()
                })
            }




            this.structure1_layer = false;
            this.ffade_layer = false
        }else{
            $('#stats1layer').hide();
        }


        if(this.structure1_layer && flag == 2){
            this.selected_layer_edge = 'structure1'
            $('#stats1layer').hide();
            $("#ffadelayer").hide()

             // Apply show layer as location based or forced directed
             if(this.locationbased){
                 // No Showing of aomalies just calling
                 this.top_5_anomalies(analysis_data)
                $('#structure1layer').show();
             }else{
                // Apply Forced Directed graph layer
                $('.layout_option_div').show();
                setTimeout(() => {
                    this.forced_directed_graphlayer()
                })
              }

            this.stat1_layer = false;
            this.ffade_layer = false
        }else{
            $('#structure1layer').hide();
        }

        this.cancel_request()
            

        if(this.ffade_layer && flag == 3){
            if(this.selected_dataset == "darpa"){
                this.selected_layer_edge = 'ffade'
                $('#structure1layer').hide();
                $('#stats1layer').hide();
                $("#ffadelayer").show()
                this.structure1_layer = false;
                this.stat1_layer = false;
               
                // Render FFADE
                this.ffade_edge_selected(analysis_data['nodes'])
            }else{
                alert("FFade Layer currently only works on darpa dataset and not this one due to huge time intervals between edges.")
                setTimeout(() => {
                    this.ffade_layer = false
                })
                
                
            }
           


        }else{            
            $('#ffadelayer').hide();
        }

        

        
    }

    forced_directed_graphlayer(){
        let data = JSON.parse(JSON.stringify(this.nonlocation_graph_holder))
       

        let options = {
            stat1_radius_scale: this.stat1_radius_scale,
            stat1_radius_slider: this.stat1_radius_slider,
            stat1_in_color: this.stat1_in_color,
            stat1_out_color: this.stat1_out_color,

            avg_duration: this.stat1_duration == 'avg_duration', 
            avg_weight: this.stat1_weight == 'avg_weight', 
            total_duration: this.stat1_duration == 'total_duration', 
            total_weight: this.stat1_weight == 'total_weight',

            stat1_width_scale: this.stat1_width_scale,
            stat1_width_slider: this.stat1_width_slider,
            stat1_width_scale_fn: this.stat1_width_scale,
            
            stat1_colorMap_scale: this.stat1_colorMap_scale,
            stat1_colorMap_low: this.stat1_colorMap_low,
            stat1_colorMap_high: this.stat1_colorMap_high,
            stat1_colorMap_scale_fn: this.stat1_colorMap_scale,

            selected_layout: this.selected_layout,

            path_loop: this.structure1 == 'path_loop', 
            path_breakage: this.structure1 == 'path_breakage',

            structure1_loop_color: this.structure1_loop_color,
            structure1_breakage_color: this.structure1_breakage_color,

            rank: [this.stat1_r1_color, this.stat1_r2_color, this.stat1_r3_color, this.stat1_r4_color, this.stat1_r5_color]
        }

        if(this.selected_layout == "no_layout" || this.selected_layer_node == "stats1_node"){
            data['nodes'] = this.avg_nodes
        }else if(this.selected_layout == "stats2_node"){
            data['nodes'] = this.top_5_labels
        }

        //console.log("Nodes Nodes Nodes", data)

        if(this.selected_layer_edge == "stats1"){
            // Stat1 Edge Analytics
            //console.log("Avg edges non locationbased stats1", this.avg_edges, this.avg_nodes)
            
            // Manipulate data
            data['edges'] = this.avg_edges
            

            this.top_5_anomalies(data)
            network_viz = new NetworkVis(this.svg, this.height, this.width, data, this.modalService, this.renderingServices, this.node_details, this.edge_details,  this.selected_dataset, this.selected_layer_edge, this.selected_layer_node, options); 


            //console.log("Edge Average", this.avg_edges)
           // this.displayStateMachine_stats1(this.avg_edges, {avg_duration: this.stat1_duration == 'avg_duration', avg_weight: this.stat1_weight == 'avg_weight', total_duration: this.stat1_duration == 'total_duration', total_weight: this.stat1_weight == 'total_weight'})
        }else if(this.selected_layer_edge == "structure1"){
            // Stat1 Edge Analytics
            //console.log("Avg edges non locationbased sturcture1", this.structure_edges, this.avg_nodes)
            let edges_main = this.structure1 == 'path_loop' ? this.structure_edges['loops'] : this.structure_edges['breaked_edges']
            

            // Manipulate data
            data['edges'] = edges_main

            this.top_5_anomalies(data)
            network_viz = new NetworkVis(this.svg, this.height, this.width, data, this.modalService, this.renderingServices, this.node_details, this.edge_details,  this.selected_dataset, this.selected_layer_edge, this.selected_layer_node, options); 


            //console.log("Edge Average", this.avg_edges)
           // this.displayStateMachine_stats1(this.avg_edges, {avg_duration: this.stat1_duration == 'avg_duration', avg_weight: this.stat1_weight == 'avg_weight', total_duration: this.stat1_duration == 'total_duration', total_weight: this.stat1_weight == 'total_weight'})
        }else{
            this.top_5_anomalies(data)
            network_viz = new NetworkVis(this.svg, this.height, this.width, data, this.modalService, this.renderingServices, this.node_details, this.edge_details,  this.selected_dataset, this.selected_layer_edge, this.selected_layer_node, options); 

        }
        

    }

    changeLayer_node(flag?:any){

        let analysis_data = {nodes:null, edges:null, anomalous_edges:null}
        if(this.selected_layer_edge == "stats1"){
            analysis_data['edges'] = this.avg_edges
        }else if(this.selected_layer_edge == "structure1"){
            analysis_data['edges'] = this.structure1 == 'path_loop' ? this.structure_edges['loops'] : this.structure_edges['breaked_edges']
        }else if(this.selected_layer_edge == "ffade"){
            analysis_data['anomalous_edges'] = this.ffade_holder['anomalous_edges']
        }else{
            analysis_data['edges'] = this.locationbased ? this.location_graph_holder.edges : this.nonlocation_graph_holder.edges
        }
       
        if(!this.stat1_node_layer && !this.stat2_node_layer && !this.outlier_node_layer){
           
            // Here remove the outlier css
            d3.selectAll(".outlier_node").attr("class","node")
            this.selected_layer_node = 'normal'
            if(this.locationbased){
                $('#mainlayer').find('.nodes').show();
            }else{
                // Apply Forced Directed graph layer
                $('.layout_option_div').show();
                setTimeout(() => {
                    this.forced_directed_graphlayer()
                })
                
            }

        }else{
            
            if(!this.ffade_layer){
                $('#mainlayer').find('.nodes').hide();
            }else{
                $('#mainlayer').find('.nodes').show();
            }
        }

    
        if(this.stat1_node_layer && flag == 1){
            this.selected_layer_node = 'stats1_node'
            $('#stats2nodelayer').hide();
            $('#outliernodelayer').hide();
            
             // Apply show layer as location based or forced directed
             if(this.locationbased){
                analysis_data['nodes'] = this.avg_nodes;
                this.top_5_anomalies(analysis_data)
                $('#stats1nodelayer').show();
            }else{
                // Apply Forced Directed graph layer
                $('.layout_option_div').show();
                setTimeout(() => {
                    this.forced_directed_graphlayer()
                })
            }


            this.stat2_node_layer = false;
            this.outlier_node_layer = false;
        }else{
            $('#stats1nodelayer').hide();
        }

        if(this.stat2_node_layer && flag == 2){
            this.selected_layer_node = 'stats2_node'
            $('#stats1nodelayer').hide();
            $('#outliernodelayer').hide();

            // Apply show layer as location based or forced directed
            if(this.locationbased){
                // No showing to top 5 anomalous nodes only calling function
                this.top_5_anomalies(analysis_data)
                $('#stats2nodelayer').show();
            }else{
                // Apply Forced Directed graph layer
                $('.layout_option_div').show();
                setTimeout(() => {
                    this.forced_directed_graphlayer()
                })
            }

            this.stat1_node_layer = false;
            this.outlier_node_layer = false;
        }else{            
            $('#stats2nodelayer').hide();
            d3.selectAll(".category_link").attr("style", "display: block")
            d3.selectAll(".outlier_edge").attr("class","category_link")

        }

        if(this.outlier_node_layer && flag == 3){
            this.selected_layer_node = 'outlier'
            $('#stats1nodelayer').hide();
            $('#stats2nodelayer').hide();
            $('#outliernodelayer').show();
            this.stat1_node_layer = false;
            this.stat2_node_layer = false;

            // Render CNA, DNODA, GLODA
           
            this.outlier_node_selected(analysis_data['edges'])


        }else{            
            $('#outliernodelayer').hide();
            d3.selectAll(".node").attr("style", "cursor: pointer; fill: rgb(163, 197, 247);display: block")
            d3.selectAll(".outlier_node").attr("class","node")
        }

        
    }


    openDemo(flag:any){
        if(flag == 'ffade'){
            this.modalService.open(this.ffade, { size: 'lg' });
        }else{
            this.modalService.open(this.dnoda, { size: 'lg' });
        }
    }

    top_5_anomalies(data:any){
        console.log("Top 5 anomalies", data)
        data = JSON.parse(JSON.stringify((data)))

        this.top_5_node_anomalies = []
        this.top_5_edge_anomalies = []

        // Edge Layer anomalies
        if(this.selected_layer_edge == "stats1"){
            // Color based sorting
            let  anomolous_edges_color = data.edges.sort((a:any,b:any) => {
                    if(this.stat1_duration == 'avg_duration'){
                        // Average duration based sorting
                        return a.avg_duration - b.avg_duration
                    }
                    if(this.stat1_duration == 'total_duration'){
                        // Total duration based sorting
                        return a.total_duration - b.total_duration
                    }
                    return a.avg_duration - b.avg_duration
            })

            
            anomolous_edges_color = anomolous_edges_color.length > 4 ? anomolous_edges_color.slice(0,5) :  anomolous_edges_color
            let obj = {
                type: 'Color',
                edges: anomolous_edges_color.map((e:any) => e['name'] ? e['name'] : e['from'] + "to" + e["to"])
            }
            this.top_5_edge_anomalies.push(obj)

            console.log("Anomolous top 5 Edge Color stats1", anomolous_edges_color)


            // Width based sorting
            let  anomolous_edges_width = data.edges.sort((a:any,b:any) => {
                if(this.stat1_weight == 'avg_weight'){
                    // Average weight based sorting
                    return a.avg_weight - b.avg_weight
                }
                if(this.stat1_weight == 'total_weight'){
                    // Total weight based sorting
                    return a.total_weight - b.total_weight
                }
                return a.avg_weight - b.avg_weight
                
            })

            anomolous_edges_width = anomolous_edges_width.length > 4 ? anomolous_edges_width.slice(0,5) :  anomolous_edges_width

            obj = {
                type: 'Width',
                edges: anomolous_edges_width.map((e:any) => e['name'] ? e['name'] : e['from'] + "to" + e["to"])
            }
            this.top_5_edge_anomalies.push(obj)

            console.log("Anomolous top 5  Edge Width stats1", anomolous_edges_width)

        }else if(this.selected_layer_edge == "structure1"){

            

        }else if(this.selected_layer_edge == "ffade" && data['anomalous_edges']){
            
            let anomolous_edges_color =  data.anomalous_edges.length > 4 ? data.anomalous_edges.slice(0,5) :  data.anomalous_edges

            let obj = {
                type: 'Color',
                edges: anomolous_edges_color.map((e:any) => e['name'] ? e['name'] : e['from'] + "to" + e["to"])
            }
            this.top_5_edge_anomalies.push(obj)

            console.log("Anomolous top 5 Edge Width ffade", anomolous_edges_color)
        }
        
        // Node Layer anomalies
        if(this.selected_layer_node == "stats1_node"){          

        // Width based sorting
        let  anomolous_nodes_width = data.nodes.sort((a:any,b:any) => {
                if(this.stat1_radius == 'avg_duration'){
                    // Average weight based sorting
                    return this.durationbased ? a.avg_duration - b.avg_duration : a.outgoing - b.outgoing
                }
                if(this.stat1_radius == 'total_duration'){
                    // Total weight based sorting
                    return this.durationbased ? a.total_duration - b.total_duration : a.incoming - b.incoming
                }
                return this.durationbased ? a.avg_duration - b.avg_duration : a.outgoing - b.outgoing
            
            })

            anomolous_nodes_width = anomolous_nodes_width.slice(0,5)

            let obj = {
                type: 'Color',
                nodes: anomolous_nodes_width.map((e:any) => e['node'])
            }
            this.top_5_node_anomalies.push(obj)

            console.log("Anomolous top 5 Nodes Width stats1_node", anomolous_nodes_width)

        }else if(this.selected_layer_node == "stats2_node"){

            

        }else if(this.selected_layer_node == "outlier" && data['anomalous_nodes']){
            let anomolous_nodes_outlier =  data.anomalous_nodes.length > 4 ? data.anomalous_nodes.slice(0,5) :  data.anomalous_nodes

            let obj = {
                type: 'Color',
                nodes: anomolous_nodes_outlier
            }
            this.top_5_node_anomalies.push(obj)

            console.log("Anomolous top 5 nodes outlier ", anomolous_nodes_outlier)
        }

    }

    ffade_slider_init(){
        // Range slider for outlier node embedding size
        let sliderRange = d3
        .sliderBottom()
        .min(50)
        .max(500)
        .step(50)
        .default(this.ffade_args.embedding_size)
        .width($('.stat1_slider_div').width() + 50)
        .ticks(5)
        .fill('#2196f3')
        .on('end', (val:any) => {
           this.ffade_args.embedding_size = val;
        });

       let gRange = d3
       .select('div#slider-range-embedding').html("")
       .append('svg')
       .attr('width', $('.stat1_slider_div').width() + 50)
       .attr('height', 50)
       .append('g')
       .attr('transform', 'translate(12,8)');

       gRange.call(sliderRange);


       // Range slider for outlier batch size
       sliderRange = d3
       .sliderBottom()
       .min(5)
       .max(200)
       .step(5)
       .default(this.ffade_args.batch_size)
       .width($('.stat1_slider_div').width() + 50)
       .ticks(5)
       .fill('#2196f3')
       .on('end', (val:any) => {
           this.ffade_args.batch_size = val;
       });

        gRange = d3
        .select('div#slider-range-batch_size').html("")
        .append('svg')
        .attr('width', $('.stat1_slider_div').width() + 50)
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(12,8)');

        gRange.call(sliderRange);



        // Range slider for outlier time to setup t_setup
        sliderRange = d3
        .sliderBottom()
        .min(2000)
        .max(20000)
        .step(2000)
        .default(this.ffade_args.t_setup)
        .width($('.stat1_slider_div').width() + 50)
        .ticks(5)
        .fill('#2196f3')
        .on('end', (val:any) => {
            this.ffade_args.t_setup = val;
        });

        gRange = d3
        .select('div#slider-range-t_setup').html("")
        .append('svg')
        .attr('width', $('.stat1_slider_div').width() + 50)
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(12,8)');

        gRange.call(sliderRange);


        // Range slider for outlier weight update w_upd
        sliderRange = d3
        .sliderBottom()
        .min(100)
        .max(2000)
        .step(40)
        .default(this.ffade_args.W_upd)
        .width($('.stat1_slider_div').width() + 50)
        .ticks(5)
        .fill('#2196f3')
        .on('end', (val:any) => {
            this.ffade_args.W_upd = val;
        });

        gRange = d3
        .select('div#slider-range-W_upd').html("")
        .append('svg')
        .attr('width', $('.stat1_slider_div').width() + 50)
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(12,8)');

        gRange.call(sliderRange);


        // Range slider for outlier alpha
        sliderRange = d3
        .sliderBottom()
        .min(0.1)
        .max(2)
        .step(0.001)
        .default(this.ffade_args.alpha)
        .width($('.stat1_slider_div').width() + 50)
        .ticks(5)
        .fill('#2196f3')
        .on('end', (val:any) => {
        this.ffade_args.alpha = val;
        });

        gRange = d3
        .select('div#slider-range-alpha').html("")
        .append('svg')
        .attr('width', $('.stat1_slider_div').width() + 50)
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(12,8)');

        gRange.call(sliderRange);


        // Range slider for outlier T_th
        sliderRange = d3
        .sliderBottom()
        .min(50)
        .max(2000)
        .step(20)
        .default(this.ffade_args.T_th)
        .width($('.stat1_slider_div').width() + 50)
        .ticks(5)
        .fill('#2196f3')
        .on('end', (val:any) => {
            this.ffade_args.T_th = val;
        });

        gRange = d3
        .select('div#slider-range-T_th').html("")
        .append('svg')
        .attr('width', $('.stat1_slider_div').width() + 50)
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(12,8)');

        gRange.call(sliderRange);


        // Range slider for outlier epochs
        sliderRange = d3
        .sliderBottom()
        .min(1)
        .max(50)
        .step(1)
        .default(this.ffade_args.epochs)
        .width($('.stat1_slider_div').width() + 50)
        .ticks(5)
        .fill('#2196f3')
        .on('end', (val:any) => {
            this.ffade_args.epochs = val;
        });

        gRange = d3
        .select('div#slider-range-epochs').html("")
        .append('svg')
        .attr('width', $('.stat1_slider_div').width() + 50)
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(12,8)');

        gRange.call(sliderRange);

        // Range slider for outlier online_train_steps
        sliderRange = d3
        .sliderBottom()
        .min(5)
        .max(200)
        .step(10)
        .default(this.ffade_args.online_train_steps)
        .width($('.stat1_slider_div').width() + 50)
        .ticks(5)
        .fill('#2196f3')
        .on('end', (val:any) => {
            this.ffade_args.online_train_steps = val;
        });

        gRange = d3
        .select('div#slider-range-online_train_steps').html("")
        .append('svg')
        .attr('width', $('.stat1_slider_div').width() + 50)
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(12,8)');

        gRange.call(sliderRange);


        // Range slider for outlier M
        sliderRange = d3
        .sliderBottom()
        .min(1)
        .max(10000)
        .step(100)
        .default(this.ffade_args.M)
        .width($('.stat1_slider_div').width() + 50)
        .ticks(5)
        .fill('#2196f3')
        .on('end', (val:any) => {
            this.ffade_args.M = val;
        });

        gRange = d3
        .select('div#slider-range-M').html("")
        .append('svg')
        .attr('width', $('.stat1_slider_div').width() + 50)
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(12,8)');

        gRange.call(sliderRange);
    }

    resetFfade(){
        this.ffade_args = {
            embedding_size: 200,
            batch_size: 32,
            t_setup: 8000,
            W_upd: 720,
            alpha: 0.999,
            T_th: 120,
            epochs: 5,
            online_train_steps: 10,
            M: 1
        }

        this.ffade_slider_init()

    }

}