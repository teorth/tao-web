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

    # richer: also pull each statement's TEXT, section and \\lean from the source
    # (--source points at the blueprint's LaTeX source dir; still no plasTeX, no web):
    python3 leanblueprint_to_paperdiagram.py dep_graph.dot --source blueprint/src > diagram.json

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


# --------------------------------------------------------------------------
# Optional: enrich the diagram with statement text / section / \lean parsed from
# the blueprint SOURCE (`--source blueprint/src`). The DOT gives structure +
# status + labels; the source adds the statements. Still deterministic, no deps.
# --------------------------------------------------------------------------
import os

STMT_ENVS = {'theorem', 'lemma', 'definition', 'proposition', 'corollary', 'remark',
             'conjecture', 'example', 'notation', 'claim', 'fact', 'problem', 'question',
             'thm', 'lem', 'def', 'defn', 'prop', 'cor'}
META = {'label', 'uses', 'lean', 'leanok', 'notready', 'mathlibok', 'discussion', 'alsoin', 'proves'}


def _match_brace(s, i):          # s[i] == '{' -> (inner, index-after-'}')
    depth = 0
    for j in range(i, len(s)):
        if s[j] == '{':
            depth += 1
        elif s[j] == '}':
            depth -= 1
            if depth == 0:
                return s[i + 1:j], j + 1
    return s[i + 1:], len(s)


def _match_bracket(s, i):        # s[i] == '[' -> (inner, index-after-']'), skipping {..}
    depth, j = 0, i
    while j < len(s):
        c = s[j]
        if c == '{':
            _, j = _match_brace(s, j); continue
        if c == '[':
            depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0:
                return s[i + 1:j], j + 1
        j += 1
    return s[i + 1:], len(s)


def _clean_name(t):              # a human title: drop \cite/\ref, braces, tidy dashes
    t = re.sub(r'\\(cite|ref|eqref|label)\s*\{[^}]*\}', '', t)
    t = re.sub(r'\\(emph|text[a-z]*|mathrm|mathbb|mathcal)\s*\{([^}]*)\}', r'\2', t)
    t = t.replace('{', '').replace('}', '').replace('--', '–').replace('~', ' ')
    return re.sub(r'\s+', ' ', t).strip()


def _clean_stmt(t):              # keep LaTeX, collapse whitespace, drop stray labels
    t = re.sub(r'\\label\s*\{[^}]*\}', '', t)
    return re.sub(r'\s+', ' ', t).strip()


def parse_tex(text):
    """Yield {label, kind, title, statement, section, uses, lean} per statement env."""
    out, section, i, n = [], None, 0, len(text)
    tok = re.compile(r'\\(?:sub)*section\*?\s*\{|\\chapter\*?\s*\{|\\begin\{([A-Za-z]+)\*?\}')
    while i < n:
        m = tok.search(text, i)
        if not m:
            break
        if m.group(1) is None:                      # a \section{...}/\chapter{...}
            title, j = _match_brace(text, text.index('{', m.start()))
            section = _clean_name(title); i = j
            continue
        env = m.group(1)
        if env not in STMT_ENVS:
            i = m.end(); continue
        p = m.end()
        title = None
        while p < n and text[p] in ' \t\r\n':
            p += 1
        if p < n and text[p] == '[':
            title, p = _match_bracket(text, p)
        label, uses, lean = None, [], []
        while True:
            mm = re.match(r'[ \t\r\n]*\\([A-Za-z]+)', text[p:])
            if not mm or mm.group(1) not in META:
                break
            name = mm.group(1); p += mm.end()
            if p < n and text[p] == '{':
                arg, p = _match_brace(text, p)
                if name == 'label':
                    label = arg.strip()
                elif name == 'uses':
                    uses += [x.strip() for x in arg.split(',') if x.strip()]
                elif name == 'lean':
                    lean += [x.strip() for x in arg.split(',') if x.strip()]
        end = text.find('\\end{' + env + '}', p)
        if end < 0:
            i = p; continue
        body = text[p:end]
        after = end + len('\\end{' + env + '}')
        pm = re.match(r'[ \t\r\n%]*\\begin\{proof\}', text[after:])   # proof-level \uses
        if pm:
            q = after + pm.end()
            while True:
                mm = re.match(r'[ \t\r\n]*\\([A-Za-z]+)', text[q:])
                if not mm or mm.group(1) not in META:
                    break
                name = mm.group(1); q += mm.end()
                if q < n and text[q] == '{':
                    a, q = _match_brace(text, q)
                    if name == 'uses':
                        uses += [x.strip() for x in a.split(',') if x.strip()]
            after = q
        if label:
            out.append({'label': label, 'kind': env, 'title': _clean_name(title) if title else None,
                        'statement': _clean_stmt(body), 'section': section, 'uses': uses, 'lean': lean})
        i = after
    return out


def parse_source(path):
    """Parse every .tex under `path` (a dir or a file) -> {label: statement-info}."""
    if os.path.isdir(path):
        files = [os.path.join(r, f) for r, _, fs in os.walk(path) for f in fs if f.endswith('.tex')]
    else:
        files = [path]
    by_label = {}
    for f in sorted(files):
        try:
            text = open(f, encoding='utf-8', errors='replace').read()
        except OSError:
            continue
        text = re.sub(r'(?<!\\)%.*', '', text)          # strip line comments
        for st in parse_tex(text):
            by_label.setdefault(st['label'], st)
    return by_label


def enrich(diagram, src):
    hit = 0
    for node in diagram['nodes']:
        st = src.get(node['id'])
        if not st:
            continue
        hit += 1
        if st['statement']:
            node['statement'] = st['statement']
        if st['title']:
            node['name'] = st['title']
        if st['section']:
            node['section'] = st['section']
        if st['lean']:
            node['lean'] = ', '.join(st['lean'])
    return hit


if __name__ == '__main__':
    try:
        sys.stdout.reconfigure(encoding='utf-8')        # blueprint statements carry Unicode (ℝ, ₈, …)
    except Exception:
        pass
    argv = sys.argv[1:]

    def opt(name):
        return argv[argv.index(name) + 1] if name in argv and argv.index(name) + 1 < len(argv) else None
    title, source = opt('--title'), opt('--source')
    skip = {title, source}
    files = [a for a in argv if not a.startswith('--') and a not in skip]
    text = open(files[0], encoding='utf-8').read() if files else sys.stdin.read()
    if not text.strip():
        raise SystemExit(__doc__)
    diagram = convert(extract_digraph(text), title)
    msg = f'# {len(diagram["nodes"])} nodes, {len(diagram["edges"])} edges'
    if source:
        hit = enrich(diagram, parse_source(source))
        msg += f'; enriched {hit} with statements from {source}'
    json.dump(diagram, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write('\n')
    print(msg, file=sys.stderr)
