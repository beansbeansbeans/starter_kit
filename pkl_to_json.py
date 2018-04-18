'''
Convert a pkl file into json file
'''
import sys
import os
import _pickle as pickle
import json
import numpy as np


def convert_dict_to_json(file_path):
    with open(file_path, 'rb') as fpkl, open('%s.json' % file_path, 'w') as fjson:
        data = pickle.load(fpkl, encoding='latin1')
        if 'dists' in file_path:
            for x in range(len(data)):
                for key in data[x]['dists'].keys():
                    data[x]['dists'][key] = data[x]['dists'][key].tolist()
        else:
            for sent in data:
                data[sent] = data[sent].tolist()
        json.dump(data, fjson, ensure_ascii=False, sort_keys=True, indent=4)


def main():
    if sys.argv[1] and os.path.isfile(sys.argv[1]):
        file_path = sys.argv[1]
        print("Processing %s ..." % file_path)
        convert_dict_to_json(file_path)
    else:
        print("Usage: %s abs_file_path" % (__file__))


if __name__ == '__main__':
    main()