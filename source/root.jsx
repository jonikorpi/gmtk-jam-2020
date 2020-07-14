import React from "react";
import ReactDOM from "react-dom";

import WebGL from "./libraries/WebGL.js";
import Texture from "./libraries/Texture.js";
import { Camera } from "./libraries/Camera.js";
import Game from "./Game.js";

ReactDOM.render(
  <React.StrictMode>
    <WebGL>
      <Camera fov={(30 * Math.PI) / 180} far={300} near={1}>
        <Texture name="joints" width={128} height={128} />
        <Game />
      </Camera>
    </WebGL>
  </React.StrictMode>,
  document.getElementById("root")
);
