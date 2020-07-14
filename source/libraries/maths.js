import random from "./random.js";

const { sin, cos, sqrt, round, abs, atan2, min, max, PI, pow, exp, log } = Math;

const vec2 = [0, 0];
const vec3 = [0, 0, 0];
const vec4 = [0, 0, 0, 0];

export const createRNG = (...args) => new random("vuoro", ...args);
export const createBag = (entries, getAmount, bag = []) => {
  for (const entry of entries) {
    const unroundedAmount = getAmount(entry);
    let amount = round(unroundedAmount);
    while (amount > 0) {
      bag.push(entry);
      amount--;
    }
  }
  return bag;
};

export const pickWithProbabilities = (entries, random = 0, providedSum) => {
  let sum = providedSum;
  if (sum === undefined) {
    for (const [, probability] of entries) {
      sum += probability;
    }
  }

  let pickedNumber = random * sum;
  for (const [entry, probability] of entries) {
    if (pickedNumber <= probability) {
      return entry;
    }
    pickedNumber -= probability;
  }
  console.error(entries, sum, providedSum);
};

export const deduplicateBy = (by) => (item, index, list) =>
  index === list.findIndex((found) => found[by] === item[by]);
export const deduplicate = (item, index, list) => index === list.indexOf(item);

export const mapBy = (by) => (map, item) => {
  map[item[by]] = item;
  return map;
};

export const clamp = (value, from = -1, to = 1) => min(to, max(from, value));

export const normalize = (vector, out = []) => {
  const sum = vector.reduce((total, value) => total + value * value, 0);
  const normal = sqrt(sum);
  let index = 0;

  if (normal === 0) {
    for (const value of vector) {
      out[index] = 0;
      index++;
    }
  } else {
    for (const value of vector) {
      out[index] = value / normal;
      index++;
    }
  }

  return out;
};
export const normalizeInPlace = (vector) => normalize(vector, vector);
export const dot = (
  [a0 = 0, a1 = 0, a2 = 0],
  [b0 = 0, b1 = 0, b2 = 0],
  whatToReturnWhenOneVectorIsZero
) => {
  if (
    whatToReturnWhenOneVectorIsZero !== undefined &&
    ((a0 === 0 && a1 === 0 && a2 === 0) || (b0 === 0 && b1 === 0 && b2 === 0))
  ) {
    return whatToReturnWhenOneVectorIsZero;
  }
  return a0 * b0 + a1 * b1 + a2 * b2;
};
export const cross3d = (a, b) => {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
};

export const mix = (from, to, time = 0.5, out = []) => {
  if (Array.isArray(from)) {
    const output = out || [];
    for (let index = 0; index < from.length; index++) {
      output[index] = from[index] * (1 - time) + to[index] * time;
    }
    return out;
  } else {
    return from * (1 - time) + to * time;
  }
};

// https://chicounity3d.wordpress.com/2014/05/23/how-to-mix-like-a-pro/
// Ease-out
export const sinerp = (from, to, time = 0.5) => mix(from, to, sin(time * PI * 0.5));
// Ease-in
export const coserp = (from, to, time = 0.5) => mix(from, to, 1 - cos(time * PI * 0.5));
// Glides to a stop
export const experp = (from, to, time = 0.5) => mix(from, to, time * time);
// Ease-in-out
export const smoothStep = (from, to, time = 0.5) => mix(from, to, time * time * (3 - 2 * time));
// Ease-in-out smoother
export const smootherStep = (from, to, time = 0.5) =>
  mix(from, to, time * time * time * (time * (6 * time - 15) + 10));
// Best for zooming
// https://www.gamasutra.com/blogs/ScottLembcke/20180418/316665/Logarithmic_Interpolation.php
// https://www.gamedev.net/forums/topic/666225-equation-for-zooming/
export const logerp = (from, to, time) =>
  exp(mix(log(from + Number.EPSILON), log(to + Number.EPSILON), time));

export const distanceBetween = (a, b) => {
  let sum = 0;
  for (let index = 0; index < min(a.length, b ? b.length : a.length); index++) {
    sum += (a[index] - (b ? b[index] : 0)) * (a[index] - (b ? b[index] : 0));
  }
  return sqrt(sum);
};
export const length = distanceBetween;
export const squaredDistanceBetween = ([ax = 0, ay = 0, az = 0], [bx = 0, by = 0, bz = 0]) => {
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  return dx * dx + dy * dy + dz * dz;
};
export const directionBetween = (a, b, out = []) => {
  out[0] = b[0] - a[0];
  out[1] = b[1] - a[1];
  return normalizeInPlace(out);
};
export const angleBetween = (p1 = [0, 0], p2 = [0, 0]) => atan2(p2[1] - p1[1], p2[0] - p1[0]);
// https://gist.github.com/shaunlebron/8832585
export const shortAngleDistance = (from, to) => {
  const max = PI * 2;
  const da = (to - from) % max;
  return ((2 * da) % max) - da;
};
export const angleLerp = (from, to, time) => from + shortAngleDistance(from, to) * time;
export const angleToDirectionDeg = (angle, out = []) => {
  out[0] = cos((angle * PI) / 180);
  out[1] = sin((angle * PI) / 180);
  return out;
};
export const angleToDirection = (angle, out = []) => {
  out[0] = cos(angle);
  out[1] = sin(angle);
  return out;
};

export const pointOnCircle = (radius, angle, out = []) => {
  out[0] = radius * cos(angle);
  out[1] = radius * sin(angle);
  return out;
};

// https://gist.github.com/gre/1650294#gistcomment-2036299
export const easeIn = (p) => (t) => pow(t, p);
export const easeOut = (p) => (t) => 1 - abs(pow(t - 1, p));
export const easeInOut = (p) => (t) =>
  t < 0.5 ? easeIn(p)(t * 2) / 2 : easeOut(p)(t * 2 - 1) / 2 + 0.5;

export const easeInSin = (t) => 1 + sin((PI / 2) * t - PI / 2);
export const easeOutSin = (t) => sin((PI / 2) * t);
export const easeInOutSin = (t) => (1 + sin(PI * t - PI / 2)) / 2;

export const add = (a, b, out = []) => {
  const aIsArray = Array.isArray(a) || ArrayBuffer.isView(a);
  const bIsArray = Array.isArray(b) || ArrayBuffer.isView(b);
  const dimensions = min(aIsArray ? a.length : Infinity, bIsArray ? b.length : Infinity);
  for (let index = 0; index < dimensions; index++) {
    out[index] = (aIsArray ? a[index] : a) + (bIsArray ? b[index] : b);
  }
  return out;
};
export const subtract = (a, b, out = []) => {
  const aIsArray = Array.isArray(a) || ArrayBuffer.isView(a);
  const bIsArray = Array.isArray(b) || ArrayBuffer.isView(b);
  const dimensions = min(aIsArray ? a.length : Infinity, bIsArray ? b.length : Infinity);
  for (let index = 0; index < dimensions; index++) {
    out[index] = (aIsArray ? a[index] : a) - (bIsArray ? b[index] : b);
  }
  return out;
};
export const multiply = (a, b, out = []) => {
  const aIsArray = Array.isArray(a) || ArrayBuffer.isView(a);
  const bIsArray = Array.isArray(b) || ArrayBuffer.isView(b);
  const dimensions = min(aIsArray ? a.length : Infinity, bIsArray ? b.length : Infinity);
  for (let index = 0; index < dimensions; index++) {
    out[index] = (aIsArray ? a[index] : a) * (bIsArray ? b[index] : b);
  }
  return out;
};
export const divide = (a, b, out = []) => {
  const aIsArray = Array.isArray(a) || ArrayBuffer.isView(a);
  const bIsArray = Array.isArray(b) || ArrayBuffer.isView(b);
  const dimensions = min(aIsArray ? a.length : Infinity, bIsArray ? b.length : Infinity);
  for (let index = 0; index < dimensions; index++) {
    out[index] = (aIsArray ? a[index] : a) / (bIsArray ? b[index] : b);
  }
  return out;
};

// https://stackoverflow.com/questions/2259476/rotating-a-point-about-another-point-2d/2259502#2259502
export const rotate = (point, degrees = 0, around = vec2, out = [...point]) => {
  const angle = -degrees * (PI / 180);
  const angleCos = cos(angle);
  const angleSin = sin(angle);
  out[0] = around[0] + angleCos * (point[0] - around[0]) - angleSin * (point[1] - around[1]);
  out[1] = around[1] + angleCos * (point[1] - around[1]) + angleSin * (point[0] - around[0]);

  return out;
};

export const toDegrees = (radians) => radians * (180 / PI);
export const toRadians = (degrees) => degrees * (PI / 180);

export const rotateArray = (array, times) => {
  if (times < 0) {
    throw new Error("can't rotate backwards");
  }

  while (times--) {
    array.push(array.shift());
  }

  return array;
};

export const cubicPulse = (sample, width = 1, center = 1) => {
  sample = abs(sample - center);
  if (sample > width) return 0.0;
  sample /= width;
  return 1.0 - sample * sample * (3.0 - 2.0 * sample);
};
