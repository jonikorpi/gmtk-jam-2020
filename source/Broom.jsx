import React, { useRef } from "react";

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

  const updateBroomJoints = (updateJoint, joints, time) => {
    state.position[0] = mix(state.position[0], position[0], 0.146);
    state.position[1] = mix(state.position[1], position[1], 0.146);

    for (const name in joints) {
      const joint = joints[name];
      updater[0] = joint[0] + state.position[0] * s;
      updater[1] = joint[1] + state.position[1] * s;
      updater[2] = joint[2];
      // Animations below this line
      if (name === "bottom") {
        // x-amount, y-amount, speed
        shake(1.5, 0, 0.001, time, updater);
      }
      if (name === "tail") {
        // x-amount, y-amount, speed
        shake(0.6, 0, 0.001, time, updater);
      }

      // Animations above this line
      updateJoint(name, updater);
    }
  };
  const broomTexture1 = {
    color: [0.5, 0.5, 0.5],
    stripiness: 60, // x-axis lines 0, less lines >0
    lineness: 0.1, // y-axis lines 0, less lines >0
    flowness: 0.1, // move pattern up to down
    spinniness: 0.1, // move pattern left to right
    swirliness: 6, // circular pattern speed
    swirlSize: 20, // circular pattern size (never zero)
    bumpiness: 0.99, // 0-1
    pulseness: 2,
    useAlpha: true,
    useOutline: false,
    rounding: 0.854
  };
  const broomTexture2 = {
    color: [0.5, 0.5, 0.5],
    stripiness: 50, // x-axis lines 0, less lines >0
    lineness: 50, // y-axis lines 0, less lines >0
    flowness: 0.1, // move pattern up to down
    spinniness: 0.1, // move pattern left to right
    swirliness: 3, // circular pattern speed
    swirlSize: 10, // circular pattern size (never zero)
    bumpiness: 0.95, // 0-1
    useAlpha: true,
    useOutline: false,
    rounding: 0.854
  };
  return (
    <Skeleton
      onLoop={updateBroomJoints}
      top={[0, 3, 1, 0]}
      bottom={[0, 0, 1, 0]}
      tail={[0, -2, 1, 0]}
    >
      handle
      <Line
        fromJoint="top"
        toJoint="bottom"
        from={[0, 0, 0, 0.15]}
        to={[0, 0, 0, 0.15]}
        //control={[-1, 0.5, -1, 1]}
        //control2={[1, 1, 1, 0]}
        color={[0.3, 0.25, 0.25]}
        lineness={[2]}
        bumpiness={0.17}
        useAlpha={true}
        useOutline={false}
      />
      bristles
      <Line
        fromJoint="bottom"
        toJoint="tail"
        from={[0, 0.2, 0.2, 1]}
        to={[0.6, 0, 0.2, 0.2]}
        control={[0, -1.2, 1, 1]}
        control2={[1, 1.5, 1, 1]}
        color={[0.8, 0.8, 0.2]}
        lineness={0.1}
        stripiness={15}
        bumpiness={0.17}
        rounding={1}
        useAlpha={false}
        useOutline={true}
      />
      <Line
        fromJoint="tail"
        from={[-1, 2.5, 0, 0.5]}
        to={[0, 1.5, 0, 1]}
        control={[-2, 0, 0, 3]}
        rounding={1}
        {...broomTexture1}
      />
      <Line
        fromJoint="tail"
        from={[-1, 2.5, 0, 0.5]}
        to={[0, 1.5, 0, 1]}
        control={[-2, 0, 0, 3]}
        rounding={1}
        {...broomTexture2}
      />
      />
      <Line
        fromJoint="tail"
        from={[1, 2.5, 0, 0.5]}
        to={[2, 1.5, 0, 1]}
        control={[0, 0, 0, 3]}
        rounding={1}
        {...broomTexture1}
      />
      <Line
        fromJoint="tail"
        from={[1, 2.5, 0, 0.5]}
        to={[2, 2.5, 0, 1]}
        control={[0.5, 0, 0, 3]}
        rounding={1}
        {...broomTexture2}
      />
    </Skeleton>
  );
};
