import React, {
  createContext,
  useRef,
  useContext,
  useEffect,
  useState,
  Fragment
} from "react";

let contextIdCounter = 0;
const defaultClearColor = [0, 0, 0, 1];

const RendererContext = createContext({});
export const useRenderer = () => useContext(RendererContext);
export const useLoop = (callback, everyNthFrame) =>
  useContext(RendererContext).useLoop(callback, everyNthFrame);

export default ({
  children,
  attributes = {
    alpha: false,
    antialias: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false
  },
  extensions = [],
  webgl2 = false,
  pixelRatio = typeof window ? window.devicePixelRatio : 1,
  ...canvasProps
}) => {
  const canvasRef = useRef();
  // Force new context when changing extensions or attributes,
  // or when context restoration sets a new contextId.
  const [contextId, setContextId] = useState();
  const key =
    contextId + JSON.stringify(attributes) + JSON.stringify(extensions);

  useEffect(() => {
    const canvas = canvasRef.current;

    const loseContext = event => {
      event.preventDefault();
      setContextId();
    };
    const startContext = () => {
      contextIdCounter++;
      setContextId(contextIdCounter);
    };

    canvas.addEventListener("webglcontextlost", loseContext);
    canvas.addEventListener("webglcontextrestored", startContext);

    startContext();

    return () => {
      canvas.removeEventListener("webglcontextlost", loseContext);
      canvas.removeEventListener("webglcontextrestored", startContext);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} {...canvasProps}></canvas>
      {contextId && (
        <Renderer
          key={key}
          canvasRef={canvasRef}
          attributes={attributes}
          extensions={extensions}
          webgl2={webgl2}
          pixelRatio={pixelRatio}
        >
          {children}
        </Renderer>
      )}
    </>
  );
};

const Renderer = ({
  children,
  canvasRef,
  attributes,
  extensions,
  webgl2,
  pixelRatio
}) => {
  const subscribers = useRef(new Set()).current;
  const useLoopCallback = callback => {
    useEffect(() => {
      if (callback) {
        subscribers.add(callback);
        return () => {
          subscribers.delete(callback);
        };
      }
    });
  };

  const gl = useRef(createGl(canvasRef.current, attributes, extensions, webgl2))
    .current;

  // Set up clearing
  const clearColor = useRef([...defaultClearColor]).current;
  const lastDepth = useRef(1);
  const setClear = (color = clearColor, depth = lastDepth.current) => {
    color.forEach((value, index) => {
      clearColor[index] = value;
    });
    gl.clearColor(...color);
    if (lastDepth.current !== depth) {
      gl.clearDepth(depth);
      lastDepth.current = depth;
    }
  };
  setClear();
  const clear = (value = 16640) => {
    gl.clear(value);
  };

  // Handle resizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    };
    handleResize();
    // TODO: use ResizeObserver on canvas
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasRef, pixelRatio, gl]);

  // Caches
  const commands = useRef(new Map()).current;
  const textures = useRef(new Map()).current;
  const shaderCache = useRef(new Map()).current;
  const programCache = useRef(new Map()).current;
  let currentVao = null;
  let currentProgram = null;
  // let currentTexture = null;
  let currentDepth = null;
  let currentCull = null;

  const setProgram = program => {
    if (currentProgram !== program) {
      gl.useProgram(program);
      currentProgram = program;
    }
  };
  const setVao = vao => {
    if (currentVao !== vao) {
      gl.bindVertexArray(vao);
      currentVao = vao;
    }
  };
  const setTexture = (texture, index) => {
    // if (currentTexture !== texture) {
    gl.activeTexture(gl[`TEXTURE${index}`]);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // currentTexture = texture;
    // }
  };
  const updateTexture = (name, ...data) => {
    return textures.get(name).update(...data);
  };
  const setDepth = depth => {
    if (currentDepth !== depth) {
      if (depth) {
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl[depth]);
      } else {
        gl.disable(gl.DEPTH_TEST);
      }
      currentDepth = depth;
    }
  };
  const setCull = cull => {
    if (currentCull !== cull) {
      if (cull) {
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl[cull]);
      } else {
        gl.disable(gl.CULL_FACE);
      }
      currentCull = cull;
    }
  };

  setDepth("LESS");
  setCull("BACK");

  // Helpers
  const updateAllUniforms = (key, value) => {
    for (const [, { uniformUpdaters, updateUniform }] of commands) {
      if (uniformUpdaters.has(key)) {
        updateUniform(key, value);
      }
    }
  };

  // Destruction
  useEffect(() => {
    return () => {
      for (const [, shader] of shaderCache) {
        gl.deleteShader(shader);
      }
      for (const [, program] of programCache) {
        gl.deleteProgram(program);
      }

      commands.clear();
      textures.clear();
      shaderCache.clear();
      programCache.clear();
    };
  }, []);

  // Rendering requests
  const render = () => {
    frame = frame || requestAnimationFrame(loop);
  };
  const [shouldLoop, setShouldLoop] = useState(true);

  // Looping
  let frame = useRef(null);
  let frameNumber = 0;
  const { navigationStart } = performance.timing;
  const loop = timestamp => {
    try {
      const clock = timestamp + navigationStart;

      for (const callback of subscribers) {
        callback.call(null, timestamp, clock, frameNumber);
      }

      for (const [, { render }] of commands) {
        render(timestamp, clock, frameNumber);
      }
    } catch (error) {
      cancelAnimationFrame(frame.current);
      throw error;
    }

    frameNumber++;
    frame.current = shouldLoop ? requestAnimationFrame(loop) : null;
  };

  useEffect(() => {
    frame.current = requestAnimationFrame(loop);
    return () => frame.current && cancelAnimationFrame(frame.current);
  });

  return (
    <RendererContext.Provider
      value={{
        canvas: canvasRef.current,
        gl,
        setClear,
        clear,
        setDepth,
        setCull,
        commands,
        shaderCache,
        programCache,
        setProgram,
        textures,
        setTexture,
        updateTexture,
        setVao,
        updateAllUniforms,
        render,
        setShouldLoop,
        useLoop: useLoopCallback
      }}
    >
      {children}
    </RendererContext.Provider>
  );
};

const createGl = (canvas, attributes, extensions = [], webgl2 = false) => {
  const gl = webgl2
    ? canvas.getContext("webgl2", attributes)
    : canvas.getContext("webgl", attributes) ||
      canvas.getContext("experimental-webgl", attributes);

  const extensionCache = {};
  const getExtension = (extension, webgl2Func, extensionFunction) => {
    // if webgl2 function supported, return func bound to gl context
    if (webgl2Func && gl[webgl2Func]) return gl[webgl2Func].bind(gl);
    // fetch extension once only
    if (!extensionCache[extension]) {
      extensionCache[extension] = gl.getExtension(extension);
    }
    // return extension if no function requested
    if (!webgl2Func) return extensionCache[extension];
    // Return null if extension not supported
    if (!extensionCache[extension]) return null;
    // return extension function, bound to extension
    return extensionCache[extension][extensionFunction].bind(
      extensionCache[extension]
    );
  };

  if (!webgl2) {
    // Enable some "universally available" extensions by default
    gl.vertexAttribDivisor = getExtension(
      "ANGLE_instanced_arrays",
      "vertexAttribDivisor",
      "vertexAttribDivisorANGLE"
    );
    gl.drawArraysInstanced = getExtension(
      "ANGLE_instanced_arrays",
      "drawArraysInstanced",
      "drawArraysInstancedANGLE"
    );
    gl.drawElementsInstanced = getExtension(
      "ANGLE_instanced_arrays",
      "drawElementsInstanced",
      "drawElementsInstancedANGLE"
    );
    gl.createVertexArray = getExtension(
      "OES_vertex_array_object",
      "createVertexArray",
      "createVertexArrayOES"
    );
    gl.bindVertexArray = getExtension(
      "OES_vertex_array_object",
      "bindVertexArray",
      "bindVertexArrayOES"
    );
    gl.deleteVertexArray = getExtension(
      "OES_vertex_array_object",
      "deleteVertexArray",
      "deleteVertexArrayOES"
    );
    gl.isVertexArray = getExtension(
      "OES_vertex_array_object",
      "isVertexArray",
      "isVertexArrayOES"
    );
    gl.drawBuffers = getExtension(
      "WEBGL_draw_buffers",
      "drawBuffers",
      "drawBuffersWEBGL"
    );
    getExtension("OES_standard_derivatives");
    getExtension("OES_texture_float");
  }

  for (const extension of extensions) {
    getExtension(extension);
  }

  return gl;
};
