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

let instanceID = 0;

export default ({ entity, gameState }) => {
  const { playerEntity } = gameState;
  const offset = useRef(instanceID++).current;
  const { position, distanceToPlayer } = entity;
  const state = useRef({ position: [...position] }).current;

  const updateJoints = (updateJoint, joints, timestamp) => {
    const time = timestamp + offset * 161.8;
    const { position, distanceToPlayer, counter } = entity;
    state.position[0] = mix(state.position[0], position[0], 0.146);
    state.position[1] = mix(state.position[1], position[1], 0.146);

    for (const name in joints) {
      const joint = joints[name];
      updater[0] = joint[0] + state.position[0] * s;
      updater[1] = joint[1] + state.position[1] * s;
      updater[2] = joint[2];
      // Animations below this line
      if (name === "head") {
        // x-amount, y-amount, speed
        shake(0, 0.15, 0.003, time, updater);
      }
      if (name === "face") {
        // x-amount, y-amount, speed
        shake(0, 0.075, 0.003, time, updater);
      }

      if (name === "face") {
        // radius, speed
        spin(0.075, 0.001, time, updater);
      }
      if (name === "eyes") {
        // radius, speed
        spin(0.05, 0.001, time, updater);
      }
      if (name === "groin") {
        // radius, speed
        spin(0.2, 0.001, time, updater);
      }
      if (name === "leg1") {
        // x-amount, y-amount, speed
        shake(0, 0.2, 0.002, time, updater);
      }
      if (name === "leg2") {
        // x-amount, y-amount, speed
        shake(0, 0.2, -0.002, time, updater);
      }
      if (name === "arm1") {
        // x-amount, y-amount, speed
        shake(0, 0.1, 0.001, time, updater);
      }
      if (name === "arm2") {
        // x-amount, y-amount, speed
        shake(0, 0.11, 0.002, time, updater);
      }
      if (name === "arm1") {
        // x-amount, y-amount, speed
        shake(0.09, 0, 0.002, time, updater);
      }
      if (name === "arm2") {
        // x-amount, y-amount, speed
        shake(0.1, 0, 0.001, time, updater);
      }
      // Animations above this line
      updateJoint(name, updater);
    }
  };

  const leg1 = {
    from: [-0.65, 0.4, 0.01, 0.9],
    to: [0, 0, 0.01, 0.4],
    control: [-0.35, 0, 0, 0.4]
    //control2: [-0.35, 0, 0, 0.4]
  };
  const leg1a = {
    from: [-0.65, 0.4, 0.02, 0.9],
    to: [0, 0, 0.02, 0.4],
    control: [-0.35, 0, 0, 0.4]
    //control2: [-0.35, 0, 0, 0.4]
  };

  const leg2 = {
    from: [0.65, 0.4, 0.01, 0.9],
    to: [0, 0, 0, 0.4],
    control: [0.35, 0, 0, 0.4]
    //control2: [0.35, 0, 0, 0.4]
  };
  const leg2a = {
    from: [0.65, 0.4, 0.02, 0.9],
    to: [0, 0, 0, 0.4],
    control: [0.35, 0, 0, 0.4]
    //control2: [0.35, 0, 0, 0.4]
  };

  const bodyMaterial = {
    stripiness: 2,
    lineness: 1,
    flowness: -0.15,
    spinniness: 0.15,
    swirliness: 0.9,
    swirlSize: 1.5
  };

  return (
    <Skeleton
      onLoop={updateJoints}
      head={[0, 3, 0, 0]}
      face={[0, 2, 1, 0]}
      eyes={[-0.5, 1.9, 1.382, 0]}
      groin={[0, -1, 0, 0]}
      leg1={[-0.8, -1.3, 0, 0]}
      leg2={[0.8, -1.3, 0, 0]}
      arm1={[-2, 0.5, 0, 0]}
      arm2={[2, 0.5, 0, 0]}
    >
      body
      <Line
        fromJoint="groin"
        toJoint="head"
        from={[0, 0, 0.02, 1]}
        to={[0, 0, 0.02, 1]}
        control={[0, 0, 0, 3.7]}
        control2={[0, 0, 0, 3.7]}
        color={[0.56, 0.73, 0.88]}
        {...bodyMaterial}
        bumpiness={0.17}
        useAlpha={true}
        useOutline={false}
      />
      <Line
        fromJoint="groin"
        toJoint="head"
        from={[0, 0, 0.03, 1]}
        to={[0, 0, 0.03, 1]}
        control={[0, 0, 0.01, 3.7]}
        control2={[0, 0, 0.01, 3.7]}
        color={[0.5, 0.7, 0.84]}
        {...bodyMaterial}
        bumpiness={0.5}
        useAlpha={true}
        useOutline={false}
      />
      leg1
      <Line
        fromJoint="groin"
        toJoint="leg1"
        {...leg1}
        color={[0.56, 0.73, 0.88]}
        {...bodyMaterial}
        rounding={1}
        bumpiness={0.17}
        useAlpha={true}
        useOutline={false}
      />
      <Line
        fromJoint="groin"
        toJoint="leg1"
        {...leg1a}
        color={[0.5, 0.7, 0.84]}
        {...bodyMaterial}
        rounding={1}
        bumpiness={0.5}
        useAlpha={true}
        useOutline={false}
      />
      leg2
      <Line
        fromJoint="groin"
        toJoint="leg2"
        {...leg2}
        color={[0.56, 0.73, 0.88]}
        {...bodyMaterial}
        rounding={1}
        bumpiness={0.17}
        useAlpha={true}
        useOutline={false}
      />
      <Line
        fromJoint="groin"
        toJoint="leg2"
        {...leg2a}
        color={[0.5, 0.7, 0.84]}
        {...bodyMaterial}
        rounding={1}
        bumpiness={0.5}
        useAlpha={true}
        useOutline={false}
      />
      arm1
      <Line
        fromJoint="arm1"
        toJoint="arm1"
        {...leg1}
        from={[1, 1, 0.01, 0.8]}
        color={[0.56, 0.73, 0.88]}
        {...bodyMaterial}
        rounding={1}
        bumpiness={0.17}
        useAlpha={true}
        useOutline={false}
      />
      <Line
        fromJoint="arm1"
        toJoint="arm1"
        {...leg1a}
        from={[1, 1, 0.02, 0.8]}
        color={[0.5, 0.7, 0.84]}
        {...bodyMaterial}
        rounding={1}
        bumpiness={0.5}
        useAlpha={true}
        useOutline={false}
      />
      arm2
      <Line
        fromJoint="arm2"
        toJoint="arm2"
        {...leg2}
        from={[-1, 1, 0.01, 0.8]}
        color={[0.56, 0.73, 0.88]}
        {...bodyMaterial}
        rounding={1}
        bumpiness={0.17}
        useAlpha={true}
        useOutline={false}
      />
      <Line
        fromJoint="arm2"
        toJoint="arm2"
        {...leg2a}
        from={[-1, 1, 0.02, 0.8]}
        color={[0.5, 0.7, 0.84]}
        {...bodyMaterial}
        rounding={1}
        bumpiness={0.5}
        useAlpha={true}
        useOutline={false}
      />
      mouth
      <Line //mouth
        fromJoint="face"
        toJoint="face"
        from={[-0.8, -0.6, 1, 0.3]}
        to={[1.1, -0.6, 1, 0.3]}
        control={[-0.5, -0.5, 1, 0.5]}
        control2={[0.9, -0.5, 0, 0.5]}
        color={[1, 1, 1]}
        stripiness={0.1}
        lineness={0}
        flowness={0}
        spinniness={-0.02}
        swirliness={0.002}
        swirlSize={10}
        bumpiness={0.8}
        rounding={1}
        useAlpha={true}
        useOutline={false}
      />
      eyes
      <Line //white-eye
        fromJoint="face"
        toJoint="face"
        from={[0.5, -0, 0.9, 0.5]}
        to={[1, -0, 0.9, 0.5]}
        //control={[0.75, -1, 1, 0.7]}
        //control2={[0.9, -1.5, 0, 0.6]}
        color={[1, 1, 1]}
        rounding={1}
        useAlpha={false}
        useOutline={false}
      />
      <Line //black-eye
        fromJoint="eyes"
        toJoint="eyes"
        from={[1.1, -0, 1, 0.3]}
        to={[1.4, -0, 1, 0.3]}
        //control={[0.75, -1, 1, 0.7]}
        //control2={[0.9, -1.5, 0, 0.6]}
        color={[0, 0, 0]}
        rounding={1}
      />
      <Line //white-eye
        fromJoint="face"
        toJoint="face"
        from={[-0.5, -0, 0.9, 0.5]}
        to={[-1, -0, 0.9, 0.5]}
        //control={[-0.75, -1, 1, 0.7]}
        //control2={[0.9, -1.5, 0, 0.6]}
        color={[1, 1, 1]}
        rounding={1}
        useAlpha={false}
        useOutline={false}
      />
      <Line //black-eye
        fromJoint="eyes"
        toJoint="eyes"
        from={[-0.1, -0, 1, 0.3]}
        to={[-0.4, -0, 1, 0.3]}
        //control={[-0.75, -1, 1, 0.7]}
        //control2={[0.9, -1.5, 0, 0.6]}
        color={[0, 0, 0]}
        rounding={1}
      />
    </Skeleton>
  );
};

{
  /*<Line //sock
          fromJoint="face"
          toJoint="face"
          from={[0.5, -0.9, 1, 0.5]}
          to={[1, -0.9, 1, 0.5]}
          control={[0.5, -1, 1, 1]}
          control2={[0.5, -1, 1, 1]}
          color={[1, 1, 0]}
          stripiness={0}
          lineness={0}
          flowness={0}
          spinniness={0}
          swirliness={0}
          swirlSize={0}
          bumpiness={0}
          useAlpha={true}
          useOutline={false}
        />*/
}
