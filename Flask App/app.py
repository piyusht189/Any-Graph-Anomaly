from flask import Flask, request, jsonify
import json, os
from flask_cors import CORS
import pandas as pd
import time
import datetime
import re
import networkx as nx
from networkx.readwrite import json_graph
import numpy as np
import pickle
from fa2 import ForceAtlas2
import csv
from analytics import *
from nodeAnalysis import *
from edgeAnalysis import *
from calendar import timegm




app = Flask(__name__)
#CORS Support
CORS(app)

days = {1 : "2019-10-10",
       2 : "2019-10-11",
       3 : "2019-10-12",
       4 : "2019-10-13",
       5 : "2019-10-14"}

intervals = ['1H', '1D', '1W', '15D', '1M', '3M']

min_time = 0

# Preprocessing for Loc Gowalla Dataset
@app.route('/preprocess_locgowalla')
def preprocess_locgowalla():
    filepath = 'RawData/loc-gowalla.txt'
    with open(filepath) as fp:
        line = fp.readline()
        cnt = 1
        nodes = []
        nodes_checker = []
        edges = []
        edges_checker = []

        temp_arr = line.strip().split()
        changing_user = temp_arr[0]

        prev_temp_arr = line.strip().split()
        while line:
            temp_arr = line.strip().split()
            lat = round(float(temp_arr[2]), 0)
            lng = round(float(temp_arr[3]), 0)
            timestamp_start = temp_arr[1]
            #print("Line {}: {}: {}: {}: {}".format(cnt, temp_arr[0], temp_arr[1], lat, lng))
            if (str(lat) + 'y' + str(lng)) not in nodes_checker:
                freqs = {
                    'node': str(lat) + 'y' + str(lng)
                    }
                print("Line {}: {}: {}: {}: {}".format(cnt, temp_arr[0], temp_arr[1], lat, lng))
                nodes_checker.append(str(lat) + 'y' + str(lng))
                nodes.append(freqs)
            
            if changing_user == temp_arr[0]:
                if cnt > 1:
                    prev_lat = round(float(prev_temp_arr[2]), 0)
                    prev_lng = round(float(prev_temp_arr[3]), 0)
                    timestamp_end = prev_temp_arr[1]
                    edge_obj = {
                        'from': str(lat) + 'y' + str(lng),
                        'to': str(prev_lat) + 'y' + str(prev_lng),
                        'startTime': temp_arr[1],
                        'endTime': prev_temp_arr[1],
                        'weight': 1,
                        'label': changing_user,
                        'timestamp_start': timestamp_start,
                        'timestamp_end': timestamp_end
                    }
                    if ((str(lat) + 'y' + str(lng) + str(prev_lat) + 'y' + str(prev_lng)) not in edges_checker) and not (str(lat) == str(prev_lat) and str(lng) == str(prev_lng)):
                        edges_checker.append(str(lat) + 'y' + str(lng) + str(prev_lat) + 'y' + str(prev_lng))
                        edges.append(edge_obj)
            else:
                changing_user = temp_arr[0]
                
            prev_temp_arr = temp_arr
            line = fp.readline()
            cnt += 1
        
        edges_filtered = []
        for edge in edges:
            if edge['from'] != edge['to']:
                edges_filtered.append(edge)
        
        # Creating Metadata
        metadata = {"graph_type": 'weight', "geograph": True, "duration_traversal": True}

        if not os.path.exists('ProcessedData/loc-gowalla'):
            os.mkdir('ProcessedData/loc-gowalla')
        with open('ProcessedData/loc-gowalla/nodes.json', 'w') as f:
            json.dump(nodes, f)
        with open('ProcessedData/loc-gowalla/edges.json', 'w') as f:
            #unique_edges = { each['from'] : (each for each in edges) , each['to'] : (each for each in edges) }.values()
            json.dump(edges_filtered, f)
        with open('ProcessedData/loc-gowalla/metadata.json', 'w') as f:
            json.dump(metadata, f)


        selected_dataset = 'loc-gowalla'
        graph = {
            "nodes": nodes,
            "edges": edges_filtered,
            "analytics": {}
        }
        if os.path.exists('ProcessedData/' + selected_dataset):
            for interval in intervals:
                graph = perform_analytics_graph(edges_filtered, interval, graph)
                with open('ProcessedData/' + selected_dataset + '/analytics_graph_' + interval + '.json', 'w') as f:
                    json.dump(graph, f)
    return 'Locgowalla Social Media Dataset Processed!'


# Preprocessing for Loc Brightkite Dataset
@app.route('/preprocess_locbrightkite')
def preprocess_locbrightkite():
    filepath = 'RawData/loc-brightkite.txt'
    with open(filepath) as fp:
        line = fp.readline()
        cnt = 1
        nodes = []
        nodes_checker = []
        edges = []
        edges_checker = []

        temp_arr = line.strip().split()
        changing_user = temp_arr[0]

        prev_temp_arr = line.strip().split()
        while line:
            temp_arr = line.strip().split()
            lat = round(float(temp_arr[2]), 0)
            lng = round(float(temp_arr[3]), 0)
            timestamp_start = temp_arr[1]
            #print("Line {}: {}: {}: {}: {}".format(cnt, temp_arr[0], temp_arr[1], lat, lng))
            if (str(lat) + 'y' + str(lng)) not in nodes_checker:
                freqs = {
                    'node': str(lat) + 'y' + str(lng)
                    }
                print("Line {}: {}: {}: {}: {}".format(cnt, temp_arr[0], temp_arr[1], lat, lng))
                nodes_checker.append(str(lat) + 'y' + str(lng))
                nodes.append(freqs)
            
            if changing_user == temp_arr[0]:
                if cnt > 1:
                    prev_lat = round(float(prev_temp_arr[2]), 0)
                    prev_lng = round(float(prev_temp_arr[3]), 0)
                    timestamp_end = prev_temp_arr[1]
                    edge_obj = {
                        'from': str(lat) + 'y' + str(lng),
                        'to': str(prev_lat) + 'y' + str(prev_lng),
                        'startTime': temp_arr[1],
                        'endTime': prev_temp_arr[1],
                        'weight': 1,
                        'label': changing_user,
                        'timestamp_start': timestamp_start,
                        'timestamp_end': timestamp_end
                    }
                    if ((str(lat) + 'y' + str(lng) + str(prev_lat) + 'y' + str(prev_lng)) not in edges_checker) and not (str(lat) == str(prev_lat) and str(lng) == str(prev_lng)):
                        edges_checker.append(str(lat) + 'y' + str(lng) + str(prev_lat) + 'y' + str(prev_lng))
                        edges.append(edge_obj)
            else:
                changing_user = temp_arr[0]
                
            prev_temp_arr = temp_arr
            line = fp.readline()
            cnt += 1

        edges_filtered = []
        for edge in edges:
            if edge['from'] != edge['to']:
                edges_filtered.append(edge)

        # Creating Metadata
        metadata = {"graph_type": 'weight', "geograph": True, "duration_traversal": True}
        if not os.path.exists('ProcessedData/loc-brightkite'):
            os.mkdir('ProcessedData/loc-brightkite')
        with open('ProcessedData/loc-brightkite/nodes.json', 'w') as f:
            json.dump(nodes, f)
        with open('ProcessedData/loc-brightkite/edges.json', 'w') as f:
            #unique_edges = { each['from'] : (each for each in edges) , each['to'] : (each for each in edges) }.values()
            json.dump(edges_filtered, f)
        with open('ProcessedData/loc-brightkite/metadata.json', 'w') as f:
            json.dump(metadata, f)

        selected_dataset = 'loc-brightkite'
        graph = {
            "nodes": nodes,
            "edges": edges_filtered,
            "analytics": {}
        }
        if os.path.exists('ProcessedData/' + selected_dataset):
            for interval in intervals:
                graph = perform_analytics_graph(edges_filtered, interval, graph)
                with open('ProcessedData/' + selected_dataset + '/analytics_graph_' + interval + '.json', 'w') as f:
                    json.dump(graph, f)
    return 'Brightkite Social Media Dataset Processed!'


# Preprocessing for Train Dataset
@app.route('/preprocess_trains')
def preprocess_trains():
    filepath_schedules = 'RawData/train/schedules.json'
    filepath_stations = 'RawData/train/stations.json'
    filepath_trains = 'RawData/train/trains.json'

    new_schedules = []
    with open(filepath_stations) as station_raw:
        stations = json.loads(station_raw.read())
        with open(filepath_schedules) as schedules_raw:
            schedules = json.load(schedules_raw)
            with open(filepath_trains) as trains_raw:
                trains = json.loads(trains_raw.read())
                schedules_output = [x for x in schedules if x['arrival'] != x['departure']]
                trains_output = [x for x in trains['features'] if x['properties']['type'] == 'SF' and x['properties']['distance'] > 1000 and x['properties']['distance'] != 0 and x['properties']['distance'] != None and (x['properties']['duration_h'] != 0 or x['properties']['duration_m'] != 0)]
                print("Total Trains selected: " + str(len(trains_output)))
                for schedule in schedules_output:
                    for train in trains_output:
                        if schedule['train_number'] == train['properties']['number'] and train['properties']['distance'] != None and train['properties']['duration_h'] != None and train['properties']['duration_m'] != None: 
                            obj = schedule

                            chosen_station = [x for x in stations['features'] if x['properties']['code'] == obj['station_code']]

                            if len(chosen_station) > 0:
                                #print(train)
                                obj['latitude'] = chosen_station[0]['geometry']['coordinates'][1]
                                obj['longitude'] = chosen_station[0]['geometry']['coordinates'][0]


                                if train['properties']['duration_h'] != 0:
                                    obj['weight'] =  train['properties']['distance'] / (((train['properties']['duration_h'] * 60) + train['properties']['duration_m']) / 60)
                                else:
                                    obj['weight'] = 60
                                
                                if obj['arrival'] != "None":
                                    obj['arrival'] = datetime.datetime.strptime(days[obj['day']] + " " + obj['arrival'], "%Y-%m-%d %H:%M:%S").strftime('%Y-%m-%dT%H:%M:%SZ')
                                else:
                                    obj['arrival'] = None
                                
                                if obj['departure'] != "None":
                                    obj['departure'] = datetime.datetime.strptime(days[obj['day']] + " " + obj['departure'], "%Y-%m-%d %H:%M:%S").strftime('%Y-%m-%dT%H:%M:%SZ')
                                else:
                                    obj['departure'] = None

                                del obj['day']
                                del obj['station_code']
                                obj['train_name'] = re.sub('[^a-zA-Z0-9 \n\.]', '_', obj['train_number'] + "_" + obj["train_name"]).replace(" ", "_")
                                obj['station_name'] = re.sub('[^a-zA-Z0-9 \n\.]', '_', obj['station_name']).replace(" ", "_")

                                new_schedules.append(obj)

    mapped_schedules = {}
    edges = []
    nodes = {}
    for schedule in new_schedules:
        if schedule['train_name'] in mapped_schedules:
            mapped_schedules[schedule['train_name']].append(schedule)
        else:
            mapped_schedules[schedule['train_name']] = [schedule]
            
    

    for key in mapped_schedules:
        schedule_rows = mapped_schedules[key]
        prev = {}
        for index, schedule in enumerate(schedule_rows):
            if index == 0:
                prev = schedule
            else:
                edge_object = {}
                edge_object['from'] = prev['station_name']
                edge_object['to'] = schedule['station_name']
                edge_object['from_location'] = [prev['latitude'], prev['longitude']]
                edge_object['to_location'] = [schedule['latitude'], schedule['longitude']]
                edge_object['startTime'] = prev['departure']
                edge_object['endTime'] = schedule['arrival']
                edge_object['weight'] = schedule['weight']
                edge_object['label'] = key
                edge_object['timestamp_start'] = prev['departure']
                edge_object['timestamp_end'] = schedule['arrival']
                edges.append(edge_object)
                if edge_object['from'] not in nodes:
                    node_obj = {}
                    node_obj["node"] = edge_object['from']
                    node_obj["node_location"] = edge_object['from_location']
                    nodes[edge_object['from']] = node_obj
                if edge_object['to'] not in nodes:
                    node_obj = {}
                    node_obj["node"] = edge_object['to']
                    node_obj["node_location"] = edge_object['to_location']
                    nodes[edge_object['to']] = node_obj
                
                
                prev = schedule

   
    if not os.path.exists('ProcessedData/train_system'):
        os.mkdir('ProcessedData/train_system')
  
    final_nodes = []
    for key in nodes:
          final_nodes.append(nodes[key])


    # Creating Metadata
    metadata = {"graph_type": 'weight', "geograph": True, "duration_traversal": True} 

    with open('ProcessedData/train_system/nodes.json', 'w') as f:
        json.dump(final_nodes, f)
    with open('ProcessedData/train_system/edges.json', 'w') as f:
        json.dump(edges, f)
    with open('ProcessedData/train_system/metadata.json', 'w') as f:
            json.dump(metadata, f)

    selected_dataset = 'train_system'
    graph = {
            "nodes": final_nodes,
            "edges": edges,
            "analytics": {}
    }
    if os.path.exists('ProcessedData/' + selected_dataset):
        for interval in intervals:
            graph = perform_analytics_graph(edges, interval, graph)
            with open('ProcessedData/' + selected_dataset + '/analytics_graph_' + interval + '.json', 'w') as f:
                json.dump(graph, f)

    return 'Indian Train Dataset Processed!'



# Preprocessing for Relato Business Graph Dataset
@app.route('/preprocess_relato')
def preprocess_relato():
    filepath_nodes = 'RawData/relato-business-graph/companies.json'
    nodes = []
    edges = []
    categories = []
    with open(filepath_nodes, "r") as file:
        raw_nodes = json.load(file)
        
        for node in raw_nodes:
            node = {
                'node': node['name'] + '_' + node['domain'] 
            }
            nodes.append(node)

    filepath_links = 'RawData/relato-business-graph/links.json'    
    with open(filepath_links, "r") as file:
        raw_links = json.load(file)
        for link in raw_links:
            if 'home_name' in link and 'home_domain' in link and 'link_name' in link and 'link_domain' in link:
                edge_obj = {
                        'from': link['home_name'] + '_' + link['home_domain'],
                        'to': link['link_name'] + '_' + link['link_domain'],
                        'startTime': datetime.datetime.strptime(link['update_time']['$date'], "%Y-%m-%dT%H:%M:%S.%fZ").strftime('%Y-%m-%dT%H:%M:%SZ'),
                        'endTime': datetime.datetime.strptime(link['update_time']['$date'], "%Y-%m-%dT%H:%M:%S.%fZ").strftime('%Y-%m-%dT%H:%M:%SZ'),
                        'weight': 1,
                        'label': link['username'],
                        'timestamp_start': datetime.datetime.strptime(link['update_time']['$date'], "%Y-%m-%dT%H:%M:%S.%fZ").strftime('%Y-%m-%dT%H:%M:%SZ'),
                        'timestamp_end': datetime.datetime.strptime(link['update_time']['$date'], "%Y-%m-%dT%H:%M:%S.%fZ").strftime('%Y-%m-%dT%H:%M:%SZ'),
                        'category': link['type']
                    }
                edges.append(edge_obj)
                if link['type'] not in categories:
                    categories.append(link['type'])

    edges_filtered = []
    for edge in edges:
        if edge['from'] != edge['to']:
            edges_filtered.append(edge)

    # Creating Metadata
    metadata = {"graph_type": 'category', "geograph": False, "duration_traversal": False, "categories": categories}

    if not os.path.exists('ProcessedData/relato'):
        os.mkdir('ProcessedData/relato')
    with open('ProcessedData/relato/nodes.json', 'w') as f:
        json.dump(nodes, f)
    with open('ProcessedData/relato/edges.json', 'w') as f:
        json.dump(edges_filtered, f)
    with open('ProcessedData/relato/metadata.json', 'w') as f:
        json.dump(metadata, f)

    selected_dataset = 'relato'
    graph = {
            "nodes": nodes,
            "edges": edges_filtered,
            "analytics": {}
    }
    if os.path.exists('ProcessedData/' + selected_dataset):
        for interval in intervals:
            if interval != '1H' and interval !=  '1D':
                graph = perform_analytics_graph_category(edges_filtered, interval, graph)
                with open('ProcessedData/' + selected_dataset + '/analytics_graph_' + interval + '.json', 'w') as f:
                    json.dump(graph, f)
     
    return 'Relato Business Graph Dataset Processed!'



# Preprocessing for Subreddit  Graph Dataset
@app.route('/preprocess_subreddit')
def preprocess_subreddit():
    filepath = 'RawData/subreddit/subreddit.tsv'
    nodes = []
    nodes_checker = []
    edges = []
    sentiments = []
    indexer = 0
    with open(filepath) as file:
        tsv_file = csv.reader(file, delimiter="\t")
        for line in tsv_file:
            if indexer > 0:
                # Getting Nodes
                if line[0] not in nodes_checker:
                    nodes_checker.append(line[0])
                    node = {
                    'node': line[0]
                    }
                    nodes.append(node)
                if line[1] not in nodes_checker:
                    nodes_checker.append(line[1])
                    node = {
                    'node': line[1]
                    }
                    nodes.append(node)
                
                #Getting Links
                if len(line) >= 5:
                    edge_obj = {
                        'from': line[0],
                        'to': line[1],
                        'startTime': datetime.datetime.strptime(line[3], "%Y-%m-%d %H:%M:%S").strftime('%Y-%m-%dT%H:%M:%SZ'),
                        'endTime': datetime.datetime.strptime(line[3], "%Y-%m-%d %H:%M:%S").strftime('%Y-%m-%dT%H:%M:%SZ'),
                        'weight': 1,
                        'label': line[2],
                        'timestamp_start': datetime.datetime.strptime(line[3], "%Y-%m-%d %H:%M:%S").strftime('%Y-%m-%dT%H:%M:%SZ'),
                        'timestamp_end': datetime.datetime.strptime(line[3], "%Y-%m-%d %H:%M:%S").strftime('%Y-%m-%dT%H:%M:%SZ'),
                        'sentiment': line[4]
                    }
                    edges.append(edge_obj)
                if line[4] not in sentiments:
                    sentiments.append(line[4])
            else:
                indexer = 1
    
    
  

    edges_filtered = []
    for edge in edges:
        if edge['from'] != edge['to']:
            edges_filtered.append(edge)

    # Creating Metadata
    metadata = {"graph_type": 'sentiment', "geograph": False, "duration_traversal": False, "sentiments": sentiments}

    if not os.path.exists('ProcessedData/subreddit'):
        os.mkdir('ProcessedData/subreddit')
    with open('ProcessedData/subreddit/nodes.json', 'w') as f:
        json.dump(nodes, f)
    with open('ProcessedData/subreddit/edges.json', 'w') as f:
        json.dump(edges_filtered, f)
    with open('ProcessedData/subreddit/metadata.json', 'w') as f:
        json.dump(metadata, f)

    selected_dataset = 'subreddit'
    graph = {
        "nodes": nodes,
        "edges": edges_filtered,
        "analytics": {}
    }
    if os.path.exists('ProcessedData/' + selected_dataset):
        for interval in intervals:
            if interval != '1H' and interval !=  '1D':
                graph = perform_analytics_graph_signed(edges_filtered, interval, graph)
                with open('ProcessedData/' + selected_dataset + '/analytics_graph_' + interval + '.json', 'w') as f:
                    json.dump(graph, f)

    return 'Subreddit Business Graph Dataset Processed!'






# Preprocessing for Math Overflow Graph Dataset
@app.route('/preprocess_mathoverflow')
def preprocess_mathoverflow():
    filepath_aq = 'RawData/mathoverflow/sx-superuser-a2q.txt'
    filepath_cq = 'RawData/mathoverflow/sx-superuser-c2q.txt'
    filepath_ca = 'RawData/mathoverflow/sx-superuser-c2a.txt'

    merged = []
    # Merging and Sorting
    with open(filepath_aq, "r") as file:
        aq_list = file.readlines()
        for row in aq_list:
            [from_node, to, timestamp] = row.split(" ")
            timestamp = timestamp.rstrip("\n")
            if int(timestamp) > 1456786800:
                obj = {"from": from_node, "to": to, "timestamp": timestamp, "category": "answer_to_question"}
                merged.append(obj)

    with open(filepath_ca, "r") as file:
        ca_list = file.readlines()
        for row in ca_list:
            [from_node, to, timestamp] = row.split(" ")
            timestamp = timestamp.rstrip("\n")
            if int(timestamp) > 1456786800:
                obj = {"from": from_node, "to": to, "timestamp": timestamp, "category": "comment_to_answer"}
                merged.append(obj)

    with open(filepath_cq, "r") as file:
        cq_list = file.readlines()
        for row in cq_list:
            [from_node, to, timestamp] = row.split(" ")
            timestamp = timestamp.rstrip("\n")
            if int(timestamp) > 1456786800:
                obj = {"from": from_node, "to": to, "timestamp": timestamp, "category": "comment_to_question"}
                merged.append(obj)
        
    merged = sorted(merged, key=lambda k: k['timestamp'])
    

    nodes = []
    node_checker = []
    edges = []
    categories = []

    for link in merged:
        travel_time = datetime.datetime.utcfromtimestamp(int(link['timestamp'])).strftime('%Y-%m-%dT%H:%M:%SZ')
        edge_obj = {
                'from': link['from'],
                'to': link['to'],
                'startTime': travel_time,
                'endTime': travel_time,
                'weight': 1,
                'label': link['from'] + "_to_" + link['to'],
                'timestamp_start': travel_time,
                'timestamp_end': travel_time,
                'category': link['category']
            }
        edges.append(edge_obj)

        if link['from'] not in node_checker:
            node_checker.append(link['from'])
            node = {
            'node': link['from']
            }
            nodes.append(node)
        
        if link['to'] not in node_checker:
            node_checker.append(link['to'])
            node = {
            'node': link['to']
            }
            nodes.append(node)
            

        
        if link['category'] not in categories:
            categories.append(link['category'])

    edges_filtered = []
    for edge in edges:
        if edge['from'] != edge['to']:
            edges_filtered.append(edge)

    # Creating Metadata
    metadata = {"graph_type": 'category', "geograph": False, "duration_traversal": False, "categories": categories}

    if not os.path.exists('ProcessedData/mathoverflow'):
        os.mkdir('ProcessedData/mathoverflow')
    with open('ProcessedData/mathoverflow/nodes.json', 'w') as f:
        json.dump(nodes, f)
    with open('ProcessedData/mathoverflow/edges.json', 'w') as f:
        json.dump(edges_filtered, f)
    with open('ProcessedData/mathoverflow/metadata.json', 'w') as f:
        json.dump(metadata, f)

    selected_dataset = 'mathoverflow'
    graph = {
            "nodes": nodes,
            "edges": edges_filtered,
            "analytics": {}
    }
    if os.path.exists('ProcessedData/' + selected_dataset):
        for interval in intervals:
            graph = perform_analytics_graph_category(edges_filtered, interval, graph)
            with open('ProcessedData/' + selected_dataset + '/analytics_graph_' + interval + '.json', 'w') as f:
                json.dump(graph, f)
            #if interval != '1H' and interval !=  '1D':
                
     
    return 'MathOverflow Graph Dataset Processed!'





# Preprocessing for Darpa Graph Dataset
@app.route('/preprocess_darpa')
def preprocess_darpa():
    filepath = 'RawData/darpa/darpa.txt'
    nodes = []
    nodes_checker = []
    edges = []
    categories = []
    
    with open(filepath) as file:
        for line in file:
            line = line.split(" ")
            print(line)
            # Getting Nodes
            if line[1] not in nodes_checker:
                nodes_checker.append(line[1])
                node = {
                'node': line[1]
                }
                nodes.append(node)
            if line[2] not in nodes_checker:
                nodes_checker.append(line[2])
                node = {
                'node': line[2]
                }
                nodes.append(node)
            
            #Getting Links
            edge_obj = {
                'from': line[1],
                'to': line[2],
                'startTime': datetime.utcfromtimestamp(int(line[0])).strftime('%Y-%m-%dT%H:%M:%SZ'),
                'endTime': datetime.utcfromtimestamp(int(line[0])).strftime('%Y-%m-%dT%H:%M:%SZ'),
                'weight': int(line[3].rstrip("\n")),
                'label': line[1] + "to" + line[2],
                'timestamp_start': datetime.utcfromtimestamp(int(line[0])).strftime('%Y-%m-%dT%H:%M:%SZ'),
                'timestamp_end': datetime.utcfromtimestamp(int(line[0])).strftime('%Y-%m-%dT%H:%M:%SZ'),
                'anomalous': line[3].rstrip("\n"),
                'category': "anomaly_label_" + line[3].rstrip("\n")
            }
            edges.append(edge_obj)

            if edge_obj['category'] not in categories:
                categories.append(edge_obj['category'])
    
    
  

    edges_filtered = []
    for edge in edges:
        if edge['from'] != edge['to']:
            edges_filtered.append(edge)

    # Creating Metadata
    metadata = {"graph_type": 'category', "geograph": False, "duration_traversal": False, "categories": categories}

    if not os.path.exists('ProcessedData/darpa'):
        os.mkdir('ProcessedData/darpa')
    with open('ProcessedData/darpa/nodes.json', 'w') as f:
        json.dump(nodes, f)
    with open('ProcessedData/darpa/edges.json', 'w') as f:
        json.dump(edges_filtered, f)
    with open('ProcessedData/darpa/metadata.json', 'w') as f:
        json.dump(metadata, f)

    selected_dataset = 'darpa'
    graph = {
        "nodes": nodes,
        "edges": edges_filtered,
        "analytics": {}
    }
  
    if os.path.exists('ProcessedData/' + selected_dataset):
        for interval in intervals:
            graph = perform_analytics_graph_category(edges_filtered, interval, graph)
            with open('ProcessedData/' + selected_dataset + '/analytics_graph_' + interval + '.json', 'w') as f:
                json.dump(graph, f)
    
    return 'Darpa Graph Dataset Processed!'



# Preprocessing for Bitcoin Graph Dataset
@app.route('/preprocess_bitcoin')
def preprocess_bitcoin():
    filepath = 'RawData/bitcoin-trust-network/soc-sign-bitcoinotc.csv'
    nodes = []
    nodes_checker = []
    edges = []
    categories = []
    
    with open(filepath, "r+") as file:
        for line in file:
            line = line.split(",")
            print(line)
            # Getting Nodes
            if line[0] not in nodes_checker:
                nodes_checker.append(line[1])
                node = {
                'node': line[1]
                }
                nodes.append(node)
            if line[1] not in nodes_checker:
                nodes_checker.append(line[2])
                node = {
                'node': line[2]
                }
                nodes.append(node)
            
            #Getting Links
            anomaly_label = line[2]
            anomaly_label = int(anomaly_label)
            if anomaly_label > 0 and anomaly_label <= 5:
                anomaly_label = 1
            if anomaly_label > 5:
                anomaly_label = 2
            if anomaly_label < 0 and anomaly_label >= -5:
                anomaly_label = -1
            if anomaly_label < -5:
                anomaly_label = -2
            edge_obj = {
                'from': line[0],
                'to': line[1],
                'startTime': datetime.utcfromtimestamp(int(line[3].rstrip("\n"))).strftime('%Y-%m-%dT%H:%M:%SZ'),
                'endTime': datetime.utcfromtimestamp(int(line[3].rstrip("\n"))).strftime('%Y-%m-%dT%H:%M:%SZ'),
                'weight': int(line[2].rstrip("\n")),
                'label': line[1] + "to" + line[2],
                'timestamp_start': datetime.utcfromtimestamp(int(line[3].rstrip("\n"))).strftime('%Y-%m-%dT%H:%M:%SZ'),
                'timestamp_end': datetime.utcfromtimestamp(int(line[3].rstrip("\n"))).strftime('%Y-%m-%dT%H:%M:%SZ'),
                'category': "anomaly_label_" + str(anomaly_label)
            }
            edges.append(edge_obj)

            if edge_obj['category'] not in categories:
                categories.append(edge_obj['category'])
    
    
  

    edges_filtered = []
    for edge in edges:
        if edge['from'] != edge['to']:
            edges_filtered.append(edge)

    # Creating Metadata
    metadata = {"graph_type": 'signed', "geograph": False, "duration_traversal": False, "categories": categories}

    if not os.path.exists('ProcessedData/bitcoin-trust-network'):
        os.mkdir('ProcessedData/bitcoin-trust-network')
    with open('ProcessedData/bitcoin-trust-network/nodes.json', 'w') as f:
        json.dump(nodes, f)
    with open('ProcessedData/bitcoin-trust-network/edges.json', 'w') as f:
        json.dump(edges_filtered, f)
    with open('ProcessedData/bitcoin-trust-network/metadata.json', 'w') as f:
        json.dump(metadata, f)

    selected_dataset = 'bitcoin-trust-network'
    graph = {
        "nodes": nodes,
        "edges": edges_filtered,
        "analytics": {}
    }
  
    if os.path.exists('ProcessedData/' + selected_dataset):
        for interval in intervals:
            if interval != '1H' and interval !=  '1D':
                graph = perform_analytics_graph_category(edges_filtered, interval, graph)
                with open('ProcessedData/' + selected_dataset + '/analytics_graph_' + interval + '.json', 'w') as f:
                    json.dump(graph, f)
    
    return 'Bitcoin-trust-network Graph Dataset Processed!'





# Get list of all preprocessed datasets
@app.route('/datasets')
def datasets():
    filepath = 'ProcessedData/'
    files = []
    for f in os.listdir(filepath):
        if not f.startswith('.'):
            files.append(f)
    return jsonify(files)


# Get data of speicific dataset wih analyics
@app.route('/select_dataset')
def select_dataset():
    selected_dataset = request.args.get('ds')
    interval = request.args.get('interval')
    filepath_nodes = 'ProcessedData/' + selected_dataset + '/nodes.json'
    filepath_edges = 'ProcessedData/' + selected_dataset + '/edges.json'
    filepath_metadata = 'ProcessedData/' + selected_dataset + '/metadata.json'
    edges_string = open(filepath_edges)
    edges = json.load(edges_string)
    metadata_string = open(filepath_metadata)
    metadata = json.load(metadata_string)

    graph = {
        "nodes": json.load(open(filepath_nodes)),
        "edges": edges,
        "analytics": {}
    }

        
    graph_string = open('ProcessedData/' + selected_dataset + '/analytics_graph_' + interval + '.json')
    graph = json.load(graph_string)
    graph['metadata'] = metadata


    return jsonify(graph)

def edgeNameChanger(n):
     n['source'] = n['from']
     n['target'] = n['to']
     return n 

def nodeNameChanger(n):
     n['id'] = n['node']
     return n 


@app.route('/get_layout')
def get_network_data():
    """Return network data 
    """
    layout = request.args.get('selectedlayout')
    selected_dataset = request.args.get('ds')

    filepath_nodes = 'ProcessedData/' + selected_dataset + '/nodes.json'
    filepath_edges = 'ProcessedData/' + selected_dataset + '/edges.json'
    filepath_metadata = 'ProcessedData/' + selected_dataset + '/metadata.json'

    edges_string = open(filepath_edges)
    edges = json.load(edges_string)

    edges = map(edgeNameChanger, edges)

    nodes_string = open(filepath_nodes)
    nodes = json.load(nodes_string)

    nodes = map(nodeNameChanger, nodes)

    final_edges = []
    if selected_dataset == "bitcoin-trust-network":
        for edge in edges:
            if edge['weight'] < 0:
                edge['weight'] = -edge['weight']
            final_edges.append(edge)
    else:
        final_edges = edges


    G = {'directed': True, 
         'multigraph': False, 
         'graph': {}, 
         'nodes': nodes, 
         'links': final_edges}

    H = nx.node_link_graph(G)
   
    if (H):
        if layout == 'no_layout':
            H.remove_edges_from(list(nx.selfloop_edges(H)))
        elif layout == 'kamada_kawai_layout':
            pos = nx.kamada_kawai_layout(H)
            coordinates = {k: v.tolist() for k, v in pos.items()}
            nx.set_node_attributes(H, coordinates, 'location')
        elif layout == 'circular_layout':
            pos = nx.circular_layout(H)
            coordinates = {k: v.tolist() for k, v in pos.items()}
            nx.set_node_attributes(H, coordinates, 'location')
        elif layout == 'shell_layout':
            pos = nx.shell_layout(H)
            coordinates = {k: v.tolist() for k, v in pos.items()}
            nx.set_node_attributes(H, coordinates, 'location')
        elif layout == 'spring_layout':
            pos = nx.spring_layout(H)
            coordinates = {k: v.tolist() for k, v in pos.items()}
            nx.set_node_attributes(H, coordinates, 'location')
        elif layout == 'spectral_layout':
            pos = nx.spectral_layout(H)
            coordinates = {k: v.tolist() for k, v in pos.items()}
            nx.set_node_attributes(H, coordinates, 'location')
        elif layout == 'spiral_layout':
            pos = nx.spiral_layout(H)
            coordinates = {k: v.tolist() for k, v in pos.items()}
            nx.set_node_attributes(H, coordinates, 'location')
        
        graph_jsonified = json_graph.node_link_data(H)

        metadata_string = open(filepath_metadata)
        metadata = json.load(metadata_string)
        graph_jsonified['metadata'] = metadata
        return graph_jsonified
    return {}



# CNA, DNODA & GLODA Node analysis
@app.route('/sota_node_analysis', methods = ['GET', 'POST'])
def sota_node_analysis():
    content = request.json
    print(content)
    
    selected_sota = content['sota']
    weight_sentiment_value = content['weight_sentiment_value']
    analysed_nodes = content['analysed_nodes']
    worst_offenders = int(content['worst_offenders'])

    
    
    H = nx.Graph()

    # Algorithms for weight replacements based on value_sentiments

    if weight_sentiment_value == "total_edges":
        for node in analysed_nodes:
            total_edges = node['incoming'] + node['outgoing']
            H.add_node(node['node'], value=total_edges)
    elif weight_sentiment_value == "total_weights":
        for node in analysed_nodes:
            total_weights = node['incoming_weights'] + node['outgoing_weights']
            H.add_node(node['node'], value=total_weights)
    else:
        for node in analysed_nodes:
            H.add_node(node['node'], value=node[weight_sentiment_value])
  

   
    if selected_sota == 'dnoda':
        scores = DNODA(H)
        print("  DNODA:", np.argsort(scores)[worst_offenders:])
    
    if selected_sota == 'cna':
        scores = CNA(H)
        print("   Nodes Length", len(analysed_nodes))
        print("   CNA scores Length", len(scores.tolist()))
        print("   CNA Scores", scores.tolist())
        print("  CNA:", np.argsort(scores)[worst_offenders:])

    if selected_sota == 'gloda':
        scores = GLODA(H)
        print("   GLODA Scores", np.argsort(scores))
        print("  GLODA:", np.argsort(scores)[worst_offenders:])

    selected_node_indexes = np.argsort(scores).tolist()[0:worst_offenders]
    print("Final Node Indexes", selected_node_indexes)

    final_nodes = []
    for indx in selected_node_indexes:
        final_nodes.append(analysed_nodes[indx]['node'].replace(" ", '_').replace(".", '_'))


    print("Final Nodes", final_nodes)

   
    return jsonify({"anomalous_nodes": final_nodes})

def get_timestamp(ele):
    return ele.get('timestamp') 
def get_score(ele):
    return ele.get('score') 

# F-Fade edge analysis
@app.route('/sota_edge_analysis', methods = ['GET', 'POST'])
def sota_edge_analysis():
    
    
    content = request.json
    print(content)

    selected_dataset = content['ds']
    embedding_size = content['embedding_size'] #200
    batch_size  = content['batch_size'] #32
    t_setup  = content['t_setup'] #8000
    W_upd  = content['W_upd'] #720
    alpha  = content['alpha'] #0.999
    T_th = content['T_th'] #120
    epochs = content['epochs'] #5
    online_train_steps = content['online_train_steps'] #10
    M = content['M'] #100


    filepath_edges = 'ProcessedData/' + selected_dataset + '/edges.json'
    filepath_metadata = 'ProcessedData/' + selected_dataset + '/metadata.json'

    edges_string = open(filepath_edges)
    edges = json.load(edges_string)

    metadata_string = open(filepath_metadata)
    metadata = json.load(metadata_string)

    content_meta = []

    min_time = 99999999999

    node_mapping_c_n = {}
    node_mapping_n_c = {}
    node_counter = 1

    node_checker = {}

    for edge in edges:
        time_int = timegm(datetime.strptime(edge['startTime'], '%Y-%m-%dT%H:%M:%SZ').utctimetuple())
        if min_time > time_int:
            min_time = time_int

       
        if edge['from'] not in node_checker:
            node_mapping_c_n[str(node_counter)] = str(edge['from'])
            node_mapping_n_c[str(edge['from'])] = str(node_counter)
            node_checker[str(edge['from'])] = True
            node_counter = node_counter + 1
        
        if edge['to'] not in node_checker:
            node_mapping_c_n[str(node_counter)] = str(edge['to'])
            node_mapping_n_c[str(edge['to'])] = str(node_counter)
            node_checker[str(edge['to'])] = True
            node_counter = node_counter + 1

        content_str = " " + node_mapping_n_c[str(edge['from'])] + " " + node_mapping_n_c[str(edge['to'])] + "\n"
        content_meta_object = {}
        content_meta_object["content"] = content_str
        content_meta_object["timestamp"] = time_int
        content_meta_object["from"] = edge['from'].replace(" ", "_").replace(".", "_")
        content_meta_object["to"] = edge['to'].replace(" ", "_").replace(".", "_")
        content_meta.append(content_meta_object)

    #Sort edges based on the time
    content_meta = sorted(content_meta, key=get_timestamp)

    
    with open('./temp/temp.txt', 'w') as temp_file:
        for content_meta_item in content_meta:
            temp_file.write(str(content_meta_item["timestamp"]) + content_meta_item["content"])
        args = {
        "dataset": "./temp/temp.txt",
        "embedding_size": embedding_size,
        "batch_size": batch_size,
        "t_setup": t_setup,
        "W_upd": W_upd,
        "alpha": alpha,
        "T_th": T_th,
        "epochs": epochs,
        "online_train_steps": online_train_steps,
        "gpu": 0,
        "M": M
        }   
        print("Main args")
        print(args)
        temp_file.close()
        final_edges = ffade(args)
        # Merging the scores with edges
        for indx, content_meta_item in enumerate(content_meta):
            content_meta[indx]['score'] = final_edges[indx]
        
        content_meta = sorted(content_meta, key=get_score, reverse=True)
        
        filtered_edges = []
        for indx, content_meta_item in enumerate(content_meta):
            if indx < 30:
                anomalous_edge = {}
                anomalous_edge["from"] = content_meta_item['from']
                anomalous_edge["to"] = content_meta_item['to']
                anomalous_edge["timestamp_original"] = content_meta_item['timestamp']
                anomalous_edge["timestamp"] = datetime.utcfromtimestamp(int(content_meta_item['timestamp'])).strftime('%Y-%m-%dT%H:%M:%SZ')  
                filtered_edges.append(anomalous_edge)
        


        return jsonify({"anomalous_edges": filtered_edges})

    
    
    







# Get data of specific edge details
@app.route('/select_edge', methods = ['GET', 'POST'])
def select_edge():
    interval = request.args.get('interval')
    is_non_location = request.args.get('is_non_location')
    print("Location info below")
    print(is_non_location)
    edges = request.json['edges']
    if is_non_location == "true":
        edge_analytics = perform_analytics_edge_category(edges, interval)
    else:
        edge_analytics = perform_analytics_edge(edges, interval)
    print(edge_analytics)
    print(interval)
    return jsonify({"analytics": edge_analytics})


# Get data of specific node details
@app.route('/select_node', methods = ['GET', 'POST'])
def select_node():
    interval = request.args.get('interval')
    edges = request.json['edges']
    node = request.json['node']
    node_analytics = perform_analytics_node(edges, interval, node)
    print(node_analytics)
    print(interval)
    return jsonify({"analytics": node_analytics})




