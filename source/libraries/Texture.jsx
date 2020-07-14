import React, { useRef, useEffect } from "react";
import { useRenderer } from "./WebGL.js";

const textureRegistry = new Map();
const availableTextureSlots = [];
const registerTexture = () => {
  const index =
    availableTextureSlots.length > 0 ? availableTextureSlots.shift() : textureRegistry.size;
  textureRegistry.set(index, true);
  return index;
};
const unregisterTexture = (index) => {
  textureRegistry.delete(index);
  availableTextureSlots.push(index);
};

export default ({
  children = null,
  name = Math.random(),
  width = 32,
  height = 32,
  level = 0,
  border = 0,
  format = "RGBA",
  internalFormat = format,
  type = "FLOAT",
  data = null,
  ...inputParameters
}) => {
  const engine = useRenderer();
  const { gl, textures, setTexture } = engine;

  const indexRef = useRef();
  const textureRef = useRef();

  if (!textures.has(name)) {
    indexRef.current = registerTexture();
    textureRef.current = gl.createTexture();
    setTexture(textureRef.current, indexRef.current);

    const parameters = {
      TEXTURE_MAG_FILTER: "NEAREST",
      TEXTURE_MIN_FILTER: "NEAREST",
      TEXTURE_WRAP_S: "CLAMP_TO_EDGE",
      TEXTURE_WRAP_T: "CLAMP_TO_EDGE",
      ...inputParameters,
    };

    for (const key in parameters) {
      gl.texParameteri(gl.TEXTURE_2D, gl[key], gl[parameters[key]]);
    }

    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      gl[internalFormat],
      width,
      height,
      border,
      gl[format],
      gl[type],
      data
    );

    const update = (data, x = 0, y = 0, width = 1, height = 1) => {
      setTexture(textureRef.current, indexRef.current);
      return gl.texSubImage2D(
        gl.TEXTURE_2D,
        level,
        x,
        y,
        width,
        height,
        gl[format],
        gl[type],
        data
      );
    };

    textures.set(name, {
      update,
      index: indexRef.current,
    });
  }

  useEffect(() => {
    return () => {
      unregisterTexture(indexRef.current);
      gl.deleteTexture(textureRef.current);
      textures.delete(name);
    };
  }, []);

  return children;
};
