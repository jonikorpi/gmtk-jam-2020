import React, { createContext, useContext, useEffect, useRef } from "react";
import createCamera from "perspective-camera";

import { useRenderer } from "./WebGL.js";

const CameraContext = createContext();
export const useCamera = () => useContext(CameraContext);

export const Camera = ({ children, position = [0, 0, 1], ...props }) => {
  const { canvas } = useRenderer();

  const cameraInstanceRef = useRef(createCamera({ position, ...props }));
  const cameraInstance = cameraInstanceRef.current;
  cameraInstance.resolution = cameraInstance.resolution || [0, 0];
  cameraInstance.aspectRatio = cameraInstance.aspectRatio || 1;

  useEffect(() => {
    const cameraInstance = cameraInstanceRef.current;

    const handleResize = () => {
      let width, height;

      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
      } else {
        width = window.innerWidth;
        height = window.innerHeight;
      }

      const vmax = Math.max(width, height);
      cameraInstance.viewport[0] = -vmax / height;
      cameraInstance.viewport[1] = -vmax / width;
      cameraInstance.viewport[2] = vmax / height;
      cameraInstance.viewport[3] = vmax / width;
      cameraInstance.update();

      cameraInstance.resolution[0] = width;
      cameraInstance.resolution[1] = height;
      cameraInstance.aspectRatio = width / height;
    };
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvas]);

  return <CameraContext.Provider value={cameraInstance}>{children}</CameraContext.Provider>;
};
