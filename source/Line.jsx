import React, { useRef } from "react";

import { rotate2d } from "./libraries/glsl-transforms.shader.js";
import { round, readTexel } from "./libraries/glsl-helpers.shader.js";
import { quadraticCurve, cubicCurve } from "./libraries/glsl-curves.shader.js";
import { simplexNoise2d } from "./libraries/glsl-noise.shader.js";
import conditionals from "./libraries/glsl-conditionals.shader.js";
import { useSkeleton } from "./libraries/Skeleton.js";
import { useCommand } from "./libraries/Command.js";
import { normalizeInPlace } from "./libraries/maths.js";

const vec2 = [0, 0];
const defaultColor = [0.5, 0.5, 0.5];
const defaultFrom = [0, 0, 0, 1];

const debug = false;
const debugColor = [0, 0, 1];

export const Line = ({
  fromJoint,
  toJoint,
  from = defaultFrom,
  to = toJoint ? from : [from[0] + 1, from[1], from[2], from[3]],
  control,
  control2,
  rounding = 0,
  color = defaultColor,
  useAlpha = false,
  useOutline = false,
  pulseness = 0,
  stripiness = 10,
  lineness = 10,
  swirlSize = 1,
  flowness = 0.0,
  spinniness = 0.0,
  swirliness = 0,
  bumpiness = 0.0,
  depth = true,
  children = null
}) => {
  let points = 2;
  const pointList = [from];

  if (control) {
    points++;
    pointList.push(control);
  }
  if (control2) {
    points++;
    pointList.push(control2);
  }
  
  pointList.push(to);

  const Line = useCommand(drawLine(points, useAlpha, useOutline, depth));

  const { getJoint } = useSkeleton();
  const joint =
    fromJoint && getJoint
      ? [getJoint(fromJoint), getJoint(toJoint ? toJoint : fromJoint)]
      : vec2;

  return (
    <Line
      joint={joint}
      from={from}
      to={to}
      control={control}
      control2={control2}
      rounding={rounding}
      color={color}
      surface={[pulseness, stripiness, lineness, 1 / swirlSize]}
      substance={[flowness, spinniness, swirliness, bumpiness]}
    >
      {children}

      {debug &&
        depth &&
        pointList.map((point) => {
          return (
            <Line
              key={point}
              joint={[joint[0], joint[0]]}
              color={debugColor}
              rounding={1}
              from={[point[0], point[1]-0.05, point[2], 0.1]}
              to={[point[0], point[1]+0.05, point[2], 0.1]}
              depth={false}
            />
          );
        })}
    </Line>
  );
};

const commandCache = new Map();
const drawLine = (points, useAlpha, useOutline, depth = true) => {
  const id = points + useAlpha.toString() + useOutline.toString() + depth.toString();

  if (commandCache.has(id)) {
    return commandCache.get(id);
  }

  const segments = points + 1 + points * 2 * points;
  const position = [...Array(segments)].flatMap((v, index) => [
    [index / (segments - 1), 0.5],
    [index / (segments - 1), -0.5]
  ]);

  commandCache.set(id, {
    mode: "TRIANGLE_STRIP",
    cull: false,
    depth: depth ? undefined : false,
    attributes: {
      position
    },
    uniforms: {
      segmentLength: 1 / segments
    },
    vertex: getVert(points, useOutline),
    fragment: getMaterial(useAlpha, useOutline),
    sortBy: (a, b) =>
      (b.attributes.from[2] + b.attributes.to[2]) / 2 -
      (a.attributes.from[2] + a.attributes.to[2]) / 2
  });

  return commandCache.get(id);
};

export default drawLine;

// prettier-ignore
const getVert = (points = 2, useOutline = false) => (`
  precision highp float;
  attribute vec2 position;
  attribute float instanceId;
  attribute vec4 from;
  attribute vec4 to;
  attribute float rounding;
  attribute vec4 surface;
  attribute vec4 substance;
  ${points > 2 ? "attribute vec4 control;" : ""}
  ${points > 3 ? "attribute vec4 control2;" : ""}
  attribute vec2 joint;
  attribute vec3 color;
  uniform mat4 projectionView;
  uniform float segmentLength;
  uniform float time;
  uniform highp sampler2D joints;
  varying vec3 colorOutput;
  varying vec4 material;
  varying vec4 uv;
  ${useOutline ? `varying vec2 edgeness;`: ""}
  varying float lightEffect;

  #define PI 3.1415926535897932384626433832795
  #define TAU 6.28318530717958647693

  ${rotate2d + conditionals + round + readTexel + quadraticCurve + cubicCurve}

  void main() {
    float progress = position.x;
    float endness = progress * 2.0 - 1.0;
    float roundedEndness = pow(abs(endness), 1.0 - rounding * 0.5) * sign(endness);
    float roundedProgress = roundedEndness * 0.5 + 0.5;
    float spread = position.y;

    vec4 fromJoint = readTexel(joint.x, joints, 128.0);
    vec4 toJoint = readTexel(joint.y, joints, 128.0);

    vec4 fromFinal = vec4(rotate2d(fromJoint.w) * from.xy, from.zw) + vec4(fromJoint.xyz, 0.0);
    vec4 toFinal = vec4(rotate2d(toJoint.w) * to.xy, to.zw) + vec4(toJoint.xyz, 0.0);
    ${points > 2 ? `
      vec4 controlFinal = vec4(rotate2d(fromJoint.w) * control.xy, control.zw) + vec4(fromJoint.xyz, 0.0);
    ` : ""}
    ${points === 4 ? `
      vec4 control2Final = vec4(rotate2d(toJoint.w) * control2.xy, control2.zw) + vec4(toJoint.xyz, 0.0);
    ` : ""}

    // Curve
    ${points === 2 ? `
      vec4 current = mix(fromFinal, toFinal, roundedProgress);
      vec4 next = mix(fromFinal, toFinal, roundedProgress + segmentLength);
    `: ""}
    ${points === 3 ? `
      vec4 current = quadraticCurve(fromFinal, controlFinal, toFinal, roundedProgress);
      vec4 next = quadraticCurve(fromFinal, controlFinal, toFinal, roundedProgress + segmentLength);
    `: ""}
    ${points === 4 ? `
      vec4 current = cubicCurve(fromFinal, controlFinal, control2Final, toFinal, roundedProgress);
      vec4 next = cubicCurve(fromFinal, controlFinal, control2Final, toFinal, roundedProgress + segmentLength);
    `: ""}

    float width = current.w;
    vec3 worldPosition = current.xyz;

    // Extrusion
    // float angle = mix(fromJoint.w, toJoint.w, progress);
    // vec3 angleDirection = vec3(
    //   sin((angle)),
    //   cos((angle)),
    //   0.0
    // );
    vec3 forward = normalize(next.xyz - current.xyz);
    vec3 sideways = normalize(vec3(-forward.y - 0.000001, forward.x, 0.0));
    vec3 widthExtrusion = sideways * (spread * (sqrt(1.0 - abs(roundedEndness * roundedEndness) * rounding))) * width;
    //vec3 widthExtrusion = sideways * spread * width;
    worldPosition += widthExtrusion;

    worldPosition.z -= worldPosition.y * 0.01;

    // Length
    float vagueLength = (
      ${points === 2 ? `length((toJoint.xyz - fromJoint.xyz) + (to.xyz - from.xyz))` : ""}
      ${points === 3 ? `length((toJoint.xyz - fromJoint.xyz) + (to.xyz - control.xyz) + (control.xyz - from.xyz))` : ""}
      ${points === 4 ? `length((toJoint.xyz - fromJoint.xyz) + (to.xyz - control2.xyz) + (control2.xyz - control.xyz) + (control.xyz - from.xyz))` : ""}
    );

    // Texture
    float pulseness = surface[0];
    float stripiness = surface[1];
    float lineness = surface[2];
    float swirlSize = surface[3];
    float flowness = substance[0] * time;
    float spinniness = substance[1] * time;
    float swirliness = substance[2];
    float bumpiness = substance[3];
    
    // Texture coordinates
    vec2 baseUv = vec2(spread * width, endness * 0.5 * vagueLength);
    vec2 texture = vec2(
      baseUv.x * stripiness - spinniness - (baseUv.x * pulseness * sin(time)), 
      baseUv.y * lineness - flowness - (baseUv.y * pulseness * sin(time))
    ) + mod(instanceId, 512.0);
    //);
    uv = vec4(baseUv, texture);
    
    ${useOutline ? `
      edgeness = vec2(endness, spread * 2.0) 
      * clamp(
        (1.0 + progress)
      , 0.0, 1.0);
    ` : ""}
    material = vec4(pulseness, bumpiness, swirlSize, swirliness);
    colorOutput = color;
    gl_Position = projectionView * vec4(worldPosition, 1.0);
  }
`);

const getMaterial = (useAlpha = false, useOutline = false) => `
  ${useOutline ? `#extension GL_OES_standard_derivatives : enable` : ""}
  precision highp float;
  uniform float time;
  uniform vec4 lightColor;
  varying vec3 colorOutput;
  varying vec4 material;
  varying vec4 uv;
  ${useOutline ? `varying vec2 edgeness;` : ""}

  #define PI 3.1415926535897932384626433832795
  #define TAU 6.28318530717958647693

  ${simplexNoise2d + rotate2d + conditionals + round}

  void main() {
    const float smoothing = 0.09;

    //float pulseness = material[0];
    float bumpiness = 1.0 - material[1];
    float swirlSize = material[2];
    float swirliness = material[3];

    vec2 baseUv = uv.xy;
    vec2 texture = uv.zw;

    vec3 color = colorOutput;

    float rotationNoise = simplexNoise2d(baseUv * swirlSize);
    float noise = 
      simplexNoise2d(rotate2d((rotationNoise * swirliness * TAU) / length(texture)) * texture);
    
    float shape = smoothstep(
      bumpiness, 
      bumpiness + smoothing,
      noise * 0.5 + 0.5
    );

    ${
      useOutline
        ? `
      float edge = 1.0 - max(abs(edgeness.x), abs(edgeness.y));
      float outline = edge / fwidth(edge);
      float outlineEffect = 1.0 - smoothstep(0.91, 1.0, outline);
      color -= outlineEffect;
    `
        : ""
    }

    ${useAlpha ? `` : `color -= shape;`}
    
    gl_FragColor = vec4(color, 1.0 - shape ${
      useOutline ? `+ outlineEffect` : ""
    });

    ${
      useAlpha
        ? `
      if (gl_FragColor.a <= 0.0) {
        discard;
      }
    `
        : ""
    }
  }
`;
