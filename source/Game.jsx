import React, { useRef, useEffect, useState, useMemo, memo } from "react";

import { useRenderer, useLoop } from "./libraries/WebGL.js";
import { useCamera } from "./libraries/Camera.js";
import { Skeleton } from "./libraries/Skeleton.js";
import { mix } from "./libraries/maths.js";
import DustBunny from "./DustBunny.js";
import WaterBaby from "./WaterBaby.js";
import Floor from "./Floor.js";
import Wall from "./Wall.js";
import Broom from "./Broom.js";
import Bucket from "./Bucket.js";
import Rag from "./BRag.js";
import Player from "./Player.js";
import { Line } from "./Line.js";

const map = `
XXXXXXXXXXXXXXXXXX
XD    DDX       DX
X     DDX  D     X
X       X  XXXX  X
X          X     X
X               WX
X   X    XXXD  XXX
X   XD  W  X     X
X   X      X     X
XW  X P      D   X
XXXXXXOXXXXXXXXXXX
`;

const types = {
  " ": { name: "Floor", Element: Floor, passable: true },
  O: { name: "Door", passable: true, Element: Floor },
  X: { name: "Wall", Element: Wall },
  W: { name: "Water Baby", entity: true, Element: WaterBaby },
  D: { name: "Dust Bunny", entity: true, Element: DustBunny },
  P: { name: "Player", entity: true, Element: Player },
  B: { name: "Broom", entity: true, Element: Broom },
  R: { name: "Rag", entity: true, Element: Rag },
  U: { name: "Bucket", entity: true, Element: Bucket }
};

const room = map.split("\n");
room.pop();
room.shift();
const roomHeight = room.length;
let roomWidth = room.reduce((roomWidth, line) => {
  return Math.max(roomWidth, line.length);
}, 0);

export const s = 3.5;
const cameraDistance = 55;
const cameraOffset = [0, -cameraDistance * 0.1, cameraDistance];
const cameraFocus = [0, 0, 0];

export default () => {
  const gameState = useRef({ tileMap: new Map(), tileList: [], entities: [] })
    .current;
  const [refresher, setRefresher] = useState(0);
  const [entityRefresher, setEntityRefresher] = useState(0);

  useMemo(() => {
    const { entities, tileMap, tileList } = gameState;

    tileMap.clear();
    tileList.length = 0;
    entities.length = 0;

    room.forEach((line, y) => {
      [...line].forEach((type, x) => {
        const tile = {
          position: [x, -y],
          type: types[type] || types[" "],
          distanceToPlayer: 1000,
          counter: 0,
          id: Math.random()
        };

        let tileToSaveOnMap;

        if (tile.type.entity) {
          entities.push(tile);
          tileToSaveOnMap = {
            ...tile,
            position: [...tile.position],
            type: types[" "]
          };
        } else {
          tileToSaveOnMap = tile;
        }

        tileList.push(tileToSaveOnMap);
        gameState.tileMap.set(
          `${tile.position[0]},${-tile.position[1]}`,
          tileToSaveOnMap
        );
      });
    });
  }, [refresher]);

  gameState.playerEntity = gameState.entities.find(
    ({ type }) => type.name === "Player"
  );
  gameState.restartLevel = () => {
    setRefresher(refresher + 1);
  };
  gameState.refreshEntities = () => {
    setEntityRefresher(entityRefresher + 1);
  };
  const { entities, tileMap, tileList, playerEntity } = gameState;

  const { clear, setClear, updateAllUniforms } = useRenderer();
  const camera = useCamera();
  useEffect(() => {
    camera.position[0] = cameraOffset[0] + cameraFocus[0];
    camera.position[1] = cameraOffset[1] + cameraFocus[1];
    camera.position[2] = cameraOffset[2] + cameraFocus[2];
  }, []);

  setClear([1, 1, 1, 1]);
  clear();

  useLoop(timestamp => {
    cameraFocus[0] = mix(cameraFocus[0], playerEntity.position[0] * s, 0.1);
    cameraFocus[1] = mix(cameraFocus[1], playerEntity.position[1] * s, 0.1);
    camera.position[0] = cameraOffset[0] + cameraFocus[0];
    camera.position[1] = cameraOffset[1] + cameraFocus[1];
    camera.position[2] = cameraOffset[2] + cameraFocus[2];

    camera.lookAt(cameraFocus);
    camera.up[0] = 0;
    camera.up[1] = 1;
    camera.up[2] = 0;
    camera.update();

    updateAllUniforms("time", timestamp / 1000);
    updateAllUniforms("projectionView", camera.projView);
    clear();
  });

  return (
    <>
      {useMemo(
        () =>
          tileList.map(({ position, type, id }) => {
            const { name, passable, Element } = type;
            return Element ? (
              <Element key={id} position={position} gameState={gameState} />
            ) : null;
          }),
        [refresher]
      )}

      {entities.map(entity => {
        const { position, type, id } = entity;
        const { Element } = type;
        return (
          <EntityWrapper
            key={id}
            Element={Element}
            entity={entity}
            gameState={gameState}
          />
        );
      })}
    </>
  );
};

const EntityWrapper = memo(({ Element, entity, gameState }) => {
  return <Element entity={entity} gameState={gameState} />;
});
