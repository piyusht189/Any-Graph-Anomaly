import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { HttpClient } from '@angular/common/http';
declare const $: any;

@Injectable({
  providedIn: 'root'
})
export class EdgeAnomalyServices {
  static avg_edges: any = []
  static loop_edges: any = []
  static breaked_edges: any = []
  constructor(private http: HttpClient) { }

  public avg_edge(edges:any){

    let mapper:any = {};
    edges.forEach((edge:any,index:any) => {

          //Time differece calculation
          let duration = moment.duration(moment(edge.timestamp_end).diff(moment(edge.timestamp_start)));
          let minutes = duration.asMinutes();
          if(!(mapper[edge.from + 'to' + edge.to] || mapper[edge.to + 'to' + edge.from])){
           
            //If any of bidirection does not exist
            mapper[edge.from + 'to' + edge.to] = {"avg_minutes": parseFloat(minutes.toFixed(2)),
                                                  "total_minutes": parseFloat(minutes.toFixed(2)),
                                                  "avg_text": "",
                                                  "avg_weights": parseFloat((+edge.weight).toFixed(2)),
                                                  "total_weights": parseFloat((+edge.weight).toFixed(2)),
                                                  "name": edge.from + 'to' + edge.to,
                                                  "edges": [edge]}
          }else{
            if(mapper[edge.from + 'to' + edge.to]){
              //mapper[edge.from + 'to' + edge.to]['avg_minutes'] = parseFloat(((mapper[edge.from + 'to' + edge.to]['avg_minutes'] + minutes)/(mapper[edge.from + 'to' + edge.to]['edges'].length+1)).toFixed(2)); 

              mapper[edge.from + 'to' + edge.to]['avg_minutes'] = parseFloat((((mapper[edge.from + 'to' + edge.to]['avg_minutes'] * mapper[edge.from + 'to' + edge.to]['edges'].length) + minutes) / (mapper[edge.from + 'to' + edge.to]['edges'].length+1)).toFixed(2)); 

              mapper[edge.from + 'to' + edge.to]['total_minutes'] = parseFloat((mapper[edge.from + 'to' + edge.to]['total_minutes'] +  minutes).toFixed(2)); 

             // mapper[edge.from + 'to' + edge.to]['avg_weights'] = ((mapper[edge.from + 'to' + edge.to]['avg_weights'] + +edge.weight)/(mapper[edge.from + 'to' + edge.to]['edges'].length+1)).toFixed(2); 

              mapper[edge.from + 'to' + edge.to]['avg_weights'] = parseFloat((((mapper[edge.from + 'to' + edge.to]['avg_weights'] * mapper[edge.from + 'to' + edge.to]['edges'].length) + +edge.weight)/(mapper[edge.from + 'to' + edge.to]['edges'].length+1)).toFixed(2)); 

              mapper[edge.from + 'to' + edge.to]['total_weights'] = parseFloat((mapper[edge.from + 'to' + edge.to]['total_weights'] + +edge.weight).toFixed(2)); 

              mapper[edge.from + 'to' + edge.to]['edges'].push(edge);
            }else{ 
              //mapper[edge.to + 'to' + edge.from]['avg_minutes'] = parseFloat(((mapper[edge.to + 'to' + edge.from]['avg_minutes'] + minutes)/(mapper[edge.to + 'to' + edge.from]['edges'].length+1)).toFixed(2)); 

              mapper[edge.to + 'to' + edge.from]['avg_minutes'] = parseFloat((((mapper[edge.to + 'to' + edge.from]['avg_minutes'] * mapper[edge.to + 'to' + edge.from]['edges'].length) + minutes) / (mapper[edge.to + 'to' + edge.from]['edges'].length+1)).toFixed(2)); 

              mapper[edge.to + 'to' + edge.from]['total_minutes'] = parseFloat((mapper[edge.to + 'to' + edge.from]['total_minutes'] + minutes).toFixed(2)); 

              //mapper[edge.to + 'to' + edge.from]['avg_weights'] = ((mapper[edge.to + 'to' + edge.from]['avg_weights'] + +edge.weight)/(mapper[edge.to + 'to' + edge.from]['edges'].length+1)).toFixed(2);
              
              mapper[edge.to + 'to' + edge.from]['avg_weights'] = parseFloat((((mapper[edge.to + 'to' + edge.from]['avg_weights'] * mapper[edge.to + 'to' + edge.from]['edges'].length) + +edge.weight)/(mapper[edge.to + 'to' + edge.from]['edges'].length+1)).toFixed(2));

              mapper[edge.to + 'to' + edge.from]['total_weights'] = parseFloat((mapper[edge.to + 'to' + edge.from]['total_weights'] + +edge.weight).toFixed(2));

              mapper[edge.to + 'to' + edge.from]['edges'].push(edge);
            }
           
          
          }
            
      });
      EdgeAnomalyServices.avg_edges = mapper;
      return Object.values(mapper);
  }


  public avg_edge_category(edges:any){

    let mapper:any = {};
    edges.forEach((edge:any,index:any) => {

          if(!(mapper[edge.from + 'to' + edge.to] || mapper[edge.to + 'to' + edge.from])){
           
            //If any of bidirection does not exist
            mapper[edge.from + 'to' + edge.to] = {"avg_text": "",
                                                  "avg_weights": parseFloat((+edge.weight).toFixed(2)),
                                                  "total_weights": parseFloat((+edge.weight).toFixed(2)),
                                                  "name": edge.from + 'to' + edge.to,
                                                  "edges": [edge]}
          }else{
            if(mapper[edge.from + 'to' + edge.to]){
              
              mapper[edge.from + 'to' + edge.to]['avg_weights'] = parseFloat((((mapper[edge.from + 'to' + edge.to]['avg_weights'] * mapper[edge.from + 'to' + edge.to]['edges'].length) + +edge.weight)/(mapper[edge.from + 'to' + edge.to]['edges'].length+1)).toFixed(2)); 

              mapper[edge.from + 'to' + edge.to]['total_weights'] = parseFloat((mapper[edge.from + 'to' + edge.to]['total_weights'] + +edge.weight).toFixed(2)); 

              mapper[edge.from + 'to' + edge.to]['edges'].push(edge);
            }else{ 
              //mapper[edge.to + 'to' + edge.from]['avg_minutes'] = parseFloat(((mapper[edge.to + 'to' + edge.from]['avg_minutes'] + minutes)/(mapper[edge.to + 'to' + edge.from]['edges'].length+1)).toFixed(2)); 

              
              mapper[edge.to + 'to' + edge.from]['avg_weights'] = parseFloat((((mapper[edge.to + 'to' + edge.from]['avg_weights'] * mapper[edge.to + 'to' + edge.from]['edges'].length) + +edge.weight)/(mapper[edge.to + 'to' + edge.from]['edges'].length+1)).toFixed(2));

              mapper[edge.to + 'to' + edge.from]['total_weights'] = parseFloat((mapper[edge.to + 'to' + edge.from]['total_weights'] + +edge.weight).toFixed(2));

              mapper[edge.to + 'to' + edge.from]['edges'].push(edge);
            }
           
          
          }
            
      });
      EdgeAnomalyServices.avg_edges = mapper;
      return Object.values(mapper);
  }


  public mismatch_breakage_loop_edge(edges:any){
    let mapper:any = {};
    let loop_edges:any = {};
    let breaked_edges: any = [];
    edges.forEach((edge:any,index:any) => {
          if(!(mapper[edge.label])){
            mapper[edge.label] = [edge]
          }else{
            mapper[edge.label].push(edge);            
          }             
    });
    
    Object.keys(mapper).forEach(key => {
        if(mapper[key]){
          if(mapper[key].length > 1){
            if(moment(mapper[key][0]['startTime']).isAfter(moment(moment(mapper[key][1]['startTime'])))){
              mapper[key] = mapper[key].reverse()
            }
          }
          
          

          let traversals:any = []
          mapper[key].forEach((label_paths: any, index: any) => {
              // Per Label Loop 
              if(index == 0){
                traversals.push({identifier: label_paths.identifier, node: label_paths.from, edge: label_paths, from:  true })
                traversals.push({identifier: label_paths.identifier, node: label_paths.to, edge: label_paths, to: true  })
              }else{
                if(traversals[traversals.length - 1]['node'] != label_paths.from){
                  // Path Breakage or mismatch do something for mimatch
                  breaked_edges.push(label_paths);
                  //traversals.push({identifier: label_paths.identifier, node: label_paths.from })
                  //traversals.push({identifier: label_paths.identifier, node: label_paths.to })
                }else{
                  traversals.push({identifier: label_paths.identifier, node: label_paths.to, edge: label_paths, to: true })
                }
              }
          });
          //debugger;
          traversals.forEach((path:any, index:any) => {
              if(index > 1){
                let mut_traversals = JSON.parse(JSON.stringify(traversals));
                let before_paths_reversed = mut_traversals.slice(0, index).reverse();
                before_paths_reversed.every((inner_path: any, inner_index: any) => {
                     if(path['node'] == inner_path['node']){
                       let mut_traversals = JSON.parse(JSON.stringify(traversals));
                       let loop = mut_traversals.slice(before_paths_reversed.length - inner_index  - 1, index + 1)
                       if(loop_edges[key]){
                        loop_edges[key].push(loop.filter((e: any, i:any) => { 
                          if(i == 0){
                            return e['from']
                          }
                          return e['to'] 
                        }).map((e:any)=> e['edge']));
                       }else{
                        loop_edges[key] = [loop.filter((e: any, i:any) => { 
                          if(i == 0){
                            return e['from']
                          }
                          return e['to'] 
                        }).map((e:any)=> e['edge'])]
                       }
                       return false;
                     }
                     return true;
                });
              }
          });


          
        }
      })
      EdgeAnomalyServices.breaked_edges = breaked_edges
      EdgeAnomalyServices.loop_edges = loop_edges

      // Merging all loop paths, also adding loop number to each edge to show in tooltip and highlight
      let loop_edges_all:any = [];
      Object.keys(loop_edges).forEach((key) => {
        loop_edges[key].forEach((loopy_edges: any, index: any) => {
          loopy_edges = loopy_edges.forEach((e:any) => {
            e['loop_no'] = index + 1;
            loop_edges_all.push(e);
          })
          
        });
      })

      return {"breaked_edges": breaked_edges, "loops": loop_edges_all};
  }

  

}
