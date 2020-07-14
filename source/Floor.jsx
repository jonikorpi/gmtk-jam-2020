import React from "react";

import { Line } from "./Line.js";
import { s } from "./Game.js";
import { shake, spin } from "./animators.js";

const defaultPosition = [0, 0, 0];

export default ({ position }) => {
  return (
    <Line
      from={[position[0] * s, (-0.5 + position[1]) * s, -0.01, 1 * s]}
      to={[position[0] * s, (0.5 + position[1]) * s, -0.01, 1 * s]}
      
      lineness={20}
      stripiness={0.07}
      bumpiness={0.07}
      //useAlpha
      color={[0.8, 0.75, 0.7]}
      useOutline
    />
  );
};
