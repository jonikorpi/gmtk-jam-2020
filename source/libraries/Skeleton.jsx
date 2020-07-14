import React, { createContext, useContext, useRef } from "react";

import { useRenderer, useLoop } from "./WebGL.js";
import { useCommand } from "./Command.js";
import { Line } from "../Line.js";

const debug = false;
const debugColor = [1, 0, 0];

const SkeletonContext = createContext({});
export const useSkeleton = () => useContext(SkeletonContext);
const jointRegistry = new Map([[0, "NULL_JOINT"]]);
const availableSlots = [];

export const Skeleton = ({ children, onLoop, ...joints }) => {
  const registeredJoints = useRef(new Map()).current;
  const { updateTexture } = useRenderer();

  for (const key in joints) {
    joints[key] = new Float32Array(joints[key]);
  }

  const updateJoint = (key, data) => {
    const index = registeredJoints.get(key);
    const x = index % 128;
    const y = Math.floor(index / 128);
    updateTexture("joints", data, x, y);
  };

  // Delete removed joints
  for (const [key, index] of registeredJoints) {
    if (!joints[key]) {
      unregisterJoint(index);
      registeredJoints.delete(key);
    }
  }

  for (const key in joints) {
    // Register new joints
    if (key && !registeredJoints.has(key)) {
      registeredJoints.set(key, registerJoint(key));
    }

    // Update joints in global texture
    updateJoint(key, joints[key]);
  }

  useLoop(
    onLoop &&
      ((timestamp, clock, frameNumber) =>
        onLoop(updateJoint, joints, timestamp, clock, frameNumber))
  );

  const { ancestorSkeletons } = useSkeleton();
  const getJoint = key => {
    if (registeredJoints.has(key)) {
      return registeredJoints.get(key);
    } else if (ancestorSkeletons) {
      for (const ancestorSkeleton of ancestorSkeletons) {
        if (ancestorSkeleton.has(key)) {
          return ancestorSkeleton.get(key);
        }
      }
    }
    return 0;
  };

  return (
    <SkeletonContext.Provider
      value={{
        getJoint,
        ancestorSkeletons: [...(ancestorSkeletons || []), registeredJoints]
      }}
    >
      {children}
      {debug && [...registeredJoints].map(([name]) => (
        <Line key={name} fromJoint={name} color={debugColor} rounding={1} from={[0,-0.05,0,0.1]} to={[0,0.05,0,0.1]} depth={false} />
      ))}
    </SkeletonContext.Provider>
  );
};

const registerJoint = (key, data) => {
  const index =
    availableSlots.length > 0 ? availableSlots.shift() : jointRegistry.size;
  jointRegistry.set(index, key);
  return index;
};
const unregisterJoint = index => {
  jointRegistry.delete(index);
  availableSlots.push(index);
};
