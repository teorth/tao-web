// ---------------------------------------------------------------------------
// 21st-century orrery — logic core (standalone, DOM-free).
//
// An IDEALIZED sky model, not an ephemeris: circular orbits at constant rates,
// the Sun and Moon on the ecliptic, a fixed 23.44° tilt. Its job is to turn a
// time + an observer (latitude, longitude) into directions in the observer's
// own horizon frame (altitude/azimuth), so the renderer can place the Sun, Moon
// and stars — and to give the ONE genuinely to-scale quantity, the horizon dip
// as a function of eye height, which is the app's honest "the Earth is a ball"
// money shot. Angles are in degrees; time t is in days since the epoch.
//
// Epoch (t = 0): local apparent noon on the prime meridian at the northward
// (vernal) equinox, chosen to also be a new moon — so Sun ecliptic longitude,
// Sun right ascension, local sidereal time at longitude 0, and the Sun–Moon
// elongation are all 0 at t = 0. Everything else follows by constant rates.
// ---------------------------------------------------------------------------

var DEG = Math.PI / 180, RAD = 180 / Math.PI;

var C = {
  EARTH_RADIUS_M: 6371000,      // volumetric mean radius
  OBLIQUITY_DEG: 23.44,         // axial tilt (ecliptic vs equator)
  TROPICAL_YEAR: 365.2422,      // days, equinox to equinox
  SIDEREAL_MONTH: 27.32166,     // days, Moon's orbit relative to the stars
  SUN_ANGULAR_DIAM_DEG: 0.533,  // ~32 arcmin — the angle the first-person view keeps honest
  MOON_ANGULAR_DIAM_DEG: 0.518, // ~31 arcmin
};
// Earth's rotation relative to the stars: one extra turn per orbit per year.
C.SIDEREAL_DAY = C.TROPICAL_YEAR / (C.TROPICAL_YEAR + 1);            // ~0.99727 d
// Phase period (Sun–Moon realignment): 1/(1/sidereal_month − 1/year).
C.SYNODIC_MONTH = 1 / (1 / C.SIDEREAL_MONTH - 1 / C.TROPICAL_YEAR);  // ~29.53 d

function normalizeDeg(x) { return ((x % 360) + 360) % 360; }
function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }

// Ecliptic longitude λ (deg) → equatorial right ascension / declination (deg).
function eclipticToEquatorial(lonDeg) {
  var lam = lonDeg * DEG, e = C.OBLIQUITY_DEG * DEG;
  var dec = Math.asin(clamp(Math.sin(e) * Math.sin(lam), -1, 1));
  var ra = Math.atan2(Math.cos(e) * Math.sin(lam), Math.cos(lam));
  return { raDeg: normalizeDeg(ra * RAD), decDeg: dec * RAD };
}

// Idealized ecliptic longitudes (deg) of Sun and Moon at time t (days).
function sunEclipticLon(t) { return normalizeDeg(360 * t / C.TROPICAL_YEAR); }
function moonEclipticLon(t) { return normalizeDeg(360 * t / C.SIDEREAL_MONTH); }

// Local sidereal time (deg): the RA currently on the observer's meridian.
function siderealTimeDeg(t, lonDeg) { return normalizeDeg(360 * t / C.SIDEREAL_DAY + lonDeg); }

// Equatorial (dec, hour angle) + latitude → local horizontal (alt, az).
// Azimuth is measured from North, increasing eastward (N 0°, E 90°, S 180°, W 270°).
function horizontalFromHA(decDeg, haDeg, latDeg) {
  var d = decDeg * DEG, H = haDeg * DEG, phi = latDeg * DEG;
  var sinAlt = clamp(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H), -1, 1);
  var alt = Math.asin(sinAlt);
  var az = Math.atan2(-Math.cos(d) * Math.sin(H),
                      Math.sin(d) * Math.cos(phi) - Math.cos(d) * Math.sin(phi) * Math.cos(H));
  return { altDeg: alt * RAD, azDeg: normalizeDeg(az * RAD) };
}

// A fixed star (given equatorial coords) as seen by the observer at time t.
function starPosition(raDeg, decDeg, t, latDeg, lonDeg) {
  var ha = normalizeDeg(siderealTimeDeg(t, lonDeg) - raDeg);
  var h = horizontalFromHA(decDeg, ha, latDeg);
  return { raDeg: normalizeDeg(raDeg), decDeg: decDeg, haDeg: ha, altDeg: h.altDeg, azDeg: h.azDeg };
}

function _bodyPosition(eclipticLonDeg, t, latDeg, lonDeg) {
  var eq = eclipticToEquatorial(eclipticLonDeg);
  var s = starPosition(eq.raDeg, eq.decDeg, t, latDeg, lonDeg);
  return { eclipticLonDeg: normalizeDeg(eclipticLonDeg), raDeg: eq.raDeg, decDeg: eq.decDeg,
           haDeg: s.haDeg, altDeg: s.altDeg, azDeg: s.azDeg };
}
function sunPosition(t, latDeg, lonDeg) { return _bodyPosition(sunEclipticLon(t), t, latDeg, lonDeg); }
function moonPosition(t, latDeg, lonDeg) { return _bodyPosition(moonEclipticLon(t), t, latDeg, lonDeg); }

// Moon phase purely as geometry: the Sun–Moon elongation drives the lit fraction.
function phaseName(elongDeg) {
  var e = normalizeDeg(elongDeg);
  if (e < 11.25 || e >= 348.75) return 'new';
  if (e < 78.75) return 'waxing crescent';
  if (e < 101.25) return 'first quarter';
  if (e < 168.75) return 'waxing gibbous';
  if (e < 191.25) return 'full';
  if (e < 258.75) return 'waning gibbous';
  if (e < 281.25) return 'last quarter';
  return 'waning crescent';
}
function moonPhase(t) {
  var elong = normalizeDeg(moonEclipticLon(t) - sunEclipticLon(t));
  return {
    elongationDeg: elong,
    illuminatedFraction: (1 - Math.cos(elong * DEG)) / 2,   // 0 at new, 1 at full
    waxing: elong < 180,
    name: phaseName(elong),
  };
}

// The one to-scale quantity: horizon dip below astronomical horizontal, plus the
// line-of-sight and along-surface distance to the horizon, for eye height h (m).
function horizonDip(heightM, radiusM) {
  var R = radiusM || C.EARTH_RADIUS_M, h = Math.max(0, heightM);
  var dip = Math.acos(clamp(R / (R + h), -1, 1));           // radians
  return {
    dipDeg: dip * RAD,
    lineOfSightM: Math.sqrt(h * (2 * R + h)),                // straight-line to the horizon
    surfaceM: R * dip,                                       // great-circle distance to it
  };
}

// --------------------------------------------------------------------------
// Naked-eye planets. Approximate mean Keplerian elements (a AU, e, i/Ω/ϖ/L in
// degrees, per = orbital period in days). Idealized like the rest of the model:
// the RATES and orbit shapes are realistic (so retrograde loops appear), but the
// absolute phase is not tied to a real calendar date.
var PLANET_EL = {
  mercury: { a: 0.38710, e: 0.20563, i: 7.005, om: 48.331, pi: 77.456, L0: 252.251, per: 87.969 },
  venus: { a: 0.72333, e: 0.00677, i: 3.395, om: 76.680, pi: 131.564, L0: 181.980, per: 224.701 },
  mars: { a: 1.52368, e: 0.09340, i: 1.850, om: 49.558, pi: 336.041, L0: 355.453, per: 686.980 },
  jupiter: { a: 5.20260, e: 0.04849, i: 1.303, om: 100.464, pi: 14.331, L0: 34.351, per: 4332.589 },
  saturn: { a: 9.55491, e: 0.05551, i: 2.489, om: 113.665, pi: 93.057, L0: 49.954, per: 10759.22 },
  uranus: { a: 19.18916, e: 0.04726, i: 0.773, om: 74.017, pi: 170.954, L0: 313.238, per: 30688.5 },   // telescopic (1781)
  neptune: { a: 30.06992, e: 0.00859, i: 1.770, om: 131.784, pi: 44.965, L0: 304.880, per: 60182 },    // telescopic (1846)
  pluto: { a: 39.482, e: 0.2488, i: 17.16, om: 110.299, pi: 224.075, L0: 238.929, per: 90560 },   // the disputed one — resolvable by the app's checkbox
};
var PLANET_NAMES = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];   // the eight-minus-Earth; Pluto is opt-in
// mean equatorial diameters (km) — for the telescope readout and its exaggerated disc sizes.
var PLANET_DIAM_KM = { mercury: 4879, venus: 12104, mars: 6779, jupiter: 139820, saturn: 116460, uranus: 50724, neptune: 49244, pluto: 2377 };

// General ecliptic (lon, lat) → equatorial (RA, dec), in degrees.
function eclToEquatorial(lonDeg, latDeg) {
  var lam = lonDeg * DEG, bet = latDeg * DEG, e = C.OBLIQUITY_DEG * DEG;
  var dec = Math.asin(clamp(Math.sin(bet) * Math.cos(e) + Math.cos(bet) * Math.sin(e) * Math.sin(lam), -1, 1));
  var ra = Math.atan2(Math.sin(lam) * Math.cos(e) - Math.tan(bet) * Math.sin(e), Math.cos(lam));
  return { raDeg: normalizeDeg(ra * RAD), decDeg: dec * RAD };
}
// Heliocentric ecliptic rectangular position (AU) from a mean anomaly M (radians).
// Sweeping M over 0..2π traces the whole (eccentric, inclined) orbit — used both for a
// planet's live position and for drawing its orbit path in the God's-eye view.
function helioFromM(el, M) {
  var E = M;
  for (var k = 0; k < 7; k++) E = E - (E - el.e * Math.sin(E) - M) / (1 - el.e * Math.cos(E));
  var xv = el.a * (Math.cos(E) - el.e), yv = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
  var v = Math.atan2(yv, xv), r = Math.hypot(xv, yv);
  var om = el.om * DEG, inc = el.i * DEG, w = (el.pi - el.om) * DEG, u = v + w;
  return [r * (Math.cos(om) * Math.cos(u) - Math.sin(om) * Math.sin(u) * Math.cos(inc)),
          r * (Math.sin(om) * Math.cos(u) + Math.cos(om) * Math.sin(u) * Math.cos(inc)),
          r * (Math.sin(u) * Math.sin(inc))];
}
// Heliocentric ecliptic rectangular position (AU) of a planet at time t (days).
function helioEcliptic(el, t) { return helioFromM(el, (el.L0 + 360 * t / el.per - el.pi) * DEG); }
// Earth's own heliocentric position (AU): the idealized circular 1-AU orbit in the ecliptic plane
// (Earth sits opposite the Sun's geocentric longitude).
function earthHeliocentric(t) { var lamE = (sunEclipticLon(t) + 180) * DEG; return [Math.cos(lamE), Math.sin(lamE), 0]; }
// A planet's local alt/az (and RA/dec, geocentric distance) for an observer.
function planetPosition(name, t, latDeg, lonDeg) {
  var ph = helioEcliptic(PLANET_EL[name], t);
  var lamE = (sunEclipticLon(t) + 180) * DEG, g = [ph[0] - Math.cos(lamE), ph[1] - Math.sin(lamE), ph[2]];   // geocentric (Earth circular, 1 AU)
  var dist = Math.hypot(g[0], g[1], g[2]);
  var eclLon = normalizeDeg(Math.atan2(g[1], g[0]) * RAD), eclLat = Math.atan2(g[2], Math.hypot(g[0], g[1])) * RAD;
  var rd = eclToEquatorial(eclLon, eclLat), ha = normalizeDeg(siderealTimeDeg(t, lonDeg) - rd.raDeg), h = horizontalFromHA(rd.decDeg, ha, latDeg);
  return { altDeg: h.altDeg, azDeg: h.azDeg, raDeg: rd.raDeg, decDeg: rd.decDeg, eclLonDeg: eclLon, distAU: dist, haDeg: ha };
}

// A satellite on a circular orbit, seen by a ground observer (TOPOCENTRIC — the observer's own
// position matters a lot in low orbit). Elements: a = orbit radius in Earth radii, i/raan/phase in
// degrees, per = period in days. Geostationary falls out as i=0, per=SIDEREAL_DAY (it hangs fixed).
function satellitePosition(el, t, latDeg, lonDeg) {
  var M = (el.phase + 360 * t / el.per) * DEG, x = el.a * Math.cos(M), y = el.a * Math.sin(M);
  var inc = el.i * DEG, om = el.raan * DEG, yi = y * Math.cos(inc), zi = y * Math.sin(inc);
  var sx = x * Math.cos(om) - yi * Math.sin(om), sy = x * Math.sin(om) + yi * Math.cos(om), sz = zi;   // geocentric equatorial (inertial)
  var th = siderealTimeDeg(t, lonDeg) * DEG, phi = latDeg * DEG, cp = Math.cos(phi), sp = Math.sin(phi), ct = Math.cos(th), stt = Math.sin(th);
  var ox = cp * ct, oy = cp * stt, oz = sp;                       // observer position (unit = 1 Earth radius)
  var tx = sx - ox, ty = sy - oy, tz = sz - oz, tl = Math.hypot(tx, ty, tz) || 1;   // topocentric vector
  var upx = ox, upy = oy, upz = oz, ex = -stt, ey = ct, ez = 0;   // local up + east
  var nx = -sp * ct, ny = -sp * stt, nz = cp;                     // local north
  var alt = Math.asin(clamp((tx * upx + ty * upy + tz * upz) / tl, -1, 1));
  var az = Math.atan2(tx * ex + ty * ey + tz * ez, tx * nx + ty * ny + tz * nz);
  return { altDeg: alt * RAD, azDeg: normalizeDeg(az * RAD), distER: tl };
}

var API = {
  CONST: C, DEG: DEG, RAD: RAD,
  normalizeDeg: normalizeDeg,
  eclipticToEquatorial: eclipticToEquatorial, eclToEquatorial: eclToEquatorial,
  sunEclipticLon: sunEclipticLon, moonEclipticLon: moonEclipticLon,
  siderealTimeDeg: siderealTimeDeg, horizontalFromHA: horizontalFromHA,
  starPosition: starPosition, sunPosition: sunPosition, moonPosition: moonPosition,
  moonPhase: moonPhase, phaseName: phaseName, horizonDip: horizonDip,
  PLANET_EL: PLANET_EL, PLANET_NAMES: PLANET_NAMES, PLANET_DIAM_KM: PLANET_DIAM_KM, planetPosition: planetPosition,
  helioFromM: helioFromM, helioEcliptic: helioEcliptic, earthHeliocentric: earthHeliocentric, satellitePosition: satellitePosition,
};
if (typeof window !== 'undefined') window.Orrery = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
