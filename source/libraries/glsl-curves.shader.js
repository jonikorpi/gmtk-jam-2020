export const quadraticCurve = `
  vec2 quadraticCurve (vec2 from, vec2 control, vec2 to, float progress) {
    vec2 a = mix(from, control, progress);
    vec2 b = mix(control, to, progress);
    return mix(a, b, progress);
  }
  
  vec3 quadraticCurve (vec3 from, vec3 control, vec3 to, float progress) {
    vec3 a = mix(from, control, progress);
    vec3 b = mix(control, to, progress);
    return mix(a, b, progress);
  }

  vec4 quadraticCurve (vec4 from, vec4 control, vec4 to, float progress) {
    vec4 a = mix(from, control, progress);
    vec4 b = mix(control, to, progress);
    return mix(a, b, progress);
  }
`;

export const cubicCurve = `
  vec2 cubicCurve (vec2 from, vec2 control, vec2 control2, vec2 to, float progress) {
    vec2 a = mix(from, control, progress);
    vec2 b = mix(control, control2, progress);
    vec2 c = mix(control2, to, progress);
    vec2 d = mix(a, b, progress);
    vec2 e = mix(b, c, progress);
    return mix(d, e, progress);
  }

  vec3 cubicCurve (vec3 from, vec3 control, vec3 control2, vec3 to, float progress) {
    vec3 a = mix(from, control, progress);
    vec3 b = mix(control, control2, progress);
    vec3 c = mix(control2, to, progress);
    vec3 d = mix(a, b, progress);
    vec3 e = mix(b, c, progress);
    return mix(d, e, progress);
  }

  vec4 cubicCurve (vec4 from, vec4 control, vec4 control2, vec4 to, float progress) {
    vec4 a = mix(from, control, progress);
    vec4 b = mix(control, control2, progress);
    vec4 c = mix(control2, to, progress);
    vec4 d = mix(a, b, progress);
    vec4 e = mix(b, c, progress);
    return mix(d, e, progress);
  }
`;