// ---------------------------------------------------------------------------
// Paper-diagram viewer — export targets (standalone, DOM-free).
//
// Turns a loaded diagram (+ its computed positions) into two portable formats:
//   * TikZ  — a compilable standalone figure of the dependency graph.
//   * quiver — a q.uiver.app import URL (its `#q=` base64 array format).
//
// Text policy: the on-screen VIEWER prefers a node's plain-text paraphrase
// (`plain`); EXPORTS use `label` and `name` as the node text, the full LaTeX
// `statement` carried as a comment. `label`/`name` are authored as plain Unicode
// (that is what the viewer shows), so for the LaTeX targets they go through
// texText(): TeX-special ASCII is escaped and the Unicode we use is mapped to
// LaTeX macros, while any intentional `$...$` math span is left VERBATIM (so an
// author who writes `$c_i$` still gets `$c_i$`). Exports never emit `plain`.
// NOTE: quiver renders labels with a limited LaTeX subset (KaTeX-like); texText
// covers the common cases, but exotic macros may not render there — see the JSON
// format notes in paper-diagram.html.
// ---------------------------------------------------------------------------

// flatten a LaTeX string to a single line so it is safe inside a `%` comment
const texComment = (s) => String(s == null ? '' : s).replace(/\r?\n/g, ' ');

// a TikZ-safe node name (letters/digits/underscore only)
const texId = (id) => 'n_' + String(id).replace(/[^A-Za-z0-9]/g, '_');

// -- LaTeX-safe node text -------------------------------------------------
// label/name are authored as plain Unicode text (that is what the viewer shows),
// so for LaTeX targets we must escape the TeX-special ASCII characters and map
// the Unicode symbols we use to LaTeX macros — while leaving any intentional
// `$...$` math span untouched. Everything maps to base LaTeX + amssymb.
const TEX_ESC = {
  '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '$': '\\$', '&': '\\&',
  '#': '\\#', '%': '\\%', '_': '\\_', '^': '\\textasciicircum{}', '~': '\\textasciitilde{}',
};
const TEX_UNI = {
  '§': '\\S{}', '·': '$\\cdot$', '×': '$\\times$', '−': '$-$', '–': '--', '—': '---',
  '…': '$\\ldots$', '′': "${}'$", '‖': '$\\|$', '□': '$\\square$', '∅': '$\\emptyset$', '∞': '$\\infty$',
  '¹': '${}^1$', '²': '${}^2$', '³': '${}^3$', '⁴': '${}^4$', '⁶': '${}^6$', '⁻': '${}^{-}$', 'ⁿ': '${}^n$',
  'ⁱ': '${}^i$', 'ᵐ': '${}^m$', '⁺': '${}^{+}$',
  '₀': '${}_0$', '₁': '${}_1$', '₂': '${}_2$', '₃': '${}_3$', '₄': '${}_4$', 'ᵢ': '${}_i$',
  'ₘ': '${}_m$', 'ₙ': '${}_n$', 'ₖ': '${}_k$', '₊': '${}_{+}$', '₋': '${}_{-}$',
  '→': '$\\to$', '↦': '$\\mapsto$', '↔': '$\\leftrightarrow$', '⇒': '$\\Rightarrow$', '⇐': '$\\Leftarrow$', '⇔': '$\\Leftrightarrow$',
  '⟹': '$\\Longrightarrow$', '⟺': '$\\Longleftrightarrow$', '↗': '$\\nearrow$', '↘': '$\\searrow$',
  '⊕': '$\\oplus$', '⊗': '$\\otimes$', '⊎': '$\\uplus$', '⊂': '$\\subset$', '⊆': '$\\subseteq$',
  '∈': '$\\in$', '∪': '$\\cup$', '∩': '$\\cap$', '∂': '$\\partial$', '∇': '$\\nabla$', '∫': '$\\int$', '√': '$\\surd$',
  '≅': '$\\cong$', '≃': '$\\simeq$', '≈': '$\\approx$', '∼': '$\\sim$', '≡': '$\\equiv$', '≠': '$\\neq$',
  '≤': '$\\le$', '≥': '$\\ge$', '≪': '$\\ll$', '≲': '$\\lesssim$',
  'Γ': '$\\Gamma$', 'Δ': '$\\Delta$', 'Θ': '$\\Theta$', 'Λ': '$\\Lambda$', 'Ξ': '$\\Xi$', 'Π': '$\\Pi$',
  'Σ': '$\\Sigma$', 'Φ': '$\\Phi$', 'Ψ': '$\\Psi$', 'Ω': '$\\Omega$',
  'α': '$\\alpha$', 'β': '$\\beta$', 'γ': '$\\gamma$', 'δ': '$\\delta$', 'ε': '$\\varepsilon$', 'ζ': '$\\zeta$',
  'η': '$\\eta$', 'θ': '$\\theta$', 'κ': '$\\kappa$', 'λ': '$\\lambda$', 'μ': '$\\mu$', 'ν': '$\\nu$', 'ξ': '$\\xi$',
  'π': '$\\pi$', 'ρ': '$\\rho$', 'ϱ': '$\\varrho$', 'σ': '$\\sigma$', 'τ': '$\\tau$', 'υ': '$\\upsilon$',
  'φ': '$\\varphi$', 'χ': '$\\chi$', 'ψ': '$\\psi$', 'ω': '$\\omega$',
  'ℝ': '$\\mathbb{R}$', '𝕋': '$\\mathbb{T}$', '𝒲': '$\\mathcal{W}$', 'ℓ': '$\\ell$',
  'Ṽ': '$\\tilde{V}$', 'Ẽ': '$\\tilde{E}$',
  'á': "\\'a", 'é': "\\'e", 'ó': "\\'o", 'ö': '\\"o', 'ő': '\\H{o}', 'Ã': '\\~A',
};
function texSeg(seg) {   // escape/map one non-math segment
  let out = '';
  for (const ch of seg) out += (TEX_ESC[ch] != null ? TEX_ESC[ch] : (TEX_UNI[ch] != null ? TEX_UNI[ch] : ch));
  return out;
}
function texText(s) {   // preserve `$...$` math spans verbatim; escape/map the rest
  s = String(s == null ? '' : s);
  let out = '', last = 0; const re = /\$[^$]*\$/g; let m;
  while ((m = re.exec(s))) { out += texSeg(s.slice(last, m.index)) + m[0]; last = re.lastIndex; }
  return out + texSeg(s.slice(last));
}

// kind -> border colour (hex, no leading #); mirrors the viewer's palette
const KIND_HEX = {
  theorem: '3A5BD9', proposition: '1D9A9A', lemma: '2F9E57',
  corollary: '7C5CFF', definition: 'D98324', remark: '8A8F98',
};

// A node's optional background fill. safeFill() sanitises a colour for direct use
// in an SVG attribute (hex, CSS name, or rgb()/hsl()); hexOf() normalises a hex
// colour to 'RRGGBB' for TikZ's \definecolor. Both reject anything else, so an
// unrepresentable/hostile value simply falls back to the default (white).
function safeFill(c) {
  c = String(c == null ? '' : c).trim();
  if (/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(c)) return c;
  if (/^[a-zA-Z]{1,24}$/.test(c)) return c;
  if (/^(?:rgb|hsl)a?\([0-9.,%/deg\s]+\)$/.test(c)) return c;
  return '';
}
function hexOf(c) {
  c = String(c == null ? '' : c).trim();
  let m = /^#([0-9a-fA-F]{6})$/.exec(c);
  if (m) return m[1].toUpperCase();
  m = /^#([0-9a-fA-F]{3})$/.exec(c);
  if (m) return (m[1][0] + m[1][0] + m[1][1] + m[1][1] + m[1][2] + m[1][2]).toUpperCase();
  return '';
}

// -- TikZ ------------------------------------------------------------------
// A standalone (default) or bare tikzpicture. Node positions come straight
// from the auto-layout (px scaled to cm, y flipped so results sit at the top).
function toTikz(diagram, pos, opts) {
  opts = Object.assign({ standalone: true, scale: 1 / 62 }, opts);
  const s = opts.scale;
  const P = (id) => pos.get(id);
  const kinds = [...new Set(diagram.nodes.map((n) => n.kind))];

  const colorDefs = kinds
    .filter((k) => KIND_HEX[k])
    .map((k) => `\\definecolor{kd${k}}{HTML}{${KIND_HEX[k]}}`)
    .join('\n');

  // one \definecolor per distinct node background colour (hex only)
  const fillName = new Map();
  const fillDefs = [];
  for (const n of diagram.nodes) {
    const hx = hexOf(n.color);
    if (hx && !fillName.has(hx)) { const nm = 'nf' + fillName.size; fillName.set(hx, nm); fillDefs.push(`\\definecolor{${nm}}{HTML}{${hx}}`); }
  }

  const head = [
    `% Dependency diagram${diagram.meta && diagram.meta.title ? ': ' + diagram.meta.title : ''}`,
    `% Generated from the tao-web paper-diagram viewer. Node positions are the`,
    `% viewer's automatic layout; edit freely. Arrows: solid = "uses", dashed = "generalizes".`,
  ].join('\n');

  const pic = [
    `\\begin{tikzpicture}[`,
    `  stmt/.style={draw, rounded corners=2pt, inner sep=3pt, align=center, font=\\scriptsize, fill=white, text=black},`,
    `  uses/.style={-{Stealth[length=5pt]}, draw=gray},`,
    `  gen/.style={-{Stealth[length=5pt]}, draw=gray, dashed}]`,
  ];

  for (const n of diagram.nodes) {
    const p = P(n.id); if (!p) continue;
    const x = (p.x * s).toFixed(2), y = (-p.y * s).toFixed(2);
    const col = KIND_HEX[n.kind] ? `kd${n.kind}` : 'black';
    const lw = (0.6 + (n.weight == null ? 2 : n.weight) * 0.35).toFixed(2); // heavier border = higher weight
    const dash = n.external ? ', dashed' : '';
    const fill = hexOf(n.color) ? `, fill=${fillName.get(hexOf(n.color))}` : '';
    const label = `\\textbf{${texText(n.label || n.id)}}`
      + (n.name ? `\\\\{\\tiny ${texText(n.name)}}` : '');
    if (n.statement) pic.push(`  % ${texComment(n.label || n.id)}: ${texComment(n.statement)}`);
    pic.push(`  \\node[stmt, draw=${col}, line width=${lw}pt${dash}${fill}] (${texId(n.id)}) at (${x}, ${y}) {${label}};`);
  }
  for (const e of diagram.edges) {
    const style = e.type === 'generalizes' ? 'gen' : 'uses';
    pic.push(`  \\draw[${style}] (${texId(e.from)}) -- (${texId(e.to)});`);
  }
  pic.push(`\\end{tikzpicture}`);

  const body = [colorDefs, fillDefs.join('\n')].filter(Boolean).join('\n') + '\n' + pic.join('\n');
  if (!opts.standalone) return head + '\n' + body + '\n';
  return [
    `\\documentclass[tikz,border=8pt]{standalone}`,
    `\\usepackage{amsmath,amssymb}`,
    `\\usetikzlibrary{arrows.meta}`,
    `\\begin{document}`,
    head,
    body,
    `\\end{document}`,
    '',
  ].join('\n');
}

// -- quiver ----------------------------------------------------------------
// Build quiver's export array: [version, vertexCount, ...vertices, ...edges].
// A vertex is [col, row, label]; an edge is [srcIndex, tgtIndex, label].
// Grid: row = dependency depth (results at the top), col = left-to-right order.
function toQuiver(diagram, pos) {
  const dir = (diagram.layoutConfig && diagram.layoutConfig.direction) || 'up';
  const idx = new Map(diagram.nodes.map((n, i) => [n.id, i]));
  const rankOf = (id) => diagram.rank.get(id);

  // group nodes by their grid row, then order within a row by x
  const byRow = new Map();
  for (const n of diagram.nodes) {
    const r = dir === 'up' ? diagram.maxRank - rankOf(n.id) : rankOf(n.id);
    (byRow.get(r) || byRow.set(r, []).get(r)).push(n.id);
  }
  const col = new Map();
  for (const ids of byRow.values()) {
    ids.sort((a, b) => (pos.get(a).x - pos.get(b).x));
    ids.forEach((id, i) => col.set(id, i));
  }

  const vertices = diagram.nodes.map((n) => {
    const r = dir === 'up' ? diagram.maxRank - rankOf(n.id) : rankOf(n.id);
    const label = `\\text{${texText(n.name || n.label || n.id)}}`;
    return [col.get(n.id), r, label];
  });
  const edges = diagram.edges.map((e) => [idx.get(e.from), idx.get(e.to), '']);
  return [0, diagram.nodes.length, ...vertices, ...edges];
}

// UTF-8-safe base64 (browser btoa or Node Buffer)
function b64(str) {
  if (typeof btoa !== 'undefined') return btoa(unescape(encodeURIComponent(str)));
  return Buffer.from(str, 'utf8').toString('base64');
}
function toQuiverURL(diagram, pos) {
  return 'https://q.uiver.app/#q=' + b64(JSON.stringify(toQuiver(diagram, pos)));
}

// -- SVG -------------------------------------------------------------------
// A standalone, self-contained SVG of the current layout (positions from pos,
// styling baked in as attributes with concrete colours — no external CSS). It
// mirrors the on-screen figure: rounded rects sized by weight, kind colour on
// the border, dashed for external, solid/dashed arrows for uses/generalizes.
function svgEsc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function toSvg(diagram, pos, opts) {
  opts = Object.assign({ pad: 26 }, opts);
  const C = { bg: '#ffffff', ink: '#1b1f24', muted: '#8a8f98', uses: '#8a9099', gen: '#3a5bd9' };
  const P = [...pos.values()];
  if (!P.length) return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>\n';
  const minX = Math.min(...P.map((p) => p.x - p.w / 2)) - opts.pad;
  const minY = Math.min(...P.map((p) => p.y - p.h / 2)) - opts.pad;
  const w = Math.max(...P.map((p) => p.x + p.w / 2)) + opts.pad - minX;
  const h = Math.max(...P.map((p) => p.y + p.h / 2)) + opts.pad - minY;
  // exit point of the segment from p's centre toward (tx,ty), on p's rectangle
  const clip = (p, tx, ty) => {
    const dx = tx - p.x, dy = ty - p.y; if (!dx && !dy) return { x: p.x, y: p.y };
    const t = Math.min(dx ? (p.w / 2) / Math.abs(dx) : Infinity, dy ? (p.h / 2) / Math.abs(dy) : Infinity);
    return { x: p.x + dx * t, y: p.y + dy * t };
  };
  const defs = '<defs>'
    + `<marker id="au" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.uses}"/></marker>`
    + `<marker id="ag" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.gen}"/></marker>`
    + '</defs>';
  const edges = diagram.edges.map((e) => {
    const a = pos.get(e.from), b = pos.get(e.to); if (!a || !b) return '';
    const s = clip(a, b.x, b.y), t = clip(b, a.x, a.y), gen = e.type === 'generalizes';
    return `<line x1="${s.x.toFixed(1)}" y1="${s.y.toFixed(1)}" x2="${t.x.toFixed(1)}" y2="${t.y.toFixed(1)}" stroke="${gen ? C.gen : C.uses}" stroke-width="1.3"${gen ? ' stroke-dasharray="5 3"' : ''} marker-end="url(#${gen ? 'ag' : 'au'})"/>`;
  }).join('');
  const nodes = diagram.nodes.map((n) => {
    const p = pos.get(n.id); if (!p) return '';
    const x = (p.x - p.w / 2).toFixed(1), y = (p.y - p.h / 2).toFixed(1);
    const hue = KIND_HEX[n.kind] ? '#' + KIND_HEX[n.kind] : C.muted;
    const fill = safeFill(n.color) || C.bg;
    const sw = (0.6 + (n.weight == null ? 2 : n.weight) * 0.8).toFixed(2);
    const dash = n.external ? ' stroke-dasharray="5 3"' : '';
    const nm = n.name
      ? `<text x="${p.x.toFixed(1)}" y="${(p.y + 12).toFixed(1)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="${C.muted}">${svgEsc(n.name.length > Math.floor(p.w / 5.4) ? n.name.slice(0, Math.floor(p.w / 5.4) - 1) + '…' : n.name)}</text>`
      : '';
    return '<g>'
      + `<rect x="${x}" y="${y}" width="${p.w}" height="${p.h}" rx="6" fill="${fill}" stroke="${hue}" stroke-width="${sw}"${dash}/>`
      + `<text x="${p.x.toFixed(1)}" y="${(p.y - 2).toFixed(1)}" text-anchor="middle" font-family="ui-monospace, monospace" font-weight="600" font-size="12" fill="${C.ink}">${svgEsc(n.label || n.id)}</text>`
      + nm + '</g>';
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX.toFixed(0)} ${minY.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}">`
    + `<rect x="${minX.toFixed(0)}" y="${minY.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${C.bg}"/>`
    + defs + `<g>${edges}</g><g>${nodes}</g></svg>\n`;
}

// -- Graphviz DOT ----------------------------------------------------------
// A directed graph in the DOT language (Graphviz, and many other tools do its
// own layout). Arrows point prerequisite -> result; kind colour on the border,
// per-node fill, dashed border for external, dashed edge for "generalizes".
// NOT LaTeX — labels are plain UTF-8 text (Graphviz renders Unicode directly).
function dotStr(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n'); }
function toDot(diagram) {
  const dir = (diagram.layoutConfig && diagram.layoutConfig.direction) || 'up';
  const lines = [
    `// Dependency diagram${diagram.meta && diagram.meta.title ? ': ' + diagram.meta.title : ''}`,
    `// Generated from the tao-web paper-diagram viewer. Arrows: prerequisite -> result.`,
    `digraph paper {`,
    `  rankdir=${dir === 'up' ? 'BT' : 'TB'};`,
    `  node [shape=box, style="rounded,filled", fontname="Helvetica", fontsize=10, fillcolor="#ffffff", color="#8a8f98"];`,
    `  edge [color="#8a9099"];`,
  ];
  for (const n of diagram.nodes) {
    const text = (n.label || n.id) + (n.name ? '\n' + n.name : '');
    const a = [`label="${dotStr(text)}"`];
    if (KIND_HEX[n.kind]) a.push(`color="#${KIND_HEX[n.kind]}"`);
    const fill = safeFill(n.color); if (fill) a.push(`fillcolor="${fill}"`);
    a.push(`penwidth=${(0.6 + (n.weight == null ? 2 : n.weight) * 0.35).toFixed(2)}`);
    if (n.external) a.push(`style="rounded,filled,dashed"`);
    lines.push(`  "${dotStr(n.id)}" [${a.join(', ')}];`);
  }
  for (const e of diagram.edges) {
    lines.push(`  "${dotStr(e.from)}" -> "${dotStr(e.to)}"${e.type === 'generalizes' ? ' [style=dashed]' : ''};`);
  }
  lines.push('}', '');
  return lines.join('\n');
}

// -- Mermaid ---------------------------------------------------------------
// A Mermaid flowchart (renders on GitHub, many wikis, and mermaid.live), auto
// laid out from the dependency structure. Plain-text labels; per-node colour via
// `style`. Ids are sanitised (Mermaid ids are alphanumeric) and de-collided.
function mermTxt(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/\r?\n/g, '<br/>');
}
function toMermaid(diagram) {
  const dir = (diagram.layoutConfig && diagram.layoutConfig.direction) || 'up';
  const mid = new Map(), seen = new Set();
  for (const n of diagram.nodes) {
    let base = 'n_' + String(n.id).replace(/[^A-Za-z0-9]/g, '_'), id = base, k = 1;
    while (seen.has(id)) id = base + '_' + (k++);
    seen.add(id); mid.set(n.id, id);
  }
  const lines = [
    `%% Dependency diagram${diagram.meta && diagram.meta.title ? ': ' + diagram.meta.title : ''}`,
    `%% Generated from the tao-web paper-diagram viewer. Arrows: prerequisite --> result.`,
    `flowchart ${dir === 'up' ? 'BT' : 'TB'}`,
  ];
  const styles = [];
  for (const n of diagram.nodes) {
    const text = (n.label || n.id) + (n.name ? '\n' + n.name : '');
    lines.push(`  ${mid.get(n.id)}["${mermTxt(text)}"]`);
    const p = [];
    const fill = safeFill(n.color); if (fill) p.push(`fill:${fill}`);
    if (KIND_HEX[n.kind]) p.push(`stroke:#${KIND_HEX[n.kind]}`);
    p.push(`stroke-width:${(0.6 + (n.weight == null ? 2 : n.weight) * 0.35).toFixed(2)}px`);
    if (n.external) p.push('stroke-dasharray:4 3');
    styles.push(`  style ${mid.get(n.id)} ${p.join(',')}`);
  }
  for (const e of diagram.edges) {
    lines.push(`  ${mid.get(e.from)} ${e.type === 'generalizes' ? '-.->' : '-->'} ${mid.get(e.to)}`);
  }
  return lines.concat(styles).join('\n') + '\n';
}

const API = { toTikz, toQuiver, toQuiverURL, toSvg, toDot, toMermaid, texId };
if (typeof window !== 'undefined') window.PaperDiagramExport = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
