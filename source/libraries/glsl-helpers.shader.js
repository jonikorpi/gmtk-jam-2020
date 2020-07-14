export const round = `
  float round(float value) { return floor(value + 0.5); }
  vec2 round(vec2 value) { return floor(value + 0.5); }
  vec3 round(vec3 value) { return floor(value + 0.5); }
  vec4 round(vec4 value) { return floor(value + 0.5); }
`;

export const dot2 = `
  float dot2( in vec3 v ) { return dot(v,v); } 
  float dot2( in vec2 v ) { return dot(v,v); }
`;

export const readTexel = `
  highp vec4 readTexel(float index, sampler2D texture, float size) {
    return texture2D(texture, vec2(
      mod(index, size) / (size - 1.0), 
      floor(index / size) / size
    ));
  }
`;