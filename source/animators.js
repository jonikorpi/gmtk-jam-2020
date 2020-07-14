import { add, pointOnCircle } from "./libraries/maths.js";

export const shake = (x, y, speed, time, updater) => {
  updater[0] += Math.sin(time * speed) * x;
  updater[1] += Math.sin(time * speed) * y;
};

const tempSpinner = [];
export const spin = (radius, speed, time, updater) => {
  pointOnCircle(radius, ((time * speed) % Math.PI) * 2, tempSpinner);
  updater[0] += tempSpinner[0];
  updater[1] += tempSpinner[1];
};