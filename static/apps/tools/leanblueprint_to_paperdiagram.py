#!/usr/bin/env python3
"""
Convert a Lean blueprint's dependency graph into the tao-web *paper-diagram* JSON
format (https://teorth.github.io/tao-web/apps/paper-diagram.html#format).

A leanblueprint dep-graph page embeds a Graphviz `digraph`: nodes = statements,
edges = `\\uses` dependencies, node fill colour = Lean formalization status. This
reads that digraph from a LOCAL FILE or STDIN and maps it onto a paper-diagram —
node id + `kind` (from the `def:`/`thm:`/`lem:` label prefix), edges, and the
status colour carried into the paper-diagram `color` field. Deterministic: no LLM.

Usage (this script never touches the network — you fetch the graph yourself):

    # pipe a published blueprint graph through it:
    curl -sL https://<project>.github.io/<repo>/blueprint/dep_graph_document.html \\
        | python3 leanblueprint_to_paperdiagram.py --title "My paper" > diagram.json

    # or run it on a local blueprint build (dep_graph_document.html or dep_graph.dot):
    python3 leanblueprint_to_paperdiagram.py blueprint/web/dep_graph_document.html > diagram.json

Then paste diagram.json into the viewer's "edit JSON" box and press "load".

--- WARNING -------------------------------------------------------------------
This is an LLM-generated script. Read it before you run it. It only reads a local
file (or stdin) and writes JSON to stdout; it makes NO network calls of its own.
-------------------------------------------------------------------------------
"""
import sys, re, json

# map a label prefix (def:/thm:/lem:/...) to a paper-diagram node kind
KIND = {'def': 'definition', 'defn': 'definition', 'notation': 'definition', 'assumption': 'definition',
        'lem': 'lemma', 'lemma': 'lemma', 'thm': 'theorem', 'theorem': 'theorem',
        'prop': 'proposition', 'proposition': 'proposition', 'cor': 'corollary', 'corollary': 'corollary',
        'conj': 'remark', 'rem': 'remark', 'eqn': 'remark'}


def extract_digraph(text):
    """Return the body between the outermost braces of the first `digraph {...}`."""
    i = text.find('digraph')
    if i < 0:
        raise SystemExit('no `digraph` found — is this a leanblueprint dep-graph page (or .dot)?')
    depth, j = 0, text.index('{', i)
    for k in range(j, len(text)):
        if text[k] == '{':
            depth += 1
        elif text[k] == '}':
            depth -= 1
            if depth == 0:
                return text[j + 1:k]
    raise SystemExit('unbalanced digraph braces')


def attr(attrs, key):
    m = (re.search(r'\b' + key + r'\s*=\s*"([^"]*)"', attrs)
         or re.search(r'\b' + key + r'\s*=\s*([\w#.-]+)', attrs))
    return m.group(1) if m else None


def kind_of(node_id):
    pre = node_id.split(':', 1)[0].lower() if ':' in node_id else ''
    return KIND.get(pre, 'remark')


def convert(dot, title):
    nodes, seen, edges = [], set(), []
    for stmt in dot.split(';'):
        s = stmt.strip()
        if not s:
            continue
        e = re.match(r'"([^"]+)"\s*->\s*"([^"]+)"(?:\s*\[(.*)\])?', s, re.S)
        if e:
            edges.append({'from': e.group(1), 'to': e.group(2), 'type': 'uses'})
            continue
        n = re.match(r'"([^"]+)"\s*\[(.*)\]', s, re.S)   # a quoted id => a node (skips node/edge/graph defaults)
        if not n:
            continue
        nid, at = n.group(1), n.group(2)
        if nid in seen:
            continue
        seen.add(nid)
        label = attr(at, 'label') or nid.split(':', 1)[-1]
        node = {'id': nid, 'kind': kind_of(nid), 'label': label,
                'name': label.replace('-', ' ').replace('_', ' ')}
        fill = attr(at, 'fillcolor')                     # blueprint status colour -> paper-diagram fill
        if fill and fill.startswith('#'):
            node['color'] = fill
        nodes.append(node)
    ids = {n['id'] for n in nodes}
    edges = [e for e in edges if e['from'] in ids and e['to'] in ids]   # drop dangling
    return {'format': 'paper-diagram', 'schemaVersion': 1,
            'meta': {'title': title or 'Lean blueprint',
                     'note': 'Auto-converted from a Lean blueprint dependency graph. The border encodes the '
                             'statement kind; the FILL encodes the Lean formalization status carried over from '
                             'the blueprint (green = formalized, blue = not yet ready, white = not started).'},
            'layout': {'engine': 'layered', 'direction': 'up'},
            'nodes': nodes, 'edges': edges}


if __name__ == '__main__':
    argv = sys.argv[1:]
    title = argv[argv.index('--title') + 1] if '--title' in argv else None
    files = [a for a in argv if not a.startswith('--') and a != title]
    text = open(files[0], encoding='utf-8').read() if files else sys.stdin.read()
    if not text.strip():
        raise SystemExit(__doc__)
    diagram = convert(extract_digraph(text), title)
    json.dump(diagram, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write('\n')
    print(f'# {len(diagram["nodes"])} nodes, {len(diagram["edges"])} edges', file=sys.stderr)
