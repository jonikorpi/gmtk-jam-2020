import React, { useRef } from "react";

import { useRenderer, useLoop } from "./libraries/WebGL.js";
import { useCamera } from "./libraries/Camera.js";
import { Skeleton } from "./libraries/Skeleton.js";
import { Line } from "./Line.js";
import { add, distanceBetween, mix } from "./libraries/maths.js";
import { shake, spin } from "./animators.js";
import { s } from "./Game.js";

const defaultPosition = [0, 0, 0];
const updater = new Float32Array(4);

let instanceID = 0;

export default ({ entity, gameState }) => {
  const { playerEntity } = gameState;

  const offset = useRef(instanceID++).current;
  const { position, distanceToPlayer } = entity;
  const state = useRef({ position: [...position] }).current;

  const updateJoints = (updateJoint, joints, timestamp) => {
    const time = timestamp + offset * 161.8;
    const { position, distanceToPlayer } = entity;
    state.position[0] = mix(state.position[0], position[0], 0.146);
    state.position[1] = mix(state.position[1], position[1], 0.146);

    for (const name in joints) {
      const joint = joints[name];
      updater[0] = joint[0] + state.position[0] * s;
      updater[1] = joint[1] + state.position[1] * s;
      updater[2] = joint[2];
      // Animations below this line

      if (name === "ears") {
        // radius, speed
        spin(0.1, 0.01 / distanceToPlayer, time, updater);
      }

      if (name === "groin") {
        // x-amount, y-amount, speed
        shake(0.1, 0, 0.001, time, updater);
      }
      if (name === "neck") {
        // x-amount, y-amount, speed
        shake(0, -0.08, 0.001, time, updater);
      }

      // Animations above this line
      updateJoint(name, updater);
    }
  };

  const ear1 = {
    from: [0, 0.5, 0, 0.3],
    to: [0, 0, 0, 0.6],
    control: [0, 3, 0, 1]
    //control2: [0, 0, 0, 1],
  };

  const ear2 = {
    from: [0.5, 1, 0, 0.3],
    to: [1, -0.3, 0, 0.5],
    control: [1, 2.5, 0, 1]
    //control2: [0, 0, 0, 1],
  };

  const texture1 = {
    color: [0.5, 0.5, 0.5],
    stripiness: 60, // x-axis lines 0, less lines >0
    lineness: 0.1, // y-axis lines 0, less lines >0
    flowness: 0.1, // move pattern up to down
    spinniness: 0.1, // move pattern left to right
    swirliness: 6, // circular pattern speed
    swirlSize: 20, // circular pattern size (never zero)
    bumpiness: 0.99, // 0-1
    useAlpha: true,
    useOutline: false,
    rounding: 0.854
  };
  const texture2 = {
    color: [0.5, 0.5, 0.5],
    stripiness: 40, // x-axis lines 0, less lines >0
    lineness: 40, // y-axis lines 0, less lines >0
    flowness: 0.1, // move pattern up to down
    spinniness: 0.1, // move pattern left to right
    swirliness: 3, // circular pattern speed
    swirlSize: 10, // circular pattern size (never zero)
    pulseness: 2,
    bumpiness: 0.95, // 0-1
    useAlpha: true,
    useOutline: false,
    rounding: 0.854
  };

  return (
    <Skeleton
      onLoop={updateJoints}
      ears={[2, 1.5, 0, 0]}
      neck={[1, 0, 0, 0]}
      groin={[-0.6, -0.5, 0, 0]}
      //backlegs={[0, 0, 0, 0]}
      //frontlegs={[0, 0, 0, 0]}
    >
      Ear1
      <Line fromJoint="neck" toJoint="ears" {...ear1} {...texture1} />
      <Line fromJoint="neck" toJoint="ears" {...ear1} {...texture2} />
      Ear2
      <Line fromJoint="neck" toJoint="ears" {...ear2} {...texture1} />
      <Line fromJoint="neck" toJoint="ears" {...ear2} {...texture2} />
      Head
      <Line
        fromJoint="neck"
        from={[-0.2, 0.5, 1]}
        to={[1, 0.5, 0, 1]}
        rounding={1}
        {...texture1}
      />
      <Line
        fromJoint="neck"
        from={[-0.2, 0.5, 0, 1]}
        to={[1, 0.5, 0, 1]}
        rounding={1}
        {...texture2}
      />
      Body
      <Line
        fromJoint="neck"
        toJoint="groin"
        from={[0.2, 0, 0, 1.7]}
        to={[0, 0, 0, 1.7]}
        rounding={1}
        {...texture1}
      />
      <Line
        fromJoint="neck"
        toJoint="groin"
        from={[0.2, 0, 0, 1.7]}
        to={[0, 0, 0, 1.7]}
        rounding={1}
        {...texture2}
      />
      Tail
      <Line
        fromJoint="groin"
        from={[0, 0, 0, 0.7]}
        to={[0, 0.7, 0, 0.7]}
        rounding={1}
        {...texture1}
      />
      <Line
        fromJoint="groin"
        from={[0, 0, 0, 0.7]}
        to={[0, 0.7, 0, 0.7]}
        rounding={1}
        {...texture2}
      />
    </Skeleton>
  );
};
