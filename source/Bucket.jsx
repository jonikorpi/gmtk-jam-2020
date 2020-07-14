import React, {useRef} from "react";

import { useRenderer, useLoop } from "./libraries/WebGL.js";
import { useCamera } from "./libraries/Camera.js";
import { Skeleton } from "./libraries/Skeleton.js";
import { Line } from "./Line.js";
import { add, distanceBetween, mix } from "./libraries/maths.js";
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
      top={[0, 1, 1, 0]}
      bottom={[0, -1, 1, 0]}
      
    >
      sides
      <Line
        fromJoint="top"
        toJoint="bottom"
        from={[0, 0, 0, 2]}
        to={[0, 0, 0, 1]}
        //control={[0, 0, 0, 3.7]}
        //control2={[0, 0, 0, 3.7]}
        color={[0.6, 0.6, 0.6]}
        stripiness={[2]}
        lineness={0}
        swirliness={0.2}
        swirlsize={10}
        bumpiness={0.1}
        rounding={0.1}
        useAlpha={true}
        useOutline={false}
      />
      mouth
      <Line
        fromJoint="top"
        toJoint="top"
        from={[0, 0.1, 0.1, 2]}
        to={[0, -0.2, 0.1, 2]}
        //control={[0, 0, 0, 3.7]}
        //control2={[0, 0, 0, 3.7]}
        color={[0.7, 0.7, 0.7]}
        stripiness={[2]}
        lineness={0}
        swirliness={0.2}
        swirlsize={10}
        bumpiness={0.1}
        rounding={1}
        useAlpha={true}
        useOutline={true}
      />
      handle
      <Line
        fromJoint="top"
        toJoint="top"
        from={[-0.1, -0.2, 0.2, 0.2]}
        to={[1, -1, 0.2, 0.2]}
        //control={[0, 0, 0, 3.7]}
        //control2={[0, 0, 0, 3.7]}
        color={[0.7, 0.7, 0.7]}
        stripiness={[0]}
        lineness={0}
        swirliness={0}
        swirlsize={0}
        bumpiness={0}
        rounding={0.4}
        useAlpha={true}
        useOutline={true}
      />
    </Skeleton>
  );
};
