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

let tooltip_div = d3.select("body").append("div")	
.attr("class", "tooltip")				
.style("opacity", 0);


/**
 * Class for the network based visualization. Show network structure
 */
export class NetworkVisEdgeNode {

  

  constructor() {
    
  }
  getNodes(nodes_arr:any, type_layer_node:any){

    // Normal Node Data
    if(type_layer_node == "normal"){
        let node_data:any = {}
        nodes_arr.forEach(function(d:any) {
          //console.log("D", d)
            if(d['node']){
              const id = d['node'].replace(/ /g, '_').replace(/\./g, '_')
              node_data[id] = {
                id: id,
                node: id
                /*incoming: d['incoming'],
                outgoing: d['outgoing'],
                isRegional: d['isRegional'],
                count: d['count']*/
              };
              if(d['location']){
                node_data[id]['x'] = d['location'][0] * 1000
                node_data[id]['y'] = d['location'][1] * 1000
              }
            }
            
          });
          return node_data
    }
    // Stat1 Nodes
    if(type_layer_node == "stats1_node"){
        let nodes:any = {}
        nodes_arr.forEach(function(d:any) {
            const id = d['node'].replace(/ /g, '_').replace(/\./g, '_')
            nodes[id] = {
              id: id,
              node_name: id,
              node: id,
              avg_duration: d.avg_duration,
              total_duration: d.total_duration,
              incoming: d.incoming,
              outgoing: d.outgoing
            };
            if(d['location']){
              nodes[id]['x'] = d['location'][0] * 1000
              nodes[id]['y'] = d['location'][1] * 1000
            }
          });
          return nodes
    }
    // Stat2 Nodes
    if(type_layer_node == "stats2_node"){
      let nodes:any = {}
      nodes_arr.forEach(function(d:any) {
          const id = d['node'].replace(/ /g, '_').replace(/\./g, '_')
          nodes[id] = {
            id: id,
            node_name: id,
            node: id,
            edges: d['edges']            
          };
          if(d['location']){
            nodes[id]['x'] = d['location'][0] * 1000
            nodes[id]['y'] = d['location'][1] * 1000
          }
        });
        return nodes
     }
  }
  getEdges(edges_arr:any, type_layer:any, options?:any){
        // Normal Node Data
        if(type_layer == "normal"){
            let edge_data:any = []
            edges_arr.forEach(function(d:any) {
                const s = d['from'].replace(/ /g, '_').replace(/\./g, '_')
                const t = d['to'].replace(/ /g, '_').replace(/\./g, '_')
                edge_data.push({
                  source: s,
                  target: t,
                  weight: d['weight'],
                  label: d.label, 
                  timestamp_start: d.timestamp_start, 
                  timestamp_end: d.timestamp_end,
                  category: d.category
                });
              });
            return edge_data
        }
        // Stat1 Nodes
        if(type_layer == "stats1"){
            let edge_data:any = []
            //console.log("Edge Data Stat1", edges_arr)
            edges_arr.forEach(function(d:any, i:any) {
                const link = {
                    source: d.edges[0].from.replace(/ /g, '_').replace(/\./g, '_'),
                    target: d.edges[0].to.replace(/ /g, '_').replace(/\./g, '_'),
                    label: [...new Set(d.edges.map((e:any) => e.label))].join(", "), // Combining all the entities passed from this route
                
                    avg_weight: d.avg_weights,
                    total_weights: d.total_weights,
                    
                    timestamp_start: d.edges[0].timestamp_start,
                    timestamp_end: d.edges[0].timestamp_end,
                 };
                //Finally push the node into the object.
                edge_data.push(link);
              });
            return edge_data
        }
        // Structure1 Nodes
        if(type_layer == "structure1"){
          let edge_data:any = []
          //console.log("Edge Data Structure1", edges_arr)
          edges_arr.forEach(function(d:any, i:any) {
              let link:any = {
                  source: d.from.replace(/ /g, '_').replace(/\./g, '_'),
                  target: d.to.replace(/ /g, '_').replace(/\./g, '_'),
                  label: d.label, 
                  timestamp_start: d.timestamp_start,
                  timestamp_end: d.timestamp_end,
                  category: d.category,
                  weight: d.weight
               };
               if(options['path_loop']){
                link['loop_no'] = d.loop_no
               }
              //Finally push the node into the object.
              edge_data.push(link);
            });
          return edge_data
      }
  }

  getEdgeData(node_data:any, d:any, type_layer:any, path_loops?:any){
    let from = d['source'];
    let to = d['target'];
    if(type_layer == "normal"){
        return [
            {
              id: from,
              x: node_data[from]['x'] ? node_data[from]['x'] : 0,
              y: node_data[from]['y'] ? node_data[from]['y'] : 0,
              weight: d['weight'],
              timestamp_start: d['timestamp_start'],
              timestamp_end: d['timestamp_end'],
              label: d['label'],
              category: d['category']
            },
            {
              id: to,
              x: node_data[to]['x'] ? node_data[to]['x'] : 0,
              y: node_data[to]['y'] ? node_data[to]['y'] : 0,
            }
          ];
    }
    if(type_layer == "stats1"){
        return [
            {
              id: from,
              x: node_data[from]['x'] ? node_data[from]['x'] : 0,
              y: node_data[from]['y'] ? node_data[from]['y'] : 0,
              weight: d['weight'],
              timestamp_start: d['timestamp_start'],
              timestamp_end: d['timestamp_end'],
              label: d['label'],
              category: d['category'],
              avg_weight: d['avg_weights'],
              total_weights: d['total_weights'],
            },
            {
              id: to,
              x: node_data[to]['x'] ? node_data[to]['x'] : 0,
              y: node_data[to]['y'] ? node_data[to]['y'] : 0,
            }
          ];
    }
    if(type_layer == "structure1"){
      if(path_loops){
        return [
          {
            id: from,
            x: node_data[from]['x'] ? node_data[from]['x'] : 0,
            y: node_data[from]['y'] ? node_data[from]['y'] : 0,
            weight: d['weight'],
            timestamp_start: d['timestamp_start'],
            timestamp_end: d['timestamp_end'],
            label: d['label'],
            category: d['category'],
            loop_no: d['loop_no']
          },
          {
            id: to,
            x: node_data[to]['x'] ? node_data[to]['x'] : 0,
            y: node_data[to]['y'] ? node_data[to]['y'] : 0,
          }
        ];
      }
      return [
          {
            id: from,
            x: node_data[from]['x'] ? node_data[from]['x'] : 0,
            y: node_data[from]['y'] ? node_data[from]['y'] : 0,
            weight: d['weight'],
            timestamp_start: d['timestamp_start'],
            timestamp_end: d['timestamp_end'],
            label: d['label'],
            category: d['category']
          },
          {
            id: to,
            x: node_data[to]['x'] ? node_data[to]['x'] : 0,
            y: node_data[to]['y'] ? node_data[to]['y'] : 0,
          }
        ];
    }
    return []
    
  }

  getNodeRender(container:any, node_data:any, nodeclicked:any, type_layer_node:any){
    if(type_layer_node == "stats1_node"){
      return container.append("g").attr("class", "nodes")
      .attr('style', 'pointer-events: all')
      .selectAll("circle")
      .data(Object.values(node_data))
      .enter()
      .append("g")
      .attr("class", "node")
      .style('cursor','pointer')
      .attr('id', (d:any) =>  "node_"+d.node_name)
      .on('click', nodeclicked)
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
        .style("opacity", 0);	 })   
    }else if(type_layer_node == "stats2_node"){
      return container.append("g")
      .attr("class", "nodes")
      .attr('style', 'pointer-events: all')
      .selectAll("circle")
      .data(Object.values(node_data))
      .enter()
      .append("g")
      .attr("class", "node")
      .style('cursor','pointer')
      .attr('id', (d:any) =>  "node_"+d.node_name)
      .on('click', nodeclicked)
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
      })   
    }else{
      return container.append("g").attr("class", "nodes")
      .attr('style', 'pointer-events: all')
      .selectAll("g")
      .data(Object.values(node_data))
      .enter()
      .append("circle")
      .attr("r", 2)
      .attr("class", "node")
      .attr("stroke","black")
      .style('cursor','pointer')
      .style("fill", "#a3c5f7") 
      .attr('id', (d:any) =>  "node_"+d.id)
      .on('click', nodeclicked)
      .on("mouseover", function(d:any) {	
        $(d3.event.target).attr("r", 30)
        tooltip_div.transition()		
        .duration(200)		
        .style("opacity", .9);		 tooltip_div.html(d.id)	
        .style("left", (d3.event.pageX + 10) + "px")		
        .style("top", (d3.event.pageY - 35) + "px");	 })					
      .on("mouseout", function(d:any) {
        $(d3.event.target).attr("r", 2)
        
        tooltip_div.transition()		
        .duration(500)		
        .style("opacity", 0);	 })   
    }
       
    }

    getEdgeRender(type_layer:any, container:any, _data:any, resultsEdgeData:any, perfectEdgeData:any, categories_colors:any, d3line:any, edgeclicked:any, options:any, myWidth:any, mycolor:any){
        if(type_layer == "normal"){
            return container.append("g").attr("class", "edges")
            .attr('stroke', '#999')
            .selectAll(options.selected_layout != "no_layout" ? "path" : "line")
            .data(options.selected_layout != "no_layout" ? resultsEdgeData : perfectEdgeData)
            .enter()
            .append(options.selected_layout != "no_layout" ? "path" : "line")
            .attr("stroke-width", "0.2px")
            .attr("class", function (d:any, i:any) { 
             let category;
               if(!Array.isArray(d)){
                 category = d.category.replaceAll('.','_'); 
               }else{
                 category = d[0].category.replaceAll('.','_'); 
               }
                 
                return "category_link " + category
            })
            .attr('id', function (d:any, i:any) { 
              let sourceNode, targetNode;
                if(!Array.isArray(d)){
                   sourceNode = d.source.id.replaceAll('.','_'); 
                   targetNode = d.target.id.replaceAll('.','_');
                }else{
                 sourceNode = d[0].id.replaceAll('.','_'); 
                 targetNode = d[1].id.replaceAll('.','_');
                }
                  
                 return 'link_' + sourceNode + "-" + targetNode 
             })
            .attr('item_selector', (d:any) => d.label)
            .attr('timestamp', (d:any) => d.timestamp_start + "to" + d.timestamp_end)
            .attr('marker-end', (d:any,i:any) => { return 'url(#arrow_self)'; })
            .style('fill', 'transparent')
            .style('stroke', (d:any)  =>  !Array.isArray(d) ? categories_colors[d['category']] : categories_colors[d[0]['category']])
            .style('pointer-events','visibleStroke')
            .style('cursor','pointer')
            .on('click', edgeclicked)
            .on("mouseover", function(d:any) {	
              let html_string
              $(d3.event.target).attr("stroke-width", "3px")
             if(!Array.isArray(d)){
               // Force Simulation one
               html_string = "<b>At: </b>" + d.source.id + ", <b>at</b> " + moment(d.timestamp_start).format('DD/MM/YYYY hh:mm:ss A') + "<br>" +
                                 "<b>Weight: </b>" + d.weight + "<br>" +
                                 "<b>Category/Sign: </b>" + d.category + "<br>"; 
             } else{
                                 // Array from layouts
               html_string = "<b>At: </b>" + d[0].id + ", <b>at</b> " + moment(d[0].timestamp_start).format('DD/MM/YYYY hh:mm:ss A') + "<br>" +
                                 "<b>Weight: </b>" + d[0].weight + "<br>" +
                                 "<b>Category/Sign: </b>" + d[0].category + "<br>";  
             }    
             tooltip_div.transition()		
             .duration(200)		
             .style("opacity", .9);		 
             tooltip_div.html(html_string)	
             .style("left", (d3.event.pageX + 10) + "px")		
             .style("top", (d3.event.pageY - 35) + "px");  
       
           })					
           .on("mouseout", function(d:any) {		 
               $(d3.event.target).attr("stroke-width", "0.2px")
               tooltip_div.transition()		
                 .duration(500)		
                 .style("opacity", 0);	 
             })
            .attr('d', function(d:any) {
              return d3line(d);
            });
        }

        if(type_layer == "stats1"){
            return container.append("g").attr("class", "edges")
            .attr('stroke', '#999')
            .selectAll(options.selected_layout != "no_layout" ? "path" : "line")
            .data(options.selected_layout != "no_layout" ? resultsEdgeData : perfectEdgeData)
            .enter()
            .append(options.selected_layout != "no_layout" ? "path" : "line")
            //.attr("stroke-width", "0.2px")
            .attr('stroke-width', (d:any) => {
              //console.log("Here id d", d)
              if(!Array.isArray(d)){
                  if(options.avg_weight){
                    return myWidth(d.avg_weight)
                  }
                return myWidth(d.total_weights)
              }else{
                  if(options.avg_weight){
                    return myWidth(d[0].avg_weight)
                  }
                return myWidth(d[0].total_weights)
              }
                
            })
            .attr('class', 'edges')
            .attr('id', function (d:any, i:any) { 
              let sourceNode, targetNode;
                if(!Array.isArray(d)){
                   if(typeof d['source'] == "string"){
                    sourceNode = d.source.replaceAll('.','_'); 
                    targetNode = d.target.replaceAll('.','_');
                   }else{
                    sourceNode = d.source.id.replaceAll('.','_'); 
                    targetNode = d.target.id.replaceAll('.','_');
                   }
                  
                }else{
                 sourceNode = d[0].id.replaceAll('.','_'); 
                 targetNode = d[1].id.replaceAll('.','_');
                }
                  
                 return 'link_' + sourceNode + "-" + targetNode 
             })
            .attr('item_selector', (d:any) => d.label)
            .attr('timestamp', (d:any) => d.timestamp_start + "to" + d.timestamp_end)
            .style('fill', 'transparent')
            //.style('stroke', (d:any)  =>  !Array.isArray(d) ? categories_colors[d['category']] : categories_colors[d[0]['category']])
            .style('stroke', (d:any) => {
              //console.log("Here id d", d)
              //console.log("Stroke", d, d.avg_weight, d.total_weights, mycolor(d.avg_weight), mycolor(d.total_weights))
              if(!Array.isArray(d)){
                if(options.avg_weight){
                  return mycolor(d.avg_weight)
                }
                return mycolor(d.total_weights)
              }else{
                if(options.avg_weight){
                  return mycolor(d[0].avg_weight)
                }
                return mycolor(d[0].total_weights)
              }
                
            })
            .style('pointer-events','visibleStroke')
            .style('cursor','pointer')
            .on('click', edgeclicked)
            .on("mouseover", function(d:any) {	
              /** let html_string
              $(d3.event.target).attr("stroke-width", "3px")
             if(!Array.isArray(d)){
               // Force Simulation one
               html_string = "<b>At: </b>" + d.source.id + ", <b>at</b> " + moment(d.timestamp_start).format('DD/MM/YYYY hh:mm:ss A') + "<br>" +
                                 "<b>Weight: </b>" + d.weight + "<br>" +
                                 "<b>Category/Sign: </b>" + d.category + "<br>"; 
             } else{
                                 // Array from layouts
               html_string = "<b>At: </b>" + d[0].id + ", <b>at</b> " + moment(d[0].timestamp_start).format('DD/MM/YYYY hh:mm:ss A') + "<br>" +
                                 "<b>Weight: </b>" + d[0].weight + "<br>" +
                                 "<b>Category/Sign: </b>" + d[0].category + "<br>";  
             }    
             tooltip_div.transition()		
             .duration(200)		
             .style("opacity", .9);		 
             tooltip_div.html(html_string)	
             .style("left", (d3.event.pageX + 10) + "px")		
             .style("top", (d3.event.pageY - 35) + "px");  */
       
           })					
           .on("mouseout", function(d:any) {		 
               /** $(d3.event.target).attr("stroke-width", "0.2px")
               tooltip_div.transition()		
                 .duration(500)		
                 .style("opacity", 0);*/	 
             })
            .attr('d', function(d:any) {
              return d3line(d);
            });
        }

        if(type_layer == "structure1"){
          return container.append("g").attr("class", "edges")
          .attr('stroke', mycolor)
          .selectAll(options.selected_layout != "no_layout" ? "path" : "line")
          .data(options.selected_layout != "no_layout" ? resultsEdgeData : perfectEdgeData)
          .enter()
          .append(options.selected_layout != "no_layout" ? "path" : "line")
          .attr("stroke-width", myWidth)
          .attr("class", function (d:any, i:any) { 
            //console.log("class ", d)
           let category;
             if(!Array.isArray(d)){
               category = d.category.replaceAll('.','_'); 
             }else{
               category = d[0].category.replaceAll('.','_'); 
             }
               
              return "category_link " + category
          })
          .attr('id', function (d:any, i:any) { 
            let sourceNode, targetNode;
              if(!Array.isArray(d)){
                 sourceNode = d.source.id.replaceAll('.','_'); 
                 targetNode = d.target.id.replaceAll('.','_');
              }else{
               sourceNode = d[0].id.replaceAll('.','_'); 
               targetNode = d[1].id.replaceAll('.','_');
              }
                
               return 'link_' + sourceNode + "-" + targetNode 
           })
          .attr('item_selector', (d:any) => d.label)
          .attr('loop_no', (d:any) => d['loop_no'] ? d['loop_no'] : null) // Adding Conditional Loop Number
          .attr('timestamp', (d:any) => d.timestamp_start + "to" + d.timestamp_end)
          .attr('marker-end', (d:any,i:any) => { return 'url(#arrow_self)'; })
          .style('fill', 'transparent')
          .style('stroke', mycolor)
          .style('pointer-events','visibleStroke')
          .style('cursor','pointer')
          .on('click', edgeclicked)
          .on("mouseover", function(d:any) {	
            let html_string
            //$(d3.event.target).attr("stroke-width", "3px")
           if(!Array.isArray(d)){
             // Force Simulation one
             html_string = "<b>At: </b>" + d.source.id + ", <b>at</b> " + moment(d.timestamp_start).format('DD/MM/YYYY hh:mm:ss A') + "<br>" +
                               "<b>Weight: </b>" + d.weight + "<br>" +
                               "<b>Category/Sign: </b>" + d.category + "<br>" +
                               (d['loop_no'] || d['loop_no'] == 0  ? ("<b>Loop Number: </b>" + d.loop_no + "<br>") : "");
           } else{
                               // Array from layouts
             html_string = "<b>At: </b>" + d[0].id + ", <b>at</b> " + moment(d[0].timestamp_start).format('DD/MM/YYYY hh:mm:ss A') + "<br>" +
                               "<b>Weight: </b>" + d[0].weight + "<br>" +
                               "<b>Category/Sign: </b>" + d[0].category + "<br>" +
                               (d[0]['loop_no'] || d[0]['loop_no'] == 0  ? ("<b>Loop Number: </b>" + d[0].loop_no + "<br>") : "");
           }    
           tooltip_div.transition()		
           .duration(200)		
           .style("opacity", .9);		 
           tooltip_div.html(html_string)	
           .style("left", (d3.event.pageX + 10) + "px")		
           .style("top", (d3.event.pageY - 35) + "px");  
     
         })					
         .on("mouseout", function(d:any) {		 
             //$(d3.event.target).attr("stroke-width", "0.2px")
             tooltip_div.transition()		
               .duration(500)		
               .style("opacity", 0);	 
           })
          .attr('d', function(d:any) {
            return d3line(d);
          });
        }
    }

    
}

