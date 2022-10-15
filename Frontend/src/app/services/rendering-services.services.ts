import { Injectable } from '@angular/core';
import { EdgeAnomalyServices } from './edge-anomaly-services.service';
import { HttpClient } from '@angular/common/http';
import { NodeAnomalyServices } from './node-anomaly-services.service';
declare const $: any;
declare const d3: any;
declare const c3: any;


@Injectable({
  providedIn: 'root'
})
export class RenderingServicesService {
  edges_holder = []
  nodes_edges_holder = []
  constructor(private http: HttpClient) { 

  }

  renderKPIs(data:any){
        // Calculating KPIs
        let total_nodes = data['nodes'] ? data.nodes.length : 0;
        let total_edges = data['edges'] ? data.edges.length : 0;
        let total_elements = data['edges'] ? [...new Set(data.edges.map((e:any) => e['label']))].length: 0;

        // Rendering KPIs
        $('#kpi_total_nodes').html(total_nodes);
        $('#kpi_total_edges').html(total_edges);
        $('#kpi_total_elements').html(total_elements);
       
  }
  renderTimeline(analytics:any){
   // $('#timeline').html("");
    //console.log("Analytics", analytics)
    let processed_data:any = [];
    Object.keys(analytics).forEach((key:any) => {
      let processed_labels:any = [];
      // Converting Label wise weights objects to array
      Object.keys(analytics[key]["label_weights"]).forEach((label:any) => {
        processed_labels.push({"label": label, "weights": analytics[key]["label_weights"][label]})
      })
      // Sorting the labels based on their weights
      processed_labels = processed_labels.sort((a:any, b:any) => {
        return +b['weights'] - +a['weights']
      })
      let other_weights = 0;
      // Aggregating rank 4 + weights together to "others" tab
      processed_labels.forEach((label_row:any, index:any) => {
            if(index > 2){
              other_weights = other_weights + +label_row['weights']
            }
      });
      processed_labels = processed_labels.slice(0, 3)
      analytics[key]["#1 Weights"]= processed_labels[0] ? processed_labels[0]['weights'] : 0
      analytics[key]["#2 Weights"]= processed_labels[1] ? processed_labels[1]['weights'] : 0
      analytics[key]["#3 Weights"]= processed_labels[2] ? processed_labels[2]['weights'] : 0

      analytics[key]["#1 Weights Label"]= processed_labels[0] ? processed_labels[0]['label'] : 'NA'
      analytics[key]["#2 Weights Label"]= processed_labels[1] ? processed_labels[1]['label'] : 'NA'
      analytics[key]["#3 Weights Label"]= processed_labels[2] ? processed_labels[2]['label'] : 'NA'


      analytics[key]["Other Weights"]= other_weights
      analytics[key]["x_axis"] = key;
      delete analytics[key]["label_weights"]
      processed_data.push(analytics[key])
    })
    //console.log("Processed  Analytics", processed_data)
    var chart = c3.generate({
      size: {
        height: $('#timelinediv').height()
      },
      zoom: {
        enabled: true
      },
      data: {
        x: 'x',
        xFormat: '%Y-%m-%d %H:%M:%S',
        hide: ['Total Incoming Duration', 'Total Outgoing Duration'],
        columns: [
      ['x'].concat(processed_data.map((e:any) => e.x_axis)),
      ["Total Incoming Edges"].concat(processed_data.map((e:any) => e.incoming)),
      ["Total Outgoing Edges"].concat(processed_data.map((e:any) => e.outgoing)),
      ["Total Incoming Duration"].concat(processed_data.map((e:any) => e.total_duration_incoming ? (e.total_duration_incoming/60).toFixed(2) : 0)),
      ["Total Outgoing Duration"].concat(processed_data.map((e:any) => e.total_duration_outgoing ? (e.total_duration_outgoing/60).toFixed(2) : 0)),
      ["Total Edges"].concat(processed_data.map((e:any) => e.total_edges)),
      ["Total Weights"].concat(processed_data.map((e:any) => e.total_weights)),
      ["#1 Weights"].concat(processed_data.map((e:any) => e['#1 Weights'])),
      ["#2 Weights"].concat(processed_data.map((e:any) => e['#2 Weights'])),
      ["#3 Weights"].concat(processed_data.map((e:any) => e['#3 Weights'])),
      ["Other Weights"].concat(processed_data.map((e:any) => e["Other Weights"]))
         ],
        type: "bar", // for ESM specify as: bar()
        types: {
          "Total Incoming Edges": "bar", 
          "Total Outgoing Edges": "bar", 
          "Total Incoming Duration": "line", 
          "Total Outgoing Duration": "line", 
          "Total Edges": "scatter",
          "Total Weights": "scatter",
          "#1 Weights": "bar",
          "#2 Weights": "bar",
          "#3 Weights": "bar",
          "Other Weights": "bar",

        },
        axes: {
          "Total Edges": 'y',
          "Total Incoming Edges": 'y',
          "Total Outgoing Edges": 'y',
          "Total Incoming Duration": 'y2',
          "Total Outgoing Duration": 'y2',
          "Total Weights": 'y2',
          "#1 Weights": 'y2',
          "#2 Weights": 'y2',
          "#3 Weights": 'y2',
          "Other Weights": 'y2',
        },
        groups: [
          [
            "#1 Weights",
            "#2 Weights",
            "#3 Weights",
            "Other Weights"
          ],
          [
            "Total Incoming Edges",
            "Total Outgoing Edges"
          ],
          [
            "Total Incoming Duration",
            "Total Outgoing Duration"
          ]        
        ]
      },
      axis: {
        x: {
            label: 'Timeline',
            type: 'timeseries',
            tick: {
                format: '%Y-%m-%d %H:%M:%S'
            }
        },
        y: {
          show: true,
          label: 'Number of Edges',
        },
        y2: {
          show: true,
          label: 'Total Weights/Duration',
        }
       },
      subchart: {
        show: true, // for ESM specify as: subchart()
        showHandle: true,
        size: {
          height: 25
        }
      },
      tooltip: {
        format: {
            name: function (value:any, ratio:any, id:any, index:any) { 
              if(value == "#1 Weights"){
                  return "#1 Element: " + processed_data[index]['#1 Weights Label']
              }
              if(value == "#2 Weights"){
                return "#2 Element: " + processed_data[index]['#2 Weights Label']
            }
            if(value == "#3 Weights"){
              return "#3 Element: " + processed_data[index]['#3 Weights Label']
            }  
              return value; 
          },
          value: function (value:any, ratio:any, id:any, index:any) { 
            if(id == "Total Incoming Duration" || id == "Total Outgoing Duration"){
              return value + " Minutes"
            }
            return value; 
        }
        }
     },
      bindto: "#combinationChart"
    });   
  }




  public show_edge_details(edge:any, interval: any){
    if(edge){
      this.edges_holder = edge;
    }else{
      edge = this.edges_holder;
    }
    let edge_source = Array.isArray(edge) ? edge[0]['id'] : (typeof(edge.source) == 'object' ? edge.source.id : edge.source)
    let edge_target = Array.isArray(edge) ? edge[1]['id'] : (typeof(edge.target) == 'object' ? edge.target.id : edge.target)

    let all_specific_edge = EdgeAnomalyServices.avg_edges[edge_source + "to" + edge_target] ? EdgeAnomalyServices.avg_edges[edge_source + "to" + edge_target] : EdgeAnomalyServices.avg_edges[edge_target + "to" + edge_source];


    console.log("All Specific Link",all_specific_edge, edge_source, edge_target)


    if(all_specific_edge && all_specific_edge != undefined){
     //console.log("Selected all specific edges", all_specific_edge);
     $('.clicked_edge_name').html(all_specific_edge.name);
    
     if(all_specific_edge['avg_minutes']){
      $(".kpi_edge_avg_duration").show()
      $('#kpi_edge_avg_duration').html(all_specific_edge.avg_minutes + " Mins");
     }else{
      $(".kpi_edge_avg_duration").hide()
     }
     
     
     $('#kpi_edge_avg_weight').html(all_specific_edge.avg_weights);
     $('#kpi_edge_total_edges').html(all_specific_edge.edges.length);

     if(all_specific_edge.edges.length){
       let isNonLocation = false
       if(Array.isArray(edge)){
          isNonLocation = true
           
       }
       //@ts-ignore
       if(typeof(edge['source']) == 'object'){
        isNonLocation = true
       }
       
       this.http.post('http://localhost:5000/select_edge?interval=' + interval + "&is_non_location=" + isNonLocation, {edges: all_specific_edge.edges}).subscribe(
         (response:any) => {
             //console.log("Selected Edges's data: ", response)
             if(response['analytics']){
              this.renderEdgeTimeline(response.analytics)
             }
             
         }
     );
     }else{
       alert("Some issue with this edge!")
     }
    }else{
      $('.clicked_edge_name').html("Invalid Edge!")
    }
    
 }  

 renderEdgeTimeline(analytics:any){
  // $('#timeline').html("");
   //console.log("Analytics", analytics)
   let processed_data:any = [];
   Object.keys(analytics).forEach((key:any) => {
     
     analytics[key]["x_axis"] = key;
     processed_data.push(analytics[key])
   })
   var chart = c3.generate({
     size: {
       height: 400
     },
     zoom: {
       enabled: true
     },
     data: {
       x: 'x',
       xFormat: '%Y-%m-%d %H:%M:%S',
       hide: ['Total Incoming Duration', 'Total Outgoing Duration'],
       columns: [
     ['x'].concat(processed_data.map((e:any) => e.x_axis)),
     ["Total Incoming Edges"].concat(processed_data.map((e:any) => e.incoming)),
     ["Total Outgoing Edges"].concat(processed_data.map((e:any) => e.outgoing)),
     ["Total Incoming Duration"].concat(processed_data.map((e:any) => e.total_duration_incoming ? (e.total_duration_incoming/60).toFixed(2) : 0)),
     ["Total Outgoing Duration"].concat(processed_data.map((e:any) => e.total_duration_outgoing ? (e.total_duration_outgoing/60).toFixed(2) : 0)),
     ["Total Edges"].concat(processed_data.map((e:any) => e.total_edges)),
     ["Total Weights"].concat(processed_data.map((e:any) => e.total_weights)),
        ],
       type: "bar", // for ESM specify as: bar()
       types: {
         "Total Incoming Edges": "bar", 
         "Total Outgoing Edges": "bar", 
         "Total Incoming Duration": "line", 
         "Total Outgoing Duration": "line", 
         "Total Edges": "scatter",
         "Total Weights": "scatter",
       },
       axes: {
         "Total Edges": 'y',
         "Total Incoming Edges": 'y',
         "Total Outgoing Edges": 'y',
         "Total Incoming Duration": 'y2',
         "Total Outgoing Duration": 'y2',
         "Total Weights": 'y2'
       },
       groups: [
         [
           "Total Incoming Edges",
           "Total Outgoing Edges"
         ],
         [
           "Total Incoming Duration",
           "Total Outgoing Duration"
         ]        
       ]
     },
     axis: {
       x: {
           label: 'Timeline',
           type: 'timeseries',
           tick: {
               format: '%Y-%m-%d %H:%M:%S'
           }
       },
       y: {
         show: true,
         label: 'Number of Edges',
       },
       y2: {
         show: true,
         label: 'Total Weights/Duration',
       }
      },
     subchart: {
       show: true, // for ESM specify as: subchart()
       showHandle: true,
       size: {
         height: 40
       }
     },
     tooltip: {
       format: {
         value: function (value:any, ratio:any, id:any, index:any) { 
           if(id == "Total Incoming Duration" || id == "Total Outgoing Duration"){
             return value + " Minutes"
           }
           return value; 
       }
       }
    },
     bindto: "#edgeCombinationChart"
   });   
 }



 public show_node_details(nodes_edge:any, interval:any){
  if(nodes_edge){
    this.nodes_edges_holder = nodes_edge;
  }else{
    nodes_edge = this.nodes_edges_holder;
  }
  let node_links = NodeAnomalyServices.avg_nodes[(nodes_edge['node_name'] ? nodes_edge['node_name'] : nodes_edge['node'])] ? NodeAnomalyServices.avg_nodes[(nodes_edge['node_name'] ? nodes_edge['node_name'] : nodes_edge['node'])] : null;
  
  if(node_links && node_links != undefined){
    ////console.log("node_links", node_links);
    $('.clicked_node_name').html(node_links.node);
    //avg_duration: 4615636.01
    //edges: (6) [{…}, {…}, {…}, {…}, {…}, {…}]
    //incoming: 3
    //node: "47.0y-122.0"
    //outgoing: 3
    //total_duration: 18462544.03
    if(node_links.avg_duration){
      $('.kpi_node_avg_duration').show();
      $('#kpi_node_avg_duration').html(node_links.avg_duration + " Mins");
    }else{
      $('.kpi_node_avg_duration').hide();
    }
    
    $('#kpi_node_incoming').html(node_links.incoming);
    $('#kpi_edge_outgoing').html(node_links.edges.length);
    
    if(node_links.edges.length){
      this.http.post('http://localhost:5000/select_node?interval=' + interval, {edges: node_links.edges, node: node_links.node}).subscribe(
        (response:any) => {
            
            //console.log("Selected Nodes's Edge data: ", response)
            if(response['analytics']){
             this.renderNodeTimeline(response.analytics)
            }
            
        }
    );
    }else{
      alert("Some issue with this node!")
    }
   }else{
     $('.clicked_edge_name').html("Invalid Node!")
   }
  
} 

renderNodeTimeline(analytics:any){
  // $('#timeline').html("");
  //console.log("Analytics", analytics)
  let processed_data:any = [];
  Object.keys(analytics).forEach((key:any) => {
    let processed_labels:any = [];
    // Converting Label wise weights objects to array
    Object.keys(analytics[key]["label_weights"]).forEach((label:any) => {
      processed_labels.push({"label": label, "weights": analytics[key]["label_weights"][label]})
    })
    // Sorting the labels based on their weights
    processed_labels = processed_labels.sort((a:any, b:any) => {
      return +b['weights'] - +a['weights']
    })
    let other_weights = 0;
    // Aggregating rank 4 + weights together to "others" tab
    processed_labels.forEach((label_row:any, index:any) => {
          if(index > 2){
            other_weights = other_weights + +label_row['weights']
          }
    });
    processed_labels = processed_labels.slice(0, 3)
    analytics[key]["#1 Weights"]= processed_labels[0] ? processed_labels[0]['weights'] : 0
    analytics[key]["#2 Weights"]= processed_labels[1] ? processed_labels[1]['weights'] : 0
    analytics[key]["#3 Weights"]= processed_labels[2] ? processed_labels[2]['weights'] : 0

    analytics[key]["#1 Weights Label"]= processed_labels[0] ? processed_labels[0]['label'] : 'NA'
    analytics[key]["#2 Weights Label"]= processed_labels[1] ? processed_labels[1]['label'] : 'NA'
    analytics[key]["#3 Weights Label"]= processed_labels[2] ? processed_labels[2]['label'] : 'NA'


    analytics[key]["Other Weights"]= other_weights
    analytics[key]["x_axis"] = key;
    delete analytics[key]["label_weights"]
    processed_data.push(analytics[key])
  })
  //console.log("Processed  Analytics", processed_data)
  var chart = c3.generate({
    size: {
      height: 400
    },
    zoom: {
      enabled: true
    },
    data: {
      x: 'x',
      xFormat: '%Y-%m-%d %H:%M:%S',
      hide: ['Total Incoming Duration', 'Total Outgoing Duration'],
      columns: [
    ['x'].concat(processed_data.map((e:any) => e.x_axis)),
    ["Total Incoming Edges"].concat(processed_data.map((e:any) => e.incoming)),
    ["Total Outgoing Edges"].concat(processed_data.map((e:any) => e.outgoing)),
    ["Total Incoming Duration"].concat(processed_data.map((e:any) => e.total_duration_incoming ? (e.total_duration_incoming/60).toFixed(2) : 0)),
    ["Total Outgoing Duration"].concat(processed_data.map((e:any) => e.total_duration_outgoing ? (e.total_duration_outgoing/60).toFixed(2) : 0)),
    ["Total Edges"].concat(processed_data.map((e:any) => e.total_edges)),
    ["Total Weights"].concat(processed_data.map((e:any) => e.total_weights)),
    ["#1 Weights"].concat(processed_data.map((e:any) => e['#1 Weights'])),
    ["#2 Weights"].concat(processed_data.map((e:any) => e['#2 Weights'])),
    ["#3 Weights"].concat(processed_data.map((e:any) => e['#3 Weights'])),
    ["Other Weights"].concat(processed_data.map((e:any) => e["Other Weights"]))
       ],
      type: "bar", // for ESM specify as: bar()
      types: {
        "Total Incoming Edges": "bar", 
        "Total Outgoing Edges": "bar", 
        "Total Incoming Duration": "line", 
        "Total Outgoing Duration": "line", 
        "Total Edges": "scatter",
        "Total Weights": "scatter",
        "#1 Weights": "bar",
        "#2 Weights": "bar",
        "#3 Weights": "bar",
        "Other Weights": "bar",

      },
      axes: {
        "Total Edges": 'y',
        "Total Incoming Edges": 'y',
        "Total Outgoing Edges": 'y',
        "Total Incoming Duration": 'y2',
        "Total Outgoing Duration": 'y2',
        "Total Weights": 'y2',
        "#1 Weights": 'y2',
        "#2 Weights": 'y2',
        "#3 Weights": 'y2',
        "Other Weights": 'y2',
      },
      groups: [
        [
          "#1 Weights",
          "#2 Weights",
          "#3 Weights",
          "Other Weights"
        ],
        [
          "Total Incoming Edges",
          "Total Outgoing Edges"
        ],
        [
          "Total Incoming Duration",
          "Total Outgoing Duration"
        ]        
      ]
    },
    axis: {
      x: {
          label: 'Timeline',
          type: 'timeseries',
          tick: {
              format: '%Y-%m-%d %H:%M:%S'
          }
      },
      y: {
        show: true,
        label: 'Number of Edges',
      },
      y2: {
        show: true,
        label: 'Total Weights/Duration',
      }
     },
    subchart: {
      show: true, // for ESM specify as: subchart()
      showHandle: true,
      size: {
        height: 40
      }
    },
    tooltip: {
      format: {
          name: function (value:any, ratio:any, id:any, index:any) { 
            if(value == "#1 Weights"){
                return "#1 Element: " + processed_data[index]['#1 Weights Label']
            }
            if(value == "#2 Weights"){
              return "#2 Element: " + processed_data[index]['#2 Weights Label']
          }
          if(value == "#3 Weights"){
            return "#3 Element: " + processed_data[index]['#3 Weights Label']
          }  
            return value; 
        },
        value: function (value:any, ratio:any, id:any, index:any) { 
          if(id == "Total Incoming Duration" || id == "Total Outgoing Duration"){
            return value + " Minutes"
          }
          return value; 
      }
      }
   },
    bindto: "#nodeCombinationChart"
  });   
 }

}
