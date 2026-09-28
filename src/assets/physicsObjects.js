import { Bodies } from 'matter-js';

export const ASSET_DESCRIPTORS = {
  rocket: { id: 'rocket', kind: 'rocket', width: 0.8, height: 2.2 },
  launchPad: { id: 'launch-pad', kind: 'launch-pad' },
  ground: { id: 'ground', kind: 'ground' },
};

export function createRocket({ x, y, scale }) {
  const descriptor = ASSET_DESCRIPTORS.rocket;
  const body = Bodies.rectangle(x, y, descriptor.width * scale, descriptor.height * scale, {
    label: descriptor.id,
    friction: 0,
    frictionAir: 0,
    restitution: 0,
    inertia: Infinity,
  });
  body.plugin = { assetId: descriptor.id };
  return body;
}

export function createGround({ x, y, width, scale }) {
  const body = Bodies.rectangle(x, y, width * scale, 0.25 * scale, {
    isStatic: true,
    label: ASSET_DESCRIPTORS.ground.id,
  });
  body.plugin = { assetId: ASSET_DESCRIPTORS.ground.id };
  return body;
}
