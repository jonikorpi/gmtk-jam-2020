import React, {useRef} from "react";

import { useRenderer, useLoop } from "./libraries/WebGL.js";
import { useCamera } from "./libraries/Camera.js";
import { Skeleton } from "./libraries/Skeleton.js";
import { Line } from "./Line.js";
import { add, mix, distanceBetween } from "./libraries/maths.js";
import { shake, spin } from "./animators.js";
import { s } from "./Game.js";

const defaultPosition = [0, 0, 0];
const updater = new Float32Array(4);

export default ({ entity, gameState }) => {
  const { position, distanceToPlayer } = entity;
  const state = useRef({ position: [...position] }).current;

  const updateJoints = (updateJoint, joints, time) => {
    state.position[0] = mix(state.position[0], position[0], 0.146);
    state.position[1] = mix(state.position[1], position[1], 0.146);

    for (const name in joints) {
      const joint = joints[name];
      updater[0] = joint[0] + state.position[0] * s;
      updater[1] = joint[1] + state.position[1] * s;
      updater[2] = joint[2];
      // Animations below this line
      
      // Animations above this line
      updateJoint(name, updater);
    }
  };

  return (
      <Skeleton
      onLoop={updateJoints}
      cloth={[0, 0, 1, 0]}
      //bottom={[0, 0, 1, 0]}
      
    >
      body
      <Line
        fromJoint="cloth"
        toJoint="cloth"
        from={[0.5, 1.3, 1, 1]}
        to={[-0.5, 0, 1, 1]}
        control={[-1, 0.5, -1, 1]}
        control2={[1, 1, 1, 0]}
        color={[0.9, 0.6, 0.7]}
        stripiness={15}
        lineness={2}
        swirliness={0.03}
        swirlSize={2}
        bumpiness={0.2}
        rounding={0.8}
        useAlpha={false}
        useOutline={true}
      />
    </Skeleton>
  );
};
