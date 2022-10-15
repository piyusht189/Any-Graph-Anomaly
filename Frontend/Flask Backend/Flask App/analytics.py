from flask import Flask, request, jsonify
import json, os
from flask_cors import CORS
import pandas as pd
import time
import datetime
import re
import csv


    


def perform_analytics_graph(edges, interval, graph):
    max_date = ""
    min_date = ""
    for edge in edges:
        edge['identifier']= edge['from'] + "to" + edge['to']
        if max_date == "":
            max_date = edge['timestamp_end'] 
            min_date = edge['timestamp_start']
        if time.mktime(datetime.datetime.strptime(max_date, "%Y-%m-%dT%H:%M:%SZ").timetuple()) < time.mktime(datetime.datetime.strptime(edge['timestamp_end'], "%Y-%m-%dT%H:%M:%SZ").timetuple()):
            max_date = edge['timestamp_end']
        if time.mktime(datetime.datetime.strptime(min_date, "%Y-%m-%dT%H:%M:%SZ").timetuple()) > time.mktime(datetime.datetime.strptime(edge['timestamp_start'], "%Y-%m-%dT%H:%M:%SZ").timetuple()):
            min_date = edge['timestamp_start']
    
    print("Performing Graph Analytics")
    print(interval)
    print(max_date)
    print(min_date)
    pd.set_option('display.max_rows', None)
    ranges = pd.date_range(start=min_date, end=max_date, freq=interval)
    size_of_ranges = ranges.size
    ranges = ranges.insert(size_of_ranges, pd.to_datetime(max_date, dayfirst=True))
    print("Here In Ranges")
    print(size_of_ranges)
    result_edges_time = {}
    prev_range_timestamp = pd.to_datetime(min_date, dayfirst=True)
    for range_timestamp in ranges:
            for index, edge in enumerate(edges):

                # Outgoing Connections
                if(pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() < range_timestamp.to_datetime64() and pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64()):

                    #Calculaing duration (Start to range end or Start to end if edge ends before range ends)
                    if pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() <= range_timestamp.to_datetime64():
                        duration_seconds = pd.Timedelta(pd.to_datetime(edge['timestamp_end']).replace(tzinfo=None) - pd.to_datetime(edge['timestamp_start']).replace(tzinfo=None)).total_seconds()
                    else:
                        duration_seconds = pd.Timedelta(range_timestamp.to_datetime64() - pd.to_datetime(edge['timestamp_start']).replace(tzinfo=None)).total_seconds()
              


                    if range_timestamp.strftime('%Y-%m-%d %X') not in result_edges_time:
                        label_weights = {edge["label"]: float(edge["weight"])}
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')] = {"outgoing": 1, "incoming": 0, "total_edges": 1, "total_weights": float(edge["weight"]), "label_weights": label_weights, "total_duration_outgoing":  duration_seconds, "total_duration_incoming": 0}
                    else:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["outgoing"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["outgoing"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] + float(edge["weight"])
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_outgoing"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_outgoing"] + duration_seconds
                        
                        if edge["label"] not in result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"]:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) 
                        else:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) + result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]]


                #Incoming Connections
                if(pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() < range_timestamp.to_datetime64() and pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64()):


                    #Calculaing duration (Start to range end or Start to end if edge ends before range ends)
                    if pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64():
                        duration_seconds = pd.Timedelta(pd.to_datetime(edge['timestamp_end']).replace(tzinfo=None) - pd.to_datetime(edge['timestamp_start']).replace(tzinfo=None)).total_seconds()
                    else:
                        duration_seconds = pd.Timedelta(pd.to_datetime(edge['timestamp_end']).replace(tzinfo=None) - prev_range_timestamp.to_datetime64()).total_seconds()
                    
                


                    if range_timestamp.strftime('%Y-%m-%d %X') not in result_edges_time:
                        label_weights = {edge["label"]: float(edge["weight"])}
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')] = {"outgoing": 0, "incoming": 1, "total_edges": 1, "total_weights": float(edge["weight"]), "label_weights": label_weights , "total_duration_incoming":  duration_seconds, "total_duration_outgoing": 0}
                    else:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["incoming"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["incoming"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] + float(edge["weight"])
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_incoming"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_incoming"] + duration_seconds
                        if edge["label"] not in result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"]:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) 
                        else:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) + result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]]


            prev_range_timestamp = range_timestamp
    graph["analytics"] = result_edges_time
    return graph


def perform_analytics_graph_category(edges, interval, graph):
    max_date = ""
    min_date = ""
    for edge in edges:
        edge['identifier']= edge['from'] + "to" + edge['to']
        if max_date == "":
            max_date = edge['timestamp_end'] 
            min_date = edge['timestamp_start']
        if time.mktime(datetime.datetime.strptime(max_date, "%Y-%m-%dT%H:%M:%SZ").timetuple()) < time.mktime(datetime.datetime.strptime(edge['timestamp_end'], "%Y-%m-%dT%H:%M:%SZ").timetuple()):
            max_date = edge['timestamp_end']
        if time.mktime(datetime.datetime.strptime(min_date, "%Y-%m-%dT%H:%M:%SZ").timetuple()) > time.mktime(datetime.datetime.strptime(edge['timestamp_start'], "%Y-%m-%dT%H:%M:%SZ").timetuple()):
            min_date = edge['timestamp_start']
    
    print("Performing Graph Analytics Category")
    print(interval)
    print(max_date)
    print(min_date)
    pd.set_option('display.max_rows', None)
    ranges = pd.date_range(start=min_date, end=max_date, freq=interval)
    size_of_ranges = ranges.size
    ranges = ranges.insert(size_of_ranges, pd.to_datetime(max_date, dayfirst=True))
    print("Here In Ranges")
    print(size_of_ranges)
    result_edges_time = {}
    prev_range_timestamp = pd.to_datetime(min_date, dayfirst=True)
    for range_timestamp in ranges:
            for index, edge in enumerate(edges):

                # Outgoing Connections
                if(pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() < range_timestamp.to_datetime64() and pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64()):

                    if range_timestamp.strftime('%Y-%m-%d %X') not in result_edges_time:
                        label_weights = {edge["label"]: float(edge["weight"])}
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')] = {"outgoing": 1, "incoming": 0, "total_edges": 1, "total_weights": float(edge["weight"]), "label_weights": label_weights}
                    else:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["outgoing"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["outgoing"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] + float(edge["weight"])
                        
                        if edge["label"] not in result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"]:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) 
                        else:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) + result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]]


                #Incoming Connections
                if(pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() < range_timestamp.to_datetime64() and pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64()):


                  

                    if range_timestamp.strftime('%Y-%m-%d %X') not in result_edges_time:
                        label_weights = {edge["label"]: float(edge["weight"])}
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')] = {"outgoing": 0, "incoming": 1, "total_edges": 1, "total_weights": float(edge["weight"]), "label_weights": label_weights}
                    else:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["incoming"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["incoming"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] + float(edge["weight"])
                      
                        if edge["label"] not in result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"]:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) 
                        else:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) + result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]]


            prev_range_timestamp = range_timestamp
    graph["analytics"] = result_edges_time
    return graph




def perform_analytics_graph_signed(edges, interval, graph):
    max_date = ""
    min_date = ""
    for edge in edges:
        edge['identifier']= edge['from'] + "to" + edge['to']
        if max_date == "":
            max_date = edge['timestamp_end'] 
            min_date = edge['timestamp_start']
        if time.mktime(datetime.datetime.strptime(max_date, "%Y-%m-%dT%H:%M:%SZ").timetuple()) < time.mktime(datetime.datetime.strptime(edge['timestamp_end'], "%Y-%m-%dT%H:%M:%SZ").timetuple()):
            max_date = edge['timestamp_end']
        if time.mktime(datetime.datetime.strptime(min_date, "%Y-%m-%dT%H:%M:%SZ").timetuple()) > time.mktime(datetime.datetime.strptime(edge['timestamp_start'], "%Y-%m-%dT%H:%M:%SZ").timetuple()):
            min_date = edge['timestamp_start']
    
    print("Performing Graph Analytics Signed")
    print(interval)
    print(max_date)
    print(min_date)
    pd.set_option('display.max_rows', None)
    ranges = pd.date_range(start=min_date, end=max_date, freq=interval)
    size_of_ranges = ranges.size
    ranges = ranges.insert(size_of_ranges, pd.to_datetime(max_date, dayfirst=True))
    print("Here In Ranges")
    print(size_of_ranges)
    result_edges_time = {}
    prev_range_timestamp = pd.to_datetime(min_date, dayfirst=True)
    for range_timestamp in ranges:
            for index, edge in enumerate(edges):

                # Outgoing Connections
                if(pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() < range_timestamp.to_datetime64() and pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64()):

                   
              


                    if range_timestamp.strftime('%Y-%m-%d %X') not in result_edges_time:
                        label_weights = {edge["label"]: float(edge["weight"])}
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')] = {"outgoing": 1, "incoming": 0, "total_edges": 1, "total_weights": float(edge["weight"]), "label_weights": label_weights}
                    else:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["outgoing"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["outgoing"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] + float(edge["weight"])
                       
                        if edge["label"] not in result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"]:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) 
                        else:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) + result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]]


                #Incoming Connections
                if(pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() < range_timestamp.to_datetime64() and pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64()):


                  

                    if range_timestamp.strftime('%Y-%m-%d %X') not in result_edges_time:
                        label_weights = {edge["label"]: float(edge["weight"])}
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')] = {"outgoing": 0, "incoming": 1, "total_edges": 1, "total_weights": float(edge["weight"]), "label_weights": label_weights}
                    else:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["incoming"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["incoming"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] + float(edge["weight"])
                       
                        if edge["label"] not in result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"]:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) 
                        else:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) + result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]]


            prev_range_timestamp = range_timestamp
    graph["analytics"] = result_edges_time
    return graph




def perform_analytics_edge(edges, interval):
    max_date = ""
    min_date = ""
    for edge in edges:
        edge['identifier']= edge['from'] + "to" + edge['to']
        if max_date == "":
            max_date = edge['timestamp_end'] 
            min_date = edge['timestamp_start']
        if time.mktime(datetime.datetime.strptime(max_date, "%Y-%m-%dT%H:%M:%SZ").timetuple()) < time.mktime(datetime.datetime.strptime(edge['timestamp_end'], "%Y-%m-%dT%H:%M:%SZ").timetuple()):
            max_date = edge['timestamp_end']
        if time.mktime(datetime.datetime.strptime(min_date, "%Y-%m-%dT%H:%M:%SZ").timetuple()) > time.mktime(datetime.datetime.strptime(edge['timestamp_start'], "%Y-%m-%dT%H:%M:%SZ").timetuple()):
            min_date = edge['timestamp_start']
    
    pd.set_option('display.max_rows', None)
    ranges = pd.date_range(start=min_date, end=max_date, freq=interval)
    size_of_ranges = ranges.size
    ranges = ranges.insert(size_of_ranges, pd.to_datetime(max_date, dayfirst=True))

    result_edges_time = {}
    prev_range_timestamp = pd.to_datetime(min_date, dayfirst=True)
    for range_timestamp in ranges:
            for index, edge in enumerate(edges):
                # Outgoing Connections
                if(pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() < range_timestamp.to_datetime64() and pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64()):
                    
                    #Calculaing duration (Start to range end or Start to end if edge ends before range ends)
                    if pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() <= range_timestamp.to_datetime64():
                        duration_seconds = pd.Timedelta(pd.to_datetime(edge['timestamp_end']).replace(tzinfo=None) - pd.to_datetime(edge['timestamp_start']).replace(tzinfo=None)).total_seconds()
                    else:
                        duration_seconds = pd.Timedelta(range_timestamp.to_datetime64() - pd.to_datetime(edge['timestamp_start']).replace(tzinfo=None)).total_seconds()
                    
                   
                    if range_timestamp.strftime('%Y-%m-%d %X') not in result_edges_time:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')] = {"outgoing": 1, "incoming": 0, "total_edges": 1, "total_weights": float(edge["weight"]), "total_duration_outgoing":  duration_seconds, "total_duration_incoming": 0}
                    else:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["outgoing"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["outgoing"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] + float(edge["weight"])
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_outgoing"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_outgoing"] + duration_seconds
                        
                       


                #Incoming Connections
                if(pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() < range_timestamp.to_datetime64() and pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64()):


                    #Calculaing duration (Start to range end or Start to end if edge ends before range ends)
                    if pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64():
                        duration_seconds = pd.Timedelta(pd.to_datetime(edge['timestamp_end']).replace(tzinfo=None) - pd.to_datetime(edge['timestamp_start']).replace(tzinfo=None)).total_seconds()
                    else:
                        duration_seconds = pd.Timedelta(pd.to_datetime(edge['timestamp_end']).replace(tzinfo=None) - prev_range_timestamp.to_datetime64()).total_seconds()
                    
                    
                  
                    if range_timestamp.strftime('%Y-%m-%d %X') not in result_edges_time:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')] = {"outgoing": 0, "incoming": 1, "total_edges": 1, "total_weights": float(edge["weight"]), "total_duration_incoming":  duration_seconds, "total_duration_outgoing": 0}
                    else:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["incoming"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["incoming"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] + float(edge["weight"])
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_incoming"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_incoming"] + duration_seconds
                        


            prev_range_timestamp = range_timestamp
    return result_edges_time


def perform_analytics_edge_category(edges, interval):
    max_date = ""
    min_date = ""
    for edge in edges:
        edge['identifier']= edge['from'] + "to" + edge['to']
        if max_date == "":
            max_date = edge['timestamp_end'] 
            min_date = edge['timestamp_start']
        if time.mktime(datetime.datetime.strptime(max_date, "%Y-%m-%dT%H:%M:%SZ").timetuple()) < time.mktime(datetime.datetime.strptime(edge['timestamp_end'], "%Y-%m-%dT%H:%M:%SZ").timetuple()):
            max_date = edge['timestamp_end']
        if time.mktime(datetime.datetime.strptime(min_date, "%Y-%m-%dT%H:%M:%SZ").timetuple()) > time.mktime(datetime.datetime.strptime(edge['timestamp_start'], "%Y-%m-%dT%H:%M:%SZ").timetuple()):
            min_date = edge['timestamp_start']
    
    pd.set_option('display.max_rows', None)

    print(min_date)
    print(max_date)

    if min_date:
        if min_date == max_date:
            min_date = pd.to_datetime(min_date, dayfirst=True) - datetime.timedelta(days=1)
            max_date = pd.to_datetime(max_date, dayfirst=True) + datetime.timedelta(days=1)


    print(min_date)
    print(max_date)
    
    ranges = pd.date_range(start=min_date, end=max_date, freq=interval)
    size_of_ranges = ranges.size
    print(size_of_ranges)
    ranges = ranges.insert(size_of_ranges, pd.to_datetime(max_date, dayfirst=True))

    result_edges_time = {}
    prev_range_timestamp = pd.to_datetime(min_date, dayfirst=True)
    for range_timestamp in ranges:
            for index, edge in enumerate(edges):
                # Outgoing Connections
                if(pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() < range_timestamp.to_datetime64() and pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64()):
                    
                    #Calculaing duration (Start to range end or Start to end if edge ends before range ends)
                    if pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() <= range_timestamp.to_datetime64():
                        duration_seconds = pd.Timedelta(pd.to_datetime(edge['timestamp_end']).replace(tzinfo=None) - pd.to_datetime(edge['timestamp_start']).replace(tzinfo=None)).total_seconds()
                    else:
                        duration_seconds = pd.Timedelta(range_timestamp.to_datetime64() - pd.to_datetime(edge['timestamp_start']).replace(tzinfo=None)).total_seconds()
                    
                   
                    if range_timestamp.strftime('%Y-%m-%d %X') not in result_edges_time:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')] = {"outgoing": 1, "incoming": 0, "total_edges": 1, "total_weights": float(edge["weight"]), "total_duration_outgoing":  duration_seconds, "total_duration_incoming": 0}
                    else:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["outgoing"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["outgoing"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] + float(edge["weight"])
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_outgoing"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_outgoing"] + duration_seconds
                        
                       


                #Incoming Connections
                if(pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() < range_timestamp.to_datetime64() and pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64()):


                    #Calculaing duration (Start to range end or Start to end if edge ends before range ends)
                    if pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64():
                        duration_seconds = pd.Timedelta(pd.to_datetime(edge['timestamp_end']).replace(tzinfo=None) - pd.to_datetime(edge['timestamp_start']).replace(tzinfo=None)).total_seconds()
                    else:
                        duration_seconds = pd.Timedelta(pd.to_datetime(edge['timestamp_end']).replace(tzinfo=None) - prev_range_timestamp.to_datetime64()).total_seconds()
                    
                    
                  
                    if range_timestamp.strftime('%Y-%m-%d %X') not in result_edges_time:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')] = {"outgoing": 0, "incoming": 1, "total_edges": 1, "total_weights": float(edge["weight"]), "total_duration_incoming":  duration_seconds, "total_duration_outgoing": 0}
                    else:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["incoming"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["incoming"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] + float(edge["weight"])
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_incoming"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_incoming"] + duration_seconds
                        


            prev_range_timestamp = range_timestamp
    return result_edges_time




def perform_analytics_node(edges, interval, node):
    max_date = ""
    min_date = ""
    for edge in edges:
        edge['identifier']= edge['from'] + "to" + edge['to']
        if max_date == "":
            max_date = edge['timestamp_end'] 
            min_date = edge['timestamp_start']
        if time.mktime(datetime.datetime.strptime(max_date, "%Y-%m-%dT%H:%M:%SZ").timetuple()) < time.mktime(datetime.datetime.strptime(edge['timestamp_end'], "%Y-%m-%dT%H:%M:%SZ").timetuple()):
            max_date = edge['timestamp_end']
        if time.mktime(datetime.datetime.strptime(min_date, "%Y-%m-%dT%H:%M:%SZ").timetuple()) > time.mktime(datetime.datetime.strptime(edge['timestamp_start'], "%Y-%m-%dT%H:%M:%SZ").timetuple()):
            min_date = edge['timestamp_start']
    
    pd.set_option('display.max_rows', None)
    ranges = pd.date_range(start=min_date, end=max_date, freq=interval)
    size_of_ranges = ranges.size
    ranges = ranges.insert(size_of_ranges, pd.to_datetime(max_date, dayfirst=True))
    
    result_edges_time = {}
    prev_range_timestamp = pd.to_datetime(min_date, dayfirst=True)
    for range_timestamp in ranges:
            for index, edge in enumerate(edges):

                # Outgoing Connections
                if(pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() < range_timestamp.to_datetime64() and edge['from'] == node and  pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64()):

                    #Calculaing duration (Start to range end or Start to end if edge ends before range ends)
                    if pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() <= range_timestamp.to_datetime64():
                        duration_seconds = pd.Timedelta(pd.to_datetime(edge['timestamp_end']).replace(tzinfo=None) - pd.to_datetime(edge['timestamp_start']).replace(tzinfo=None)).total_seconds()
                    else:
                        duration_seconds = pd.Timedelta(range_timestamp.to_datetime64() - pd.to_datetime(edge['timestamp_start']).replace(tzinfo=None)).total_seconds()
              


                    if range_timestamp.strftime('%Y-%m-%d %X') not in result_edges_time:
                        label_weights = {edge["label"]: float(edge["weight"])}
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')] = {"outgoing": 1, "incoming": 0, "total_edges": 1, "total_weights": float(edge["weight"]), "label_weights": label_weights, "total_duration_outgoing":  duration_seconds, "total_duration_incoming": 0}
                    else:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["outgoing"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["outgoing"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] + float(edge["weight"])
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_outgoing"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_outgoing"] + duration_seconds
                        
                        if edge["label"] not in result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"]:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) 
                        else:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) + result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]]


                #Incoming Connections
                if(pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() < range_timestamp.to_datetime64() and edge['to'] == node and pd.to_datetime(edge['timestamp_end'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64()):


                    #Calculaing duration (Start to range end or Start to end if edge ends before range ends)
                    if pd.to_datetime(edge['timestamp_start'], dayfirst=True).to_datetime64() >= prev_range_timestamp.to_datetime64():
                        duration_seconds = pd.Timedelta(pd.to_datetime(edge['timestamp_end']).replace(tzinfo=None) - pd.to_datetime(edge['timestamp_start']).replace(tzinfo=None)).total_seconds()
                    else:
                        duration_seconds = pd.Timedelta(pd.to_datetime(edge['timestamp_end']).replace(tzinfo=None) - prev_range_timestamp.to_datetime64()).total_seconds()
                    
                


                    if range_timestamp.strftime('%Y-%m-%d %X') not in result_edges_time:
                        label_weights = {edge["label"]: float(edge["weight"])}
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')] = {"outgoing": 0, "incoming": 1, "total_edges": 1, "total_weights": float(edge["weight"]), "label_weights": label_weights , "total_duration_incoming":  duration_seconds, "total_duration_outgoing": 0}
                    else:
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["incoming"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["incoming"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_edges"] + 1
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_weights"] + float(edge["weight"])
                        result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_incoming"] = result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["total_duration_incoming"] + duration_seconds
                        if edge["label"] not in result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"]:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) 
                        else:
                            result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]] = float(edge["weight"]) + result_edges_time[range_timestamp.strftime('%Y-%m-%d %X')]["label_weights"][edge["label"]]


            prev_range_timestamp = range_timestamp
    return result_edges_time