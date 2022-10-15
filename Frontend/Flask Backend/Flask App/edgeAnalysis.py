from ffade_utils import *
from ffade_model import *
from sklearn import metrics
import os
import json
import numpy as np

def ffade(args):  
  
  print("Here1")
  device = torch.device('cuda:' + str(args['gpu']) if torch.cuda.is_available() else 'cpu')

  dataset = Ffade_dataset(args['dataset'])

  model = Ffade_Model(num_nodes = dataset.num_nodes, embedding_size = args['embedding_size']).to(device = device)
  print("Here2")
  print(model.h_static)

  F_FADE_arr = F_FADE(model, dataset, args['t_setup'], args['W_upd'], args['alpha'], args['M'], args['T_th'], args['epochs'], args['online_train_steps'], args['batch_size'], device)

  print("Here3")

  return F_FADE_arr  


