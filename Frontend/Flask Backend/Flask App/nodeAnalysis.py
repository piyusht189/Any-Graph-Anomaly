import os
import numpy as np
import pandas as pd
from tqdm import tqdm
import networkx as nx
from datetime import datetime
from sklearn import neighbors, decomposition
import json, os

def DNODA(G):
    node_data = nx.get_node_attributes(G, "value")
    #print("Node_data", node_data)
    scores = []
    for v in tqdm(G, leave=False):
        p = node_data[v]
        neighbors = np.array([node_data[u] for u in G.neighbors(v)])
        if len(neighbors):
            distances = np.sqrt( np.sum(np.square( p - neighbors ), axis=1) )
            scores.append(np.mean(distances))
        else:
            scores.append(0)
    return np.array(scores)



def CNA(G):
    node_data = nx.get_node_attributes(G, "value")
    print("Node_data", node_data)
    communities = nx.algorithms.community.label_propagation_communities(G)
    scores = dict.fromkeys(G.nodes())
    for c in tqdm(communities, leave=False):
        neighbors = np.array([node_data[u] for u in c])
        for v in c:
            p = node_data[v]
            distances = np.sqrt( np.sum(np.square( p - neighbors ), axis=0) )
            scores[v] = np.mean(distances)
    ret = []
    for v in G:
        ret.append(scores[v])
    return np.array(ret)

def GLODA(G):
    clf = neighbors.LocalOutlierFactor(n_jobs=-1)
    node_data = nx.get_node_attributes(G, "value")
    #print("Node_data", node_data)
    dataset = [node_data[v] for v in G]
    clf.fit(np.array(dataset).reshape(-1, 1))
    scores = clf.negative_outlier_factor_ * -1
    return scores
