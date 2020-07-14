// https://gist.github.com/patriciogonzalezvivo/986341af1560138dde52

export const scale = `
  mat4 scale(float x, float y, float z){
    return mat4(
      vec4(x,   0.0, 0.0, 0.0),
      vec4(0.0, y,   0.0, 0.0),
      vec4(0.0, 0.0, z,   0.0),
      vec4(0.0, 0.0, 0.0, 1.0)
    );
  }

  mat4 scale(float factor){
    return mat4(
      vec4(factor,   0.0, 0.0, 0.0),
      vec4(0.0, factor,   0.0, 0.0),
      vec4(0.0, 0.0, factor,   0.0),
      vec4(0.0, 0.0, 0.0, 1.0)
    );
  }
`;

export const translate = `
  mat4 translate(float x, float y, float z){
    return mat4(
      vec4(1.0, 0.0, 0.0, 0.0),
      vec4(0.0, 1.0, 0.0, 0.0),
      vec4(0.0, 0.0, 1.0, 0.0),
      vec4(x,   y,   z,   1.0)
    );
  }
`;

export const rotateX = `
  mat4 rotateX(float phi){
    return mat4(
      vec4(1.,0.,0.,0),
      vec4(0.,cos(phi),-sin(phi),0.),
      vec4(0.,sin(phi),cos(phi),0.),
      vec4(0.,0.,0.,1.)
    );
  }
`;

export const rotateY = `
  mat4 rotateY(float theta){
    return mat4(
      vec4(cos(theta),0.,-sin(theta),0),
      vec4(0.,1.,0.,0.),
      vec4(sin(theta),0.,cos(theta),0.),
      vec4(0.,0.,0.,1.)
    );
  }
`;

export const rotateZ = `
  mat4 rotateZ(float psi){
    return mat4(
      vec4(cos(psi),-sin(psi),0.,0),
      vec4(sin(psi),cos(psi),0.,0.),
      vec4(0.,0.,1.,0.),
      vec4(0.,0.,0.,1.)
    );
  }
`;

export const rotate2d = `
  mat2 rotate2d(float angle){
    return mat2(
      cos(angle), -sin(angle),
      sin(angle),  cos(angle)
    );
  }
`;

export const scale2d = `
  mat2 scale2d(vec2 _scale){
    return mat2(_scale.x,0.0,0.0,_scale.y);
  }
`;
