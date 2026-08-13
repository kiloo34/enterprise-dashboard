import json
from pathlib import Path
import sys

data = json.load(open('graphify-out/graph.json', encoding='utf-8'))
nodes = {n['id']: n for n in data['nodes']}
edges = data['edges']

auth_keywords = ['auth', 'login', 'token', 'jwt', 'security']
auth_nodes = {nid: n for nid, n in nodes.items() if any(k in str(n.get('label', '')).lower() or k in str(n.get('source_file', '')).lower() for k in auth_keywords)}

relevant_edges = []
for e in edges:
    src, dst = e['source'], e['target']
    if src in auth_nodes or dst in auth_nodes:
        src_label = nodes.get(src, {}).get('label', src)
        dst_label = nodes.get(dst, {}).get('label', dst)
        src_file = nodes.get(src, {}).get('source_file', 'unknown')
        dst_file = nodes.get(dst, {}).get('source_file', 'unknown')
        rel = e.get('relation', 'uses')
        relevant_edges.append(f"[{src_file}] {src_label} --({rel})--> [{dst_file}] {dst_label}")

grouped = {}
for e in set(relevant_edges):
    grouped.setdefault(e.split(']')[0][1:], []).append(e)

for f, lines in sorted(grouped.items()):
    if 'test' in f.lower(): continue
    print(f"\n## File: {f}")
    for l in sorted(lines):
        print(l)
