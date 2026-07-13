// ---------------------------------------------------------------------------
// Paper-diagram viewer — layout engine (standalone, DOM-free).
//
// A diagram is a DAG of statements (theorems/lemmas/definitions) connected by
// dependency edges. Positions are DERIVED, not authored (the "LaTeX typesetting"
// model): a layered pass ranks statements by dependency depth (prerequisites low,
// results high) and a force-directed "balance" pass can tidy the result. A node
// may be pinned to override placement; unpinned nodes reflow around it.
//
// Edge convention: an edge {from, to} means `from` is a prerequisite used in the
// proof of `to` — arrows flow from prerequisites up to results.
// ---------------------------------------------------------------------------

// Approximate box size for a node (weight drives size; used for spacing). The
// renderer may refine this once it can measure text.
function sizeOf(node) {
  const w = node && node.weight != null ? node.weight : 2;
  return { w: 78 + w * 16, h: 26 + w * 3 };
}

// Validate + normalise a raw diagram object into a working structure, and
// compute dependency ranks. Throws on missing ids, duplicates, dangling edges,
// or a cycle (the diagram must be a DAG).
function load(obj) {
  if (!obj || !Array.isArray(obj.nodes) || !Array.isArray(obj.edges))
    throw new Error('a diagram needs nodes[] and edges[]');
  const byId = new Map();
  const nodes = obj.nodes.map((n) => {
    if (n == null || n.id == null) throw new Error('every node needs an id');
    if (byId.has(n.id)) throw new Error(`duplicate node id: '${n.id}'`);
    const node = Object.assign({ kind: 'statement', weight: 2, external: false }, n);
    byId.set(node.id, node);
    return node;
  });
  const outAdj = new Map(nodes.map((n) => [n.id, []]));
  const inAdj = new Map(nodes.map((n) => [n.id, []]));
  const edges = obj.edges.map((e, i) => {
    if (!byId.has(e.from)) throw new Error(`edge ${i}: unknown 'from' node '${e.from}'`);
    if (!byId.has(e.to)) throw new Error(`edge ${i}: unknown 'to' node '${e.to}'`);
    if (e.from === e.to) throw new Error(`edge ${i}: self-loop on '${e.from}'`);
    const edge = Object.assign({ type: 'uses' }, e);
    outAdj.get(edge.from).push(edge.to);
    inAdj.get(edge.to).push(edge.from);
    return edge;
  });
  const sources = nodes.filter((n) => inAdj.get(n.id).length === 0).map((n) => n.id);
  const sinks = nodes.filter((n) => outAdj.get(n.id).length === 0).map((n) => n.id);
  const diagram = {
    meta: obj.meta || {},
    layoutConfig: Object.assign({ engine: 'layered', direction: 'up' }, obj.layout || {}),
    nodes, edges, byId, outAdj, inAdj, sources, sinks,
  };
  computeRanks(diagram);
  return diagram;
}

// Longest-path ranks over the DAG: sources get rank 0, and rank(to) is one more
// than the deepest prerequisite. Also validates acyclicity (Kahn's algorithm).
function computeRanks(diagram) {
  const indeg = new Map(diagram.nodes.map((n) => [n.id, diagram.inAdj.get(n.id).length]));
  const rank = new Map(diagram.nodes.map((n) => [n.id, 0]));
  const queue = diagram.sources.slice();
  let seen = 0;
  while (queue.length) {
    const u = queue.shift(); seen++;
    for (const v of diagram.outAdj.get(u)) {
      if (rank.get(v) < rank.get(u) + 1) rank.set(v, rank.get(u) + 1);
      indeg.set(v, indeg.get(v) - 1);
      if (indeg.get(v) === 0) queue.push(v);
    }
  }
  if (seen !== diagram.nodes.length) throw new Error('diagram has a cycle (it must be a DAG)');
  diagram.rank = rank;
  diagram.maxRank = diagram.nodes.reduce((m, n) => Math.max(m, rank.get(n.id)), 0);
  return rank;
}

// Layered ("Sugiyama") layout: rank -> crossing reduction (median/barycenter
// sweeps) -> x-coordinate assignment (barycenter with overlap resolution).
// Returns Map(id -> {x, y, w, h, r}). Pinned nodes keep their given coordinates.
function layout(diagram, opts) {
  opts = Object.assign(
    { layerGap: 96, nodeGap: 26, sweeps: 4, margin: 24, direction: diagram.layoutConfig.direction },
    opts);
  const rank = diagram.rank;
  const layers = [];
  for (const n of diagram.nodes) { const r = rank.get(n.id); (layers[r] = layers[r] || []).push(n.id); }
  for (let r = 0; r < layers.length; r++) layers[r] = layers[r] || [];

  // order within layers: barycenter sweeps to reduce crossings
  const ord = new Map();
  layers.forEach((L) => L.forEach((id, i) => ord.set(id, i)));
  for (let s = 0; s < opts.sweeps; s++) {
    const down = s % 2 === 0;
    const seq = down ? layers.map((_, r) => r) : layers.map((_, r) => r).reverse();
    for (const r of seq) {
      const adjRank = down ? r - 1 : r + 1;
      const neigh = down ? diagram.inAdj : diagram.outAdj;
      const L = layers[r];
      const bc = new Map(L.map((id) => {
        const ns = neigh.get(id).filter((x) => rank.get(x) === adjRank);
        return [id, ns.length ? ns.reduce((a, x) => a + ord.get(x), 0) / ns.length : ord.get(id)];
      }));
      L.sort((a, b) => bc.get(a) - bc.get(b));
      L.forEach((id, i) => ord.set(id, i));
    }
  }

  // initial x by order within each layer
  const pos = new Map();
  for (let r = 0; r < layers.length; r++) {
    let x = 0;
    for (const id of layers[r]) {
      const s = sizeOf(diagram.byId.get(id));
      pos.set(id, { x: x + s.w / 2, y: 0, w: s.w, h: s.h, r });
      x += s.w + opts.nodeGap;
    }
  }
  // align each node toward the barycenter of ALL its neighbours, then push apart
  const nbr = (id) => diagram.outAdj.get(id).concat(diagram.inAdj.get(id));
  for (let s = 0; s < opts.sweeps * 2; s++) {
    for (let r = 0; r < layers.length; r++) {
      const L = layers[r];
      for (const id of L) {
        const ns = nbr(id);
        if (ns.length) { const bx = ns.reduce((a, x) => a + pos.get(x).x, 0) / ns.length; pos.get(id).x = (pos.get(id).x + bx) / 2; }
      }
      for (let i = 1; i < L.length; i++) {
        const a = pos.get(L[i - 1]), b = pos.get(L[i]);
        const minD = a.w / 2 + b.w / 2 + opts.nodeGap;
        if (b.x - a.x < minD) b.x = a.x + minD;
      }
    }
  }
  // y from rank + reading direction (up: results at top)
  for (const p of pos.values()) p.y = (opts.direction === 'up' ? diagram.maxRank - p.r : p.r) * opts.layerGap;

  // shift the auto-laid-out nodes to a margin, then stamp pinned nodes at their
  // authored (absolute) coordinates so pins are exact regardless of the shift
  const minx = Math.min(...[...pos.values()].map((p) => p.x - p.w / 2));
  const miny = Math.min(...[...pos.values()].map((p) => p.y - p.h / 2));
  for (const p of pos.values()) { p.x += opts.margin - minx; p.y += opts.margin - miny; }
  for (const n of diagram.nodes) {
    if (n.layout && n.layout.pin) { const p = pos.get(n.id); p.x = n.layout.x; p.y = n.layout.y; p.pinned = true; }
  }
  return pos;
}

// Force-directed "balance": seed from `pos`, relax with mutual repulsion + edge
// springs to even out spacing and separate overlaps. Pinned nodes stay fixed;
// keepLayers freezes the y-axis so the dependency-depth reading order is kept.
function relax(diagram, pos, opts) {
  opts = Object.assign({ iterations: 170, k: 150, spring: 0.04, cool: 0.96, keepLayers: false, gapX: 22, gapY: 12 }, opts);
  const P = new Map();
  for (const [id, p] of pos) P.set(id, { x: p.x, y: p.y, w: p.w, h: p.h, r: p.r, pinned: !!p.pinned });
  const ids = [...P.keys()];
  let temp = opts.k;
  for (let it = 0; it < opts.iterations; it++) {
    const disp = new Map(ids.map((id) => [id, { x: 0, y: 0 }]));
    for (let a = 0; a < ids.length; a++) {
      for (let b = a + 1; b < ids.length; b++) {
        const pa = P.get(ids[a]), pb = P.get(ids[b]);
        let dx = pa.x - pb.x, dy = pa.y - pb.y, d2 = dx * dx + dy * dy || 0.01, d = Math.sqrt(d2);
        const f = (opts.k * opts.k) / d2;            // long-range Coulomb repulsion
        const ux = dx / d, uy = dy / d;
        disp.get(ids[a]).x += ux * f; disp.get(ids[a]).y += uy * f;
        disp.get(ids[b]).x -= ux * f; disp.get(ids[b]).y -= uy * f;
        // size-aware collision: hard-separate boxes that overlap (with a margin)
        const minX = (pa.w + pb.w) / 2 + opts.gapX, minY = (pa.h + pb.h) / 2 + opts.gapY;
        if (Math.abs(dx) < minX && Math.abs(dy) < minY) {
          const px = minX - Math.abs(dx), py = minY - Math.abs(dy);
          if (opts.keepLayers || px <= py) { const s = (dx >= 0 ? 1 : -1) * px * 0.5; disp.get(ids[a]).x += s; disp.get(ids[b]).x -= s; }
          else { const s = (dy >= 0 ? 1 : -1) * py * 0.5; disp.get(ids[a]).y += s; disp.get(ids[b]).y -= s; }
        }
      }
    }
    for (const e of diagram.edges) {
      const pa = P.get(e.from), pb = P.get(e.to);
      let dx = pb.x - pa.x, dy = pb.y - pa.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = opts.spring * (d - opts.k);          // Hooke spring toward rest length k
      const ux = dx / d, uy = dy / d;
      disp.get(e.from).x += ux * f; disp.get(e.from).y += uy * f;
      disp.get(e.to).x -= ux * f; disp.get(e.to).y -= uy * f;
    }
    for (const id of ids) {
      const p = P.get(id); if (p.pinned) continue;
      let dx = disp.get(id).x, dy = opts.keepLayers ? 0 : disp.get(id).y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1, step = Math.min(len, temp);
      p.x += (dx / len) * step; p.y += (dy / len) * step;
    }
    temp *= opts.cool;
  }
  // when depth is frozen, guarantee clean horizontal spacing within each layer
  if (opts.keepLayers) {
    const layers = new Map();
    for (const [id, p] of P) { const L = layers.get(p.r) || layers.set(p.r, []).get(p.r); L.push(id); }
    for (const L of layers.values()) {
      L.sort((a, b) => P.get(a).x - P.get(b).x);
      for (let i = 1; i < L.length; i++) {
        const a = P.get(L[i - 1]), b = P.get(L[i]);
        const min = a.w / 2 + b.w / 2 + opts.gapX;
        if (!b.pinned && b.x - a.x < min) b.x = a.x + min;
      }
    }
  }
  return P;
}

// Derive a VIEW of the diagram with a set of nodes "ignored" (temporarily
// hidden). Edges are contracted transitively: if A -> I -> C and I is ignored,
// the view gets A -> C. Edge-type rule along/among contracted paths: two
// "generalizes" links compose to "generalizes"; any "uses" link makes the
// result "uses" (dependence is the dominant allele). Parallel evidence merges
// the same way. Returns a raw spec { meta, layout, nodes, edges } for load().
function deriveView(diagram, ignoredIds) {
  const ignored = ignoredIds instanceof Set ? ignoredIds : new Set(ignoredIds || []);
  const kept = diagram.nodes.filter((n) => !ignored.has(n.id));
  const keptSet = new Set(kept.map((n) => n.id));
  const out = new Map(diagram.nodes.map((n) => [n.id, []]));
  for (const e of diagram.edges) out.get(e.from).push({ to: e.to, type: e.type === 'generalizes' ? 'generalizes' : 'uses' });
  // 'uses' dominates: only generalizes+generalizes stays generalizes
  const combine = (a, b) => (a === 'generalizes' && b === 'generalizes') ? 'generalizes' : 'uses';
  const merged = new Map(); // "from\0to" -> type
  const add = (u, v, t) => { const k = u + ' ' + v; merged.set(k, merged.has(k) ? combine(merged.get(k), t) : t); };
  for (const u of kept) {
    // walk out from u through ignored intermediates to the next kept nodes
    const stack = [];
    for (const e of out.get(u.id)) {
      if (keptSet.has(e.to)) add(u.id, e.to, e.type);
      else if (ignored.has(e.to)) stack.push({ node: e.to, type: e.type, seen: new Set([u.id, e.to]) });
    }
    while (stack.length) {
      const cur = stack.pop();
      for (const e of out.get(cur.node)) {
        const t = combine(cur.type, e.type);
        if (keptSet.has(e.to)) add(u.id, e.to, t);
        else if (ignored.has(e.to) && !cur.seen.has(e.to)) {
          const seen = new Set(cur.seen); seen.add(e.to);
          stack.push({ node: e.to, type: t, seen });
        }
      }
    }
  }
  const edges = [];
  for (const [k, type] of merged) { const [from, to] = k.split(' '); if (from !== to) edges.push({ from, to, type }); }
  return { meta: diagram.meta, layout: diagram.layoutConfig, nodes: kept, edges };
}

// number of overlapping node-box pairs (a layout-quality probe, used by tests)
function overlaps(pos) {
  const a = [...pos.values()]; let n = 0;
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) {
    const p = a[i], q = a[j];
    if (Math.abs(p.x - q.x) < (p.w + q.w) / 2 && Math.abs(p.y - q.y) < (p.h + q.h) / 2) n++;
  }
  return n;
}

const API = { load, computeRanks, layout, relax, sizeOf, overlaps, deriveView };
if (typeof window !== 'undefined') window.PaperDiagram = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
