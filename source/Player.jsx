import React, { useEffect, useRef } from "react";

import { length, normalize, subtract } from "./libraries/maths.js";
import { useRenderer, useLoop } from "./libraries/WebGL.js";
import { useCamera } from "./libraries/Camera.js";
import { Skeleton } from "./libraries/Skeleton.js";
import { Line } from "./Line.js";
import {
  add,
  pointOnCircle,
  mix,
  distanceBetween,
  directionBetween,
  dot
} from "./libraries/maths.js";
import { s } from "./Game.js";
import { shake, spin } from "./animators.js";

const { sin } = Math;
let pointerAt = [0, 0];
let startedClickingAt = [0, 0];
let clicking = false;

const defaultPosition = [0, 0, 0];
const updater = new Float32Array(4);

export default ({ entity, gameState }) => {
  const { position } = entity;
  const state = useRef({ position: [...position] }).current;

  useEffect(() => {
    const attemptTurn = (oldTile, newTile) => {
      if (!newTile.type.passable) {
        console.log("Not making turn, destination is impassable");
        return;
      }

      gameState.playerEntity.position[0] = newTile.position[0];
      gameState.playerEntity.position[1] = newTile.position[1];

      if (newTile.type.name === "Door") {
        console.log("reset!");
        return gameState.restartLevel();
      }

      for (const entity of gameState.entities) {
        if (
          entity.position[0] === gameState.playerEntity.position[0] &&
          entity.position[1] === gameState.playerEntity.position[1]
        ) {
          if (entity.type.name === "Dust Bunny") {
            destroyEntity(entity);
          } else if (entity.type.name === "Water Baby") {
            destroyEntity(entity);
          }
        }
      }

      for (const entity of gameState.entities) {
        const { type, position } = entity;
        const { name } = type;
        entity.distanceToPlayer = distanceBetween(
          entity.position,
          gameState.playerEntity.position
        );

        if (name === "Dust Bunny") {
          if (entity.distanceToPlayer < 2) {
            const moved = moveRandomly(entity, true, true);

            if (moved) {
              if (entity.counter >= 2 && hasSameTypeOfEntityOnSameTile) {
                const destination = pickRandomAdjacentTile(entity);
                if (destination) {
                  spawnClone(entity, destination.position);
                  entity.counter = 0;
                }
              } else {
                entity.counter++;
              }
            }
          }
        } else if (name === "Water Baby") {
          if (entity.counter >= 7) {
            const destination = pickRandomAdjacentTile(entity);
            if (destination) {
              spawnClone(entity, destination.position);
              entity.counter = 0;
            }
          } else {
            entity.counter++;
          }
        }
      }
    };

    const moveRandomly = (
      entity,
      awayFromPlayer = false,
      overlappingSameEntityTypeIsAllowed = false
    ) => {
      const destination = pickRandomAdjacentTile(entity, awayFromPlayer, true);
      if (destination) {
        entity.position[0] = destination.position[0];
        entity.position[1] = destination.position[1];
        return true;
      }
    };

    const pickRandomAdjacentTile = (
      entity,
      awayFromPlayer = false,
      overlappingSameEntityTypeIsAllowed = false
    ) => {
      let attempts = 4;
      let randomOffset = Math.floor(Math.random() * tileDirections.length);
      while (attempts--) {
        const direction =
          tileDirections[(randomOffset + attempts) % tileDirections.length];

        if (
          awayFromPlayer &&
          dot(
            direction,
            directionBetween(
              entity.position,
              gameState.playerEntity.position,
              directionMeasurer
            )
          ) > 0
        ) {
          continue;
        }

        const destination = gameState.tileMap.get(
          `${entity.position[0] + direction[0]},${-entity.position[1] +
            direction[1]}`
        );
        if (!destination || !destination.type.passable) {
          continue;
        }
        const destinationX = destination.position[0];
        const destinationY = destination.position[1];

        const someEntityInTheWay = gameState.entities.find(
          ({ position, type }) =>
            position[0] === destinationX &&
            position[1] === destinationY &&
            (overlappingSameEntityTypeIsAllowed ? type !== entity.type : true)
        );
        if (someEntityInTheWay) {
          continue;
        }

        return destination;
      }
    };

    const hasSameTypeOfEntityOnSameTile = entity => {
      gameState.entities.find(
        ({ position, type, id }) =>
          id !== entity.id &&
          type.name === name &&
          position[0] === entity.position[0] &&
          position[1] === entity.position[1]
      );
    };

    const spawnClone = (entity, position = entity.position) => {
      const clone = {
        ...entity,
        counter: 0,
        id: Math.random(),
        type: entity.type,
        position: [...position]
      };

      console.log(`Spawning ${entity.type.name}`);
      
      gameState.entities.push(clone);
      gameState.refreshEntities();
    };

    const destroyEntity = entityToDestroy => {
      console.log("Destroying", entityToDestroy.type.name);
      const index = gameState.entities.indexOf(entityToDestroy);
      if (index > -1) {
        gameState.entities.splice(index, 1);
      }
      gameState.refreshEntities();
    };

    const handleClick = event => {
      if (!event.isPrimary) return;
      event.preventDefault();
      pointerAt[0] = event.clientX;
      pointerAt[1] = event.clientY;
      startedClickingAt[0] = event.clientX;
      startedClickingAt[1] = event.clientY;
      clicking = true;
    };

    const handleMove = event => {
      if (!event.isPrimary) return;
      event.preventDefault();
      pointerAt[0] = event.clientX;
      pointerAt[1] = event.clientY;
    };

    const handleRelease = event => {
      if (!event.isPrimary) return;
      event.preventDefault();
      pointerAt[0] = event.clientX;
      pointerAt[1] = event.clientY;
      clicking = false;
      const swipe = subtract(pointerAt, startedClickingAt);
      swipe[1] *= -1;

      const direction = normalize(swipe);
      const swipeLength =
        length(swipe) / Math.min(window.innerWidth, window.innerHeight);
      const tileDirection = direction.map(Math.round);

      if (swipeLength > 0.1) {
        triggerSwipe(tileDirection);
      }
    };

    const triggerSwipe = direction => {
      const newX = position[0] + direction[0];
      const newY = position[1] + direction[1];
      const oldTile = gameState.tileMap.get(`${position[0]},${-position[1]}`);
      const newTile = gameState.tileMap.get(`${newX},${-newY}`);

      if (Math.abs(direction[0]) + Math.abs(direction[1]) !== 2 && newTile) {
        attemptTurn(oldTile, newTile);
      }
    };

    const handleKey = event => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          event.preventDefault();
          triggerSwipe([0, 1]);
          break;

        case "KeyS":
        case "ArrowDown":
          event.preventDefault();
          triggerSwipe([0, -1]);
          break;

        case "KeyA":
        case "ArrowLeft":
          event.preventDefault();
          triggerSwipe([-1, 0]);
          break;

        case "KeyD":
        case "ArrowRight":
          event.preventDefault();
          triggerSwipe([1, 0]);
          break;

        default:
      }
    };

    document.addEventListener("pointerdown", handleClick);
    document.addEventListener("pointerup", handleRelease);
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("pointerdown", handleClick);
      document.removeEventListener("pointerup", handleRelease);
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const updateJoints = (updateJoint, joints, time) => {
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
        // time -> sin(time) * sin(time *1.234)
        shake(0, 0.05, 0.001, time, updater);
      }
      if (name === "whiskers1") {
        // x-amount, y-amount, speed
        // time -> sin(time) * sin(time *1.234)
        shake(
          0.4,
          0,
          0.1,
          sin(time) *
            sin(time * 0.365) *
            sin(time * 0.00009) *
            sin(time * 0.01) *
            sin(time * 0.00009) *
            sin(time * 0.00009) *
            sin(time * 0.00009),
          updater
        );
      }
      if (name === "whiskers2") {
        // x-amount, y-amount, speed
        // time -> sin(time) * sin(time *1.234)
        shake(
          0.4,
          0,
          0.1,
          sin(time) *
            sin(time * 0.365) *
            sin(time * 0.00009) *
            sin(time * 0.01) *
            sin(time * 0.00009) *
            sin(time * 0.00009) *
            sin(time * 0.00009),
          updater
        );
      }
      if (name === "tail") {
        // radius, speed
        spin(0.2, 0.0005, time, updater);
      }
      // Animations above this line
      updateJoint(name, updater);
    }
  };

  const texture1 = {
    color: [0.5, 0.5, 0.5],
    stripiness: 100, // x-axis lines 0, less lines >0
    lineness: 10, // y-axis lines 0, less lines >0
    flowness: 0, // move pattern up to down
    spinniness: 0.01, // move pattern left to right
    swirliness: 0.01, // circular pattern speed
    swirlSize: 0.1, // circular pattern size (never zero)
    bumpiness: 0.6, // 0-1
    useAlpha: false,
    useOutline: false
  };
  const texture2 = {
    color: [0.5, 0.5, 0.55],
    stripiness: 40, // x-axis lines 0, less lines >0
    lineness: 40, // y-axis lines 0, less lines >0
    flowness: 0.1, // move pattern up to down
    spinniness: 0.1, // move pattern left to right
    swirliness: 3, // circular pattern speed
    swirlSize: 10, // circular pattern size (never zero)
    pulseness: 2,
    bumpiness: 0.95, // 0-1
    useAlpha: true,
    useOutline: false
  };

  const whiskerSet = [...Array(3)].map((v, index) => index);

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
        shake(1.5, 0, 0.003, time, updater);
      }
      if (name === "tail") {
        // x-amount, y-amount, speed
        shake(0.6, 0, 0.003, time, updater);
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
    <>
      <Skeleton
        onLoop={updateJoints}
        head={[0, 4, 0, 0]}
        nose={[-1.5, 4, 0, 0]}
        whiskers1={[-1.5, 4.3, 0, 0]}
        whiskers2={[-1.8, 3.4, 0, 9]}
        toes={[0, 0, 0, 0]}
        tail={[3, 0, 0, 0]}
      >
        <Line //head
          fromJoint="head"
          toJoint="nose"
          from={[0.6, 0, 0, 2]}
          to={[0, 0, 0, 0.1]}
          rounding={1}
          {...texture1}
        />
        <Line //headbackground
          fromJoint="head"
          toJoint="nose"
          from={[0.6, 0, -0.1, 2]}
          to={[0, 0, -0.1, 0.1]}
          rounding={1}
          color={[0.5, 0.5, 0.55]}
        />
        eyes
        <Line //white-eye
          fromJoint="head"
          toJoint="head"
          from={[-0.2, -0, 0.1, 0.5]}
          to={[0.3, -0.1, 0.1, 0.5]}
          //control={[0.75, -1, 1, 0.7]}
          //control2={[0.9, -1.5, 0, 0.6]}
          color={[1, 1, 0.95]}
          rounding={1}
          useAlpha={false}
          useOutline={false}
        />
        <Line //black-eye
          fromJoint="head"
          toJoint="head"
          from={[-0.2, -0, 0.2, 0.4]}
          to={[0.2, -0, 0.2, 0.4]}
          //control={[0.75, -1, 1, 0.7]}
          //control2={[0.9, -1.5, 0, 0.6]}
          color={[0, 0, 0]}
          rounding={1}
          useAlpha={false}
          useOutline={false}
        />
        {whiskerSet.map(whisker => (
          <Line //whiskers1
            key={whisker}
            fromJoint="nose"
            toJoint="whiskers1"
            from={[0.2, 0, 0, 0.01]}
            to={[...pointOnCircle(0.3, whisker * 0.7), 0, 0.01]}
            control={[0.1, 0, 0, 0]}
            color={[0, 0, 0]}
          />
        ))}
        {whiskerSet.map(whisker => (
          <Line //whiskers2
            key={whisker}
            fromJoint="nose"
            toJoint="whiskers2"
            from={[0.2, 0, 0, 0.01]}
            to={[...pointOnCircle(0.22, whisker * 0.7), 0, 0.01]}
            control={[0.1, -0.1, 0, 0]}
            color={[0, 0, 0]}
          />
        ))}
        <Line //ear1
          fromJoint="head"
          from={[-0.2, 0.8, 0, 0.7]}
          to={[0.2, 0.8, 0, 0.7]}
          rounding={1}
          {...texture1}
        />
        <Line //ear2
          fromJoint="head"
          from={[0.2, 0.8, 0, 0.7]}
          to={[0.8, 0.8, 0, 0.7]}
          rounding={1}
          {...texture1}
        />
        <Line //ear1bg
          fromJoint="head"
          from={[-0.2, 0.8, -0.1, 0.7]}
          to={[0.2, 0.8, -0.1, 0.7]}
          rounding={1}
          color={[0.5, 0.5, 0.55]}
        />
        <Line //ear2bg
          fromJoint="head"
          from={[0.2, 0.8, -0.1, 0.7]}
          to={[0.8, 0.8, -0.1, 0.7]}
          rounding={1}
          color={[0.5, 0.5, 0.55]}
        />
        <Line //body
          fromJoint="head"
          toJoint="toes"
          from={[0, 0, 0, 0.5]}
          to={[0, 0, 0, 3]}
          rounding={0.7}
          {...texture1}
        />
        <Line //apron
          fromJoint="head"
          toJoint="toes"
          from={[-0.3, -0.8, 0.1, 0.6]}
          to={[-0.2, 0, 0.1, 2.5]}
          control={[-0.5, -1, 0.1, 1.4]}
          control2={[-0.2, 0, 0.1, 2]}
          rounding={0.2}
          color={[1, 1, 0.9]}
          useOutline={true}
        />
        <Line //tail
          fromJoint="toes"
          toJoint="tail"
          from={[0, 1, 0, 0.4]}
          to={[0, 0, 0, 0.03]}
          control={[2, -1, 0, 0]}
          color={[0.5, 0.5, 0.55]}
        />
        <Line //tail
          fromJoint="toes"
          toJoint="tail"
          from={[0, 1, 0.1, 0.4]}
          to={[0, 0, 0.1, 0.03]}
          control={[2, -1, 0, 0]}
          color={[0.5, 0.5, 0.55]}
          {...texture1}
        />
      </Skeleton>

      <Skeleton
        onLoop={updateBroomJoints}
        top={[-0.4, 3.2, 1, 0]}
        bottom={[-0.4, 0.2, 1, 0]}
        tail={[-0.4, -2.2, 1, 0]}
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
    </>
  );
};

const directionMeasurer = [];
const tileDirections = [[0, 1], [0, -1], [1, 0], [-1, 0]];
