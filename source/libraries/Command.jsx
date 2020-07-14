import React, { useRef, useEffect, useCallback, forwardRef } from "react";

import { useRenderer, useLoop } from "./WebGL.js";

export const useCommand = (command) => {
  const engine = useRenderer();
  const commands = engine.commands;

  if (!commands.has(command)) {
    commands.set(command, createCommand(command, engine));
  }

  return commands.get(command).Element;
};

const getInitialAttributes = (attributes, defaultAttributes) => {
  const result = {};
  for (const key in defaultAttributes) {
    result[key] = attributes[key] || defaultAttributes[key];
  }
  return result;
};

const createCommand = (
  {
    uniforms = {},
    attributes = {},
    vertex,
    fragment,
    mode = "TRIANGLES",
    depth = "LESS",
    cull = "BACK",
    sortBy,
  },
  engine
) => {
  const { gl, shaderCache, programCache, textures, setProgram, setVao, setDepth, setCull } = engine;

  const programKey = vertex + fragment;

  if (!programCache.has(programKey)) {
    if (!shaderCache.has(vertex)) {
      // compile vertex shader and log errors
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertex);
      gl.compileShader(vertexShader);
      const log = gl.getShaderInfoLog(vertexShader);
      if (log !== "") logError(log, vertex);
      shaderCache.set(vertex, vertexShader);
    }

    if (!shaderCache.has(fragment)) {
      // compile fragment shader and log errors
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragment);
      gl.compileShader(fragmentShader);
      const log = gl.getShaderInfoLog(fragmentShader);
      if (log !== "") logError(log, fragment);
      shaderCache.set(fragment, fragmentShader);
    }

    // compile program and log errors
    const program = gl.createProgram();
    gl.attachShader(program, shaderCache.get(vertex));
    gl.attachShader(program, shaderCache.get(fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program));
    }

    programCache.set(programKey, program);
  }

  const program = programCache.get(programKey);
  setProgram(program);

  // Prepare uniforms
  const uniformsNeedingUpdate = new Map();
  const updateUniform = (name, value) => {
    uniformsNeedingUpdate.set(name, value);
  };
  const uniformUpdaters = new Map();
  const commitUniformUpdate = (name, value) => uniformUpdaters.get(name)(value);

  for (let i = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) - 1; i >= 0; i--) {
    const { name, type } = gl.getActiveUniform(program, i);
    const location = gl.getUniformLocation(program, name);
    const value = uniforms[name] ? uniforms[name] : typeToPlaceholder(type, gl);
    const updater = getUniformUpdater(name, type, location, gl, textures);
    uniformUpdaters.set(name, updater);
    updateUniform(name, value);
  }

  // Prepare attributes
  const buffers = new Map();
  let isInstanced = false;
  let count = 0;
  const vao = gl.createVertexArray();
  const defaultInstancedAttributes = {};
  setVao(vao);

  for (let i = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) - 1; i >= 0; i--) {
    const { name, type } = gl.getActiveAttrib(program, i);
    const location = gl.getAttribLocation(program, name);
    if (location === -1) {
      console.warn(`Failed to get attribute location for ${name}`);
      continue;
    }

    const staticValue = attributes[name];
    const value = staticValue || [typeToPlaceholder(type, gl)];

    const divisor = staticValue ? 0 : 1;
    isInstanced = isInstanced || divisor;
    const dimensions =
      Array.isArray(value[0]) || ArrayBuffer.isView(value[0]) ? value[0].length : 1;
    const buffer = gl.createBuffer();
    const usage = staticValue ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
    const normalized = false;
    const stride = 0;
    const offset = 0;

    const finalValue = ArrayBuffer.isView(value)
      ? value
      : Array.isArray(value[0])
      ? new Float32Array(value.flat())
      : ArrayBuffer.isView(value[0])
      ? value[0]
      : new Float32Array(value);

    buffers.set(name, {
      buffer,
      dimensions,
      type: gl.FLOAT,
      normalized,
      stride,
      offset,
      divisor,
      usage,
      isInstanced: !!divisor,
      BYTES_PER_ELEMENT: finalValue.BYTES_PER_ELEMENT || 4,
      instancesNeedingUpdate: new Set(),
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, finalValue, usage);
    gl.vertexAttribPointer(location, dimensions, gl.FLOAT, normalized, stride, offset);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribDivisor(location, divisor);

    if (staticValue) {
      count = Math.max(count, staticValue.length);
    } else {
      defaultInstancedAttributes[name] = value[0];
    }
  }

  // Instances
  let buffersNeedUpdate = true;
  const instances = new Set();
  const addInstance = (instance) => {
    instances.add(instance);
    buffersNeedUpdate = true;
  };
  const deleteInstance = (instance) => {
    instances.delete(instance);
    buffersNeedUpdate = true;
  };
  const updateInstance = (instance, attribute) => {
    buffers.get(attribute).instancesNeedingUpdate.add(instance);
  };

  // Rendering
  const render = () => {
    const instanceCount = instances.size;
    const shouldRender = instanceCount > 0;

    if (!shouldRender) {
      return false;
    }

    setProgram(program);
    setVao(vao);
    setDepth(depth);
    setCull(cull);

    if (buffersNeedUpdate) {
      // Sort instances and update their indexes
      if (sortBy) {
        // console.log("sorting and updating indexes");
        const instancesList = [...instances].sort(sortBy);
        instances.clear();
        let offset = 0;
        for (const instance of instancesList) {
          instances.add(instance);
          instance.offset = offset;
          offset++;
        }
      } else {
        // Or just update instance indexes
        let offset = 0;
        for (const instance of instances) {
          instance.offset = offset;
          offset++;
        }
      }

      // Fill instanced buffers
      for (const [
        attribute,
        { buffer, isInstanced, dimensions, usage, instancesNeedingUpdate },
      ] of buffers) {
        if (isInstanced) {
          // console.log("filling", attribute);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          const batch = new Float32Array(dimensions * instanceCount);
          for (const instance of instances) {
            if (dimensions > 1) {
              batch.set(instance.attributes[attribute], instance.offset * dimensions);
            } else {
              batch[instance.offset] = instance.attributes[attribute];
            }
          }
          gl.bufferData(gl.ARRAY_BUFFER, batch, usage);
          instancesNeedingUpdate.clear();
        }
      }
      buffersNeedUpdate = false;
    } else if (isInstanced) {
      // Update any instances that have reported needing updates
      for (const [
        attribute,
        { buffer, dimensions, BYTES_PER_ELEMENT, instancesNeedingUpdate },
      ] of buffers) {
        if (instancesNeedingUpdate.size > 0) {
          // console.log("updating", attribute, instancesNeedingUpdate.size);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

          for (const instance of instancesNeedingUpdate) {
            const value = instance.attributes[attribute];
            gl.bufferSubData(
              gl.ARRAY_BUFFER,
              BYTES_PER_ELEMENT * dimensions * instance.offset,
              value.length ? value : new Float32Array([value])
            );
          }

          instancesNeedingUpdate.clear();
        }
      }
    }

    if (uniformsNeedingUpdate.size > 0) {
      for (const [uniform, value] of uniformsNeedingUpdate) {
        commitUniformUpdate(uniform, value);
      }
      uniformsNeedingUpdate.clear();
    }

    if (isInstanced) {
      gl.drawArraysInstanced(gl[mode], 0, count, instanceCount);
    } else {
      gl.drawArrays(gl[mode], 0, count);
    }

    return true;
  };

  const destroy = () => {
    console.log("destroying", command);
    for (const [, buffer] of buffers) {
      gl.deleteBuffer(buffer);
    }
    gl.deleteVertexArray(vao);
  };

  const command = {
    render,
    uniformUpdaters,
    updateUniform,
    buffers,
    defaultInstancedAttributes,
    destroy,
    addInstance,
    deleteInstance,
    updateInstance,
  };

  command.Element = createElement(command);

  return command;
};

const createElement = ({
  addInstance,
  defaultInstancedAttributes,
  deleteInstance,
  updateInstance,
}) => {
  let instanceIndex = 0;
  return forwardRef(({ children = null, ...props }, ref) => {
    const instanceId = useRef(instanceIndex++).current;
    props.instanceId = instanceId;

    // Create a stable identity for this component instance
    const instance = useRef({
      attributes: getInitialAttributes(props, defaultInstancedAttributes),
    }).current;
    const instanceAttributes = instance.attributes;

    if (ref) {
      ref.current = instance;
    }

    useEffect(() => {
      addInstance(instance);
      return () => deleteInstance(instance);
    }, [instance]);

    // A function for updating data in buffers for this instance
    const updateAttribute = useCallback(
      (attribute) => {
        updateInstance(instance, attribute);
      },
      [instance]
    );
    instance.updateAttribute = updateAttribute;

    // Update buffers from props
    useEffect(() => {
      for (const key in instanceAttributes) {
        const newValue = props[key];
        if (newValue) {
          instanceAttributes[key] = newValue.length ? new Float32Array(newValue) : newValue;
          updateAttribute(key);
        }
      }
    });

    return children;
  });
};

const typeToPlaceholder = (type, gl) => {
  // Only WebGL 1.0 types,
  // from https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
  switch (type) {
    case gl.FLOAT_VEC2:
    case gl.BOOL_VEC2:
    case gl.INT_VEC2:
      return vec2;
    case gl.FLOAT_VEC3:
    case gl.BOOL_VEC3:
    case gl.INT_VEC3:
      return vec3;
    case gl.FLOAT_VEC4:
    case gl.BOOL_VEC4:
    case gl.INT_VEC4:
      return vec4;
    case gl.FLOAT_MAT2:
      return mat2;
    case gl.FLOAT_MAT3:
      return mat3;
    case gl.FLOAT_MAT4:
      return mat4;
    // case gl.SAMPLER_2D:
    // case gl.SAMPLER_CUBE:
    // case gl.BOOL:
    // case gl.INT:
    // case gl.FLOAT:
    default:
      return 0;
  }
};

const vec2 = new Float32Array(2);
const vec3 = new Float32Array(3);
const vec4 = new Float32Array(4);
const mat2 = new Float32Array(2 * 2);
const mat3 = new Float32Array(3 * 3);
const mat4 = new Float32Array(4 * 4);

const getUniformUpdater = (name, type, location, gl, textures) => {
  switch (type) {
    case gl.FLOAT_VEC2:
      return (value) => gl.uniform2fv(location, value);
    case gl.FLOAT_VEC3:
      return (value) => gl.uniform3fv(location, value);
    case gl.FLOAT_VEC4:
      return (value) => gl.uniform4fv(location, value);

    case gl.FLOAT_MAT2:
      return (value) => gl.uniformMatrix2fv(location, false, value);
    case gl.FLOAT_MAT3:
      return (value) => gl.uniformMatrix3fv(location, false, value);
    case gl.FLOAT_MAT4:
      return (value) => gl.uniformMatrix4fv(location, false, value);

    case gl.INT_VEC2:
    case gl.BOOL_VEC2:
      return (value) => gl.uniform2iv(location, value);
    case gl.INT_VEC3:
    case gl.BOOL_VEC3:
      return (value) => gl.uniform3iv(location, value);
    case gl.INT_VEC4:
    case gl.BOOL_VEC4:
      return (value) => gl.uniform4iv(location, value);

    case gl.SAMPLER_2D:
      return () => gl.uniform1i(location, textures.get(name).index);
    case gl.SAMPLER_CUBE:
      return () => gl.uniform1i(location, textures.get(name).index);

    // case gl.INT:
    // case gl.FLOAT:
    default:
      return (value) => gl.uniform1f(location, value);
  }
};

const logError = (log, shader) => {
  const position = log.match(/(\d+:\d+)/g)[0];
  if (position) {
    const [, lineNumber] = position.split(":");
    let lineIndex = 1;
    for (const line of shader.split("\n")) {
      if (Math.abs(lineIndex - lineNumber) < 6) {
        console[lineIndex === +lineNumber ? "warn" : "log"](`${lineIndex} ${line}`);
      }
      lineIndex++;
    }
  }
};
