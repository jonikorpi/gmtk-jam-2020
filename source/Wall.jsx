import React from "react";

import { Line } from "./Line.js";
import { s } from "./Game.js";
import { shake, spin } from "./animators.js";

const defaultPosition = [0, 0, 0];

const Pattern = {
  stripiness: 10,
  lineness: 0.1,
  swirliness: 2,
  swirlSize: 2.5
};

export default ({ position }) => {
  return (
    <>
      <Line
        from={[position[0] * s, (-0.5 + position[1]) * s, -0.012, 1 * s]}
        to={[position[0] * s, (0.5 + position[1]) * s, -0.012, 1 * s]}
        bumpiness={0.01}
        color={[0.45, 0.38, 0.35]}
        {...Pattern}
        useAlpha={false}
        //useOutline
      />
      <Line
        from={[position[0] * s, (-0.5 + position[1]) * s, -0.011, 1 * s]}
        to={[position[0] * s, (0.5 + position[1]) * s, -0.011, 1 * s]}
        bumpiness={0.5}
        color={[0.35, 0.25, 0.25]}
        {...Pattern}
        useAlpha={true}
        //useOutline
      />
      
      <Line
        from={[position[0] * s, (-0.5 + position[1]) * s, -0.01, 1 * s]}
        to={[position[0] * s, (0.5 + position[1]) * s, -0.01, 1 * s]}
        bumpiness={0.999}
        color={[0.78, 0.73, 0.7]}
        stripiness={10}
        lineness={0.0002}
        swirliness={0.02}
        swirlSize={0.7}
        useAlpha={true}
        //useOutline
      />
    </>
  );
};
