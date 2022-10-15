import { Injectable } from '@angular/core';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class NodeAnomalyServices {
  static avg_nodes: any = []
  static top_5_labels:any = {}
  constructor() { }

  public avg_node(edges:any){
    let mapper:any = {};
    edges.forEach((edge:any,index:any) => {

        // Outgoing Edges Calculations
        if(!mapper[edge.from]){
          mapper[edge.from] = {outgoing: 1, incoming: 0, node: edge.from, edges: [edge], outgoing_weights: edge.weight, incoming_weights: 0};
          if(edge['from_location']){
            mapper[edge.from]['node_location'] = edge.from_location
          }
        }else{
          mapper[edge.from]['outgoing'] = mapper[edge.from]['outgoing'] + 1;
          mapper[edge.from]['outgoing_weights'] = mapper[edge.from]['outgoing_weights'] + edge.weight;
          mapper[edge.from]['edges'].push(edge);
        }

        // Incoming Edges Calculations
        if(!mapper[edge.to]){
          mapper[edge.to] = {outgoing: 0, incoming: 1 , node: edge.to,  edges: [edge], outgoing_weights: 0, incoming_weights: edge.weight};
          if(edge['to_location']){
            mapper[edge.to]['node_location'] = edge.to_location
          }
        }else{
          mapper[edge.to]['incoming'] = mapper[edge.to]['incoming'] + 1;
          mapper[edge.to]['incoming_weights'] = mapper[edge.to]['incoming_weights'] + edge.weight;
          mapper[edge.to]['edges'].push(edge);
        }            
      });


      let result = Object.values(mapper).map((e:any) => {
        let total_duration:any = 0;
        let avg_duration:any = 0;
        let avg_counter= 1;



        // For each node
        // Reducing the dimensions based on the labels (users, or any single ttraversing element)
        let group_by_user = e['edges'].reduce(function (r:any, a:any) {
          r[a.label] = r[a.label] || [];
          r[a.label].push(a);
          return r;
          
         }, Object.create(null))

         

         if(group_by_user){
          // Filtering the users having less than 1 connections
          //@ts-ignore
          Object.keys(group_by_user).forEach((a:any) => {
            if(group_by_user[a].length < 2){
              delete group_by_user[a]
            }
          })

         


          // Loooping the edges for each label
          Object.keys(group_by_user).forEach((key: any) => {
            //debugger;
            // Sorting the edges based on each label
            group_by_user[key]  =  group_by_user[key].sort((a:any, b:any) => {
                //Time differece calculation
                return moment.duration(moment(a.to == key ? a.timestamp_end : a.timestamp_start) .diff(moment(a.to == key ? b.timestamp_end : b.timestamp_start))).asMilliseconds();
            });


            // Calculating times and average time 
            let enable_from = false;
            let pair:any = [];
            
            group_by_user[key].forEach((e1:any) => {
                  //debugger;
                  if(e1.to == e.node && !enable_from){
                    //debugger;
                    enable_from = true;
                    pair = [e1.timestamp_end];
                  }else if(e1.from == e.node && enable_from){
                    //debugger;
                    enable_from = false;
                    pair.push(e.timestamp_start);
                    if(pair.length == 2){
                       total_duration = parseFloat((total_duration + +moment.duration(moment(pair[1]).diff(moment(pair[0]))).asMinutes()).toFixed(2));
                       avg_duration = parseFloat((((avg_duration * avg_counter) + +moment.duration(moment(pair[1]).diff(moment(pair[0]))).asMinutes()) / (avg_counter+1)).toFixed(2));
                       avg_counter = avg_counter + 1;
                    }
                  }
            });
            avg_counter = 0;


          })
         }


         ////console.log("group_by_users", group_by_user);
          
         e['avg_duration'] = avg_duration; // In Minutes 
         e['total_duration'] = total_duration; // In  Minutes
         e['']
         return e;
      
      })
      let object_result:any = {};
      result.forEach(e => {
        object_result[e['node']] = e;
      })
      NodeAnomalyServices.avg_nodes = object_result;
      //console.log(result)
      return result;
  }


  public avg_node_category(edges:any){
    let mapper:any = {};
    edges.forEach((edge:any,index:any) => {

        // Outgoing Edges Calculations
        if(!mapper[edge.from]){
          mapper[edge.from] = {outgoing: 1, incoming: 0, node: edge.from, edges: [edge], outgoing_weights: edge.weight, incoming_weights: 0};
        }else{
          mapper[edge.from]['outgoing'] = mapper[edge.from]['outgoing'] + 1;
          mapper[edge.from]['outgoing_weights'] = mapper[edge.from]['outgoing_weights'] + edge.weight;
          mapper[edge.from]['edges'].push(edge);
        }

        // Incoming Edges Calculations
        if(!mapper[edge.to]){
          mapper[edge.to] = {outgoing: 0, incoming: 1 , node: edge.to,  edges: [edge], outgoing_weights: 0, incoming_weights: edge.weight};
        }else{
          mapper[edge.to]['incoming'] = mapper[edge.to]['incoming'] + 1;
          mapper[edge.to]['incoming_weights'] = mapper[edge.to]['incoming_weights'] + edge.weight;
          mapper[edge.to]['edges'].push(edge);
        }            
      });


      let result = Object.values(mapper);
      let object_result:any = {};
      result.forEach((e:any) => {
        object_result[e['node']] = e;
      })
      NodeAnomalyServices.avg_nodes = object_result;
      //console.log("Node Average Category", result)
      return result;
  }




  public top_5_node(edges:any){
    let node_edges_mapper:any = {}

    // Taking nodes from edges for now to reduce the "Node not found" error which will be handled in the future
    let all_nodes  = [...new Set(edges.map((e:any) => e['from']).concat(edges.map((e:any) => e['to'])))]
    
    // Grouping edges based on the nodes
    all_nodes.forEach((node:any)  => {
      let node_location:any = null
      let temp_edges = edges.filter((e:any) => {
        if(e['from'] == node && !node_location){
          node_location = e['from_location'];
        }
        if(e['to'] == node && !node_location){
          node_location = e['to_location'];
        }
        return e['from'] == node || e['to'] == node
      })
      node_edges_mapper[node] = {node_location: node_location, edges: temp_edges}
    })

    // GroupBy function  which groups the json array based on json object's value
    let groupBy = (array:any, key:any) => {
      return array.reduce(function(rv:any, x:any) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    };

   
    // Grouping the labels/entities and summing the weights
    Object.keys(node_edges_mapper).forEach((node) => {

      // Grouping the edges based on labels/entity
      node_edges_mapper[node]['edges'] = groupBy(node_edges_mapper[node]['edges'], 'label');

      // Summing up the weights per label/entity
      Object.keys(node_edges_mapper[node]['edges']).forEach((label: any) => {
        let sum = 0;
          for (let edge of node_edges_mapper[node]['edges'][label]) {
            sum += +edge['weight'];
          }
        node_edges_mapper[node]['edges'][label] = sum;
      })
      

      // Converting Object of labels/entities to Arrays for each node and sorting them
      let ranked_array = Object.keys(node_edges_mapper[node]['edges'])
                          .map((key:any) => { return {label: key, weight: node_edges_mapper[node]['edges'][key]} })
                          .sort((a: any, b:any) => b.weight - a.weight) // Sorting based on the weights
      
      
      //Showing top 4 label/weights but rest as others
        if(ranked_array.length > 4){
          
            let other_weigths = {label: 'Others', weight: 0}
            let other_sums = 0
            let mut_ranked_array = JSON.parse(JSON.stringify(ranked_array));
            
            mut_ranked_array.slice(4, mut_ranked_array.length).forEach((e:any) => {
              other_sums = other_sums + e.weight
            })
            other_weigths.weight = other_sums
            
            ranked_array = ranked_array.slice(0,4)
            if(other_weigths.weight){
              ranked_array.push(other_weigths)
            }
            
        }

        node_edges_mapper[node]['edges'] = ranked_array
        node_edges_mapper[node]['node'] = node
    })
    NodeAnomalyServices.top_5_labels = node_edges_mapper;
    //console.log(Object.values(node_edges_mapper))
    return Object.values(node_edges_mapper);
  }

 
}

/*
endTime: "2010-06-06T14:16:18Z"
from: "30.0y-98.0"
identifier: "30.0y-98.0to33.0y-97.0"
label: "0"
startTime: "2010-06-05T22:46:27Z"
timestamp_end: "2010-06-06T14:16:18Z"
timestamp_start: "2010-06-05T22:46:27Z"
to: "33.0y-97.0"
weight: 1
*/