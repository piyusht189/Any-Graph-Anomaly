import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RestServicesService {

  constructor(private http: HttpClient) { }

  getDatabases(){
    return this.http.get('http://localhost:5000/datasets');
  }

  fetchDataset(selected_dataset:any, interval: any){
    return this.http.get('http://localhost:5000/select_dataset?ds=' + selected_dataset + "&interval=" + interval);
  }

  fetchLayout(selected_dataset:any, layout: any){
    return this.http.get('http://localhost:5000/get_layout?ds=' + selected_dataset + "&selectedlayout=" + layout);
  }


  sotaNode(sota:any, weight_sentiment_value: any, analysed_nodes: any, worst_offenders: any){
    return this.http.post('http://localhost:5000/sota_node_analysis', {sota: sota, weight_sentiment_value: weight_sentiment_value, 
    analysed_nodes: analysed_nodes, worst_offenders: worst_offenders});
  }
  sotaEdge(args:any){
    return this.http.post('http://localhost:5000/sota_edge_analysis', args);
  }
}
