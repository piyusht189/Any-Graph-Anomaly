declare var $:any;
declare var d3:any;

const margin = { top: 0, right: 40, bottom: 0, left: 0 };
var contxt:any = '';
var node:any = ""
var graphLayout:any
import * as moment from 'moment';
import { color_pallete } from './colors';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RenderingServicesService } from 'src/app/services/rendering-services.services';
import { ViewChild, Component } from '@angular/core';
import { NetworkVisEdgeNode } from './network_viz_edgenode';

let tooltip_div = d3.select("body").append("div")	
.attr("class", "tooltip")				
.style("opacity", 0);


/**
 * Class for the network based visualization. Show network structure
 */
export class NetworkVis {

   _svg:any = null
   _g:any = null
   _height:any =  null
   _width:any = null
   _data:any = null
   _clip:any = null
   categories_colors:any = {}
   //@ts-ignore
   node_details:any;
   edge_details:any;
   selected_dataset:any;
   type_layer_edge:any;
   type_layer_node:any;
   network_viz_edgenode:any;
   options:any

  constructor(g:any, 
              height:any, 
              width:any, 
              data:any,  
              private modalService: NgbModal,
              private renderingServices: RenderingServicesService, 
              node_details: any,
              edge_details: any,
              selected_dataset: any,
              type_layer_edge: any,
              type_layer_node: any,
              options: any) {
    this._svg = g;
    this._data = data;
    this._height = height - margin['bottom'] - margin['top'];
    this._width = width - margin['left'] - margin['right'];
    this.node_details = node_details;
    this.edge_details = edge_details;
    this.selected_dataset = selected_dataset;
    this.type_layer_edge = type_layer_edge;
    this.type_layer_node = type_layer_node;
    this.options = options

    this.network_viz_edgenode = new NetworkVisEdgeNode();

   
    try{
      graphLayout.stop()
    }catch(error){
      
    }
    
    this._svg.html("")
    

    this._g = this._svg

    this._g
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this._width)
      .attr('height', this._height)
      .attr('id', 'network-background');

    
    // Categories Filtering
    this.categories_colors = {}
    data.metadata.categories.forEach((element:any, index:any) => {
      this.categories_colors[element] = color_pallete[index]
    });

    $("#categories_list_svg").html("")
    $("#categories_title_div").html("")
    let legend_svg = d3.select("#categories_list_svg").style("width", 0)
    let start_cx = 0
    data.metadata.categories.forEach((element:any) => {
      start_cx = start_cx + 30;
      legend_svg.append("circle").attr("cx", start_cx).attr("cy", 20).attr("r", 10).style("fill", this.categories_colors[element])
      .on("mouseover", function(d:any)  {
        let html_string = element;  
        tooltip_div.transition()		
        .duration(200)		
        .style("opacity", .9);		 
        tooltip_div.html(html_string)	
                    .style("left", (d3.event.pageX - 15) + "px")		
                    .style("top", (d3.event.pageY + 15) + "px");

        d3.selectAll(".category_link").style("display", "none") 
        d3.selectAll("." + element).style("display", null) 
      })
      .on("mouseleave", function(d:any) {
        tooltip_div.transition()		
        .duration(500)		
        .style("opacity", 0);	 
        d3.selectAll(".category_link").style("display", null) 
      }) 
       
    });

    if(data.metadata.categories.length){
      $("#categories_title_div").html("Categories/Signs")
    }
   


    let width_categories =  data.metadata.categories.length * 40 
    legend_svg.style("width", width_categories)

    contxt = this;
    this.draw();
  }

  /**
   * Draw the network
   */
  async draw() {
    // transform the nodes data into the right format
    var node_data:any = {};
    //console.log("Draw", this.type_layer_edge, this.type_layer_node)
    // Get Customised Nodes based on selected layer
    node_data = await this.network_viz_edgenode.getNodes(this._data['nodes'], this.type_layer_node);
    //console.log("Node and Edge final data", this._data)
   
    // transform the edge data
    var edge_data:any = [];
    let edges_data =  this._data['edges'] ? this._data['edges'] : this._data['links']

    // Get Customised Edges based on selected layer
    edge_data = await this.network_viz_edgenode.getEdges(edges_data, this.type_layer_edge, this.options);

    

    
    var perfectEdgeData:any = [];
      edge_data.forEach(function(d:any) {
        let from = d['source']
        let to = d['target'];
        if (node_data[from] && node_data[to]) {
          perfectEdgeData.push(d);
        }
      });
    

    //console.log("perfectEdgeData",perfectEdgeData);

    let svg = this._g
    var container = svg.append("g");

        svg.call(
            d3.zoom()
                .scaleExtent([.05, 10])
                .on("zoom", function() { container.attr("transform", d3.event.transform); })
        );

    
   
    const nodeclicked = (d:any) => {
        //console.log("Node Clicked", d)
        this.modalService.open(this.node_details, { size: 'xl' });
        this.renderingServices.show_node_details(d, '1D');
    }

    const edgeclicked = (d:any) => {
        //console.log("Edge Clicked", d)
        this.modalService.open(this.edge_details, { size: 'xl' });
        this.renderingServices.show_edge_details(d, '1D');
    }

    // Scale Measurements
    let maxCount_weights = 0
    let minCount_weights = 0
    let myWidth:any
    let mycolor:any
    let myRadius:any

    if(this.type_layer_edge == "stats1"){
      maxCount_weights = d3.max(perfectEdgeData, (d:any) => {
        if(this.options.avg_weight){
            return d.avg_weight;
        }else if(this.options.total_weight){
            return d.total_weights;
        }
      });

      minCount_weights = d3.min(perfectEdgeData, (d:any) => {
          if(this.options.avg_weight){
              return d.avg_weight;
          }else if(this.options.total_weight){
              return d.total_weights;
          }
      });

      if(typeof this.options.stat1_width_scale === 'string'){
          myWidth = eval(''+this.options.stat1_width_scale)
          myWidth = myWidth(minCount_weights, maxCount_weights, this.options.stat1_width_slider[0], this.options.stat1_width_slider[1])
      }else{
          myWidth = this.options.stat1_width_scale(minCount_weights, maxCount_weights, this.options.stat1_width_slider[0], this.options.stat1_width_slider[1])
      }
      
      if(typeof this.options.stat1_colorMap_scale === 'string'){

          mycolor = eval(''+this.options.stat1_colorMap_scale)
          mycolor = mycolor(minCount_weights, maxCount_weights, this.options.stat1_colorMap_low, this.options.stat1_colorMap_high)
      }else{
          mycolor = this.options.stat1_colorMap_scale_fn(minCount_weights, maxCount_weights, this.options.stat1_colorMap_low, this.options.stat1_colorMap_high)
      }
    }

    if(this.type_layer_edge == "structure1"){
      myWidth = 0.5
      mycolor = this.options['path_loop'] ? this.options.structure1_loop_color : this.options.structure1_breakage_color
    }

    if(this.type_layer_node == "stats1_node"){
      if(typeof this.options.stat1_radius_scale === 'string'){
        myRadius = eval(''+this.options.stat1_radius_scale)
        myRadius = myRadius(0.1, 3, this.options.stat1_radius_slider[0], this.options.stat1_radius_slider[1])
      }else{
          myRadius = this.options.stat1_radius_scale(0.1, 3, this.options.stat1_radius_slider[0], this.options.stat1_radius_slider[1])
      }
    }


    node = this.network_viz_edgenode.getNodeRender(container, node_data, nodeclicked, this.type_layer_node) 

    if(this.type_layer_node == "stats1_node"){
        let in_color = this.options.stat1_in_color
        let out_color = this.options.stat1_out_color
        
        let options = this.options
        /* Draw the respective pie chart for each node */
        node.each(function (d:any) {
            let percent1 = (d.incoming/(d.incoming + d.outgoing)) * 100
            let percent2 = (d.outgoing/(d.incoming + d.outgoing)) * 100
            let radius = 2;
            if(options.avg_duration){
                radius = myRadius(d.incoming)
             }else{
                radius = myRadius(d.outgoing)
             } 
            // console.log("Radius", radius, d, options, myRadius)
            //@ts-ignore
            NodePieBuilder.drawNodePie(d3.select(this), 
               [{color: in_color, percent: percent1},{color: out_color, percent: percent2}],
                {
                    parentNodeColor: "#aaa",
                    outerStrokeWidth: 1,
                    radius: radius
                });
        });
    }

    if(this.type_layer_node == "stats2_node"){
      let rank_colors = this.options.rank;
        
      /* Draw the respective pie chart for each node */
      node.each(function (d:any) {
          let glyph_data:any = [];
          let total_weight = 0
          d.edges.forEach((e:any) => {
              total_weight = total_weight + e.weight
          })
          d.edges.forEach((element:any, index: any) => {
              glyph_data.push({color: rank_colors[index], percent: (element.weight/total_weight) * 100 } )
          });

          let radius = 3;
      
          //@ts-ignore
          NodePieBuilder.drawNodePie(d3.select(this), 
            glyph_data,
              {
                  parentNodeColor: "#aaa",
                  outerStrokeWidth: 1,
                  radius: radius
              });
      });
    }
    
     let resultsEdgeData:any = []

     const d3line = d3
        .line()
        .curve(d3.curveMonotoneX)
        .x(function(d:any) {
          return d['x'];
        })
        .y(function(d:any) {
          return d['y'];
        });

      if(this.type_layer_edge == "normal" || this.type_layer_edge == "structure1"){
        this._g.append('defs')
        .append('marker')
        .attr('id', 'arrow_self')
        .attr('viewBox', [0, 0, 30, 30])
        .attr('markerUnits', 'strokeWidth')
        .attr('refX', 10)
        .attr('refY', 6)
        .attr('xoverflow', 'visible')
        .attr('markerWidth', 30)
        .attr('markerHeight', 30)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', "M2,2 L10,6 L2,10 L6,6 L2,2")
        .attr('fill', '#0d6efd');
      }
      

     if(this.options.selected_layout != "no_layout"){
       //debugger;
        await Object.values(perfectEdgeData).forEach(async(d:any) => {
          const e = await this.network_viz_edgenode.getEdgeData(node_data, d, this.type_layer_edge);
          resultsEdgeData.push(e);
        });

        node.attr('cx', function(d:any) {
          return d['x']
        })
        node.attr('cy', function(d:any) {
          return d['y']
        })

        //console.log("resultsEdgeData", resultsEdgeData[0])


     }else{
        graphLayout = d3.forceSimulation(Object.values(node_data))
        .force("charge", d3.forceManyBody().strength(-1))
        .force("center", d3.forceCenter(this._width / 2, this._height / 2))
        .force("link", d3.forceLink(perfectEdgeData).id(function(d:any) {return d.id; }).distance(this.selected_dataset == 'darpa' || this.selected_dataset == 'bitcoin-trust-network' ? 300 : 40).strength(this.selected_dataset == 'darpa'? 1 : 1))
        .on("tick", ticked)
        .on("end", function(d:any){
           // console.log("Simulation ended")
            $('.layout_option_div').show();
        });
    
       // console.log("perfectEdgeData", perfectEdgeData[0])       
     } 

     var options = {
      avg_weight: this.options.avg_weight, 
      total_weight: this.options.total_weight,
      selected_layout: this.options.selected_layout
     }

    // console.log("Get EdgeRender", this._data)
     var link = this.network_viz_edgenode.getEdgeRender(this.type_layer_edge, container, this._data, resultsEdgeData, perfectEdgeData, this.categories_colors, d3line, edgeclicked, options, myWidth, mycolor)

     
    

   
    //console.log("resultEdgeData", resultsEdgeData)
    /*const linksBinningGroup = linksGroupEnter
      .selectAll('.bins')
      .data(nestedLinkData); /*nestedLinkData*/

    // ENTER MERGE the links group
    /*const linksBinningGroupEnter = linksBinningGroup
      .enter()
      .append('g')
      .merge(linksBinningGroup)
      .attr('class', 'bin')
      .attr('id', function(d:any) {
        return 'links-bin';
      });*/

    // EXIT the links group
    //linksBinningGroup.exit().remove();

   

    // JOIN the links with the data
    //const links = linksBinningGroupEnter.selectAll('line').data(function(d:any) {
    //  return d[1];
    //});



    // ENTER MERGE the links
    /*var link = this._g.selectAll('line')
      .data(perfectEdgeData)
      .enter()
      .append('line')
      .attr('class', function(d:any) {
        return 'link link-' + d['source'] + ' link-' + d['target'];
      })
      .attr('d', function(d:any) {
        return d3line(d);
      });*/

    
   



     

      

    /*var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d:any) {return d.id;}).distance(100).strength(1))
    .force("charge", d3.forceManyBody().strength(1200))
    .force("collide", d3.forceCollide().radius(100))
    .force("center", d3.forceCenter(this._width / 2, this._height / 2));*/

   



    function fixna(x:any) {
        if (isFinite(x)) return x;
        return 0;
    }
        
    function updateLink(link:any) {
        link.attr("x1", function(d:any) { return fixna(d.source.x); })
            .attr("y1", function(d:any) { return fixna(d.source.y); })
            .attr("x2", function(d:any) { return fixna(d.target.x); })
            .attr("y2", function(d:any) { return fixna(d.target.y); });
    }
    
    function updateNode(node:any) {
        node.attr("transform", function(d:any) {
            return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
        });
    }



function ticked() {
    node.call(updateNode);
    link.call(updateLink);
}

    /**
     * Mouse over a node in the graph
     * @param {Object} event mousevent
     * @param {Object} d node
     */
    function nodeMouseOver(event:any, d:any) {
      const tooltipShift = 25;
      // fade all other nodes and links
      d3.selectAll('.node').classed('faded', true);
      d3.selectAll('.link').classed('faded', true);

      // highlight and add label
      d3.select(d3.event.sourceEvent.target)
        .classed('hovered', true)
        .classed('faded', false)
        .transition()
        .duration(500)
        .attr('r', 20);

      // add text tooltip
      d3.select(d3.event.sourceEvent.target.parentNode)
        .append('text')
        .attr('dy', '.35em')
        .text(d['id'])
       // .attr('x', zoomXScale(d['x']) + tooltipShift / 2)
       // .attr('y', zoomYScale(d['y']) + tooltipShift / 2);
    }

    /**
     * Mouse out over a node in the graph
     * @param {Object} event mousevent
     * @param {Object} d node
     */
    function nodeMouseOut(event:any, d:any) {
      // fade in all other nodes and links
      d3.selectAll('.node')
        .classed('faded', false)
        .classed('highlighted', false);
      d3.selectAll('.link')
        .classed('faded', false)
        .classed('highlighted', false);

      // remove highlight and remove label
      d3.select(d3.event.sourceEvent.target)
        .classed('hovered', false)
        .transition()
        .duration(500)
        //.attr('r', nodeScale(d['incoming']));

      // remove text tooltip
      d3.select(d3.event.sourceEvent.target.parentNode)
        .selectAll('text')
        .remove();
    }
  }

}
