import { Bodies, Body, Engine, World } from 'matter-js';
import { createGround, createRocket } from '../assets/physicsObjects.js';
import { getEnvironment } from '../environments/index.js';
import { positionAtTime, rocketPositionAtTime, velocityAtTime } from './kinematics.js';

const SCALE = 48;
const WORLD_WIDTH = 1000;
const GROUND_Y = 590;
const ROCKET_HEIGHT = 2.2;

export const DEFAULT_PARAMS = {
  initialVelocity: 0,
  thrustAcceleration: 22,
  burnDuration: 4,
  initialHeight: 0,
};

export class RocketExperiment {
  constructor(params = DEFAULT_PARAMS, environmentId = 'earth') {
    this.params = { ...DEFAULT_PARAMS, ...params };
    this.environment = getEnvironment(environmentId);
    this.engine = Engine.create({ enableSleeping: false });
    this.engine.gravity.scale = 0;
    this.time = 0;
    this.running = false;
    this.status = 'ready';
    this.rocket = null;
    this.ground = null;
    this.reset();
  }

  reset(params = this.params, environmentId = this.environment.id) {
    this.params = { ...DEFAULT_PARAMS, ...params };
    this.environment = getEnvironment(environmentId);
    this.time = 0;
    this.running = false;
    this.status = 'ready';
    World.clear(this.engine.world, false);
    this.rocket = createRocket({ x: WORLD_WIDTH / 2, y: this.rocketY(this.params.initialHeight), scale: SCALE });
    this.ground = this.environment.ground ? createGround({ x: WORLD_WIDTH / 2, y: GROUND_Y, width: WORLD_WIDTH / SCALE, scale: SCALE }) : null;
    World.add(this.engine.world, [this.rocket, ...(this.ground ? [this.ground] : [])]);
  }

  rocketY(height) {
    return GROUND_Y - (height + ROCKET_HEIGHT / 2) * SCALE;
  }

  run() {
    this.running = true;
    if (this.status === 'ready' || this.status === 'paused') this.status = 'burning';
  }

  pause() {
    this.running = false;
    if (this.status !== 'landed') this.status = 'paused';
  }

  step(deltaSeconds) {
    if (!this.running) return;
    const acceleration = (this.time < this.params.burnDuration ? this.params.thrustAcceleration : 0) - this.environment.gravity;
    const currentVelocity = -this.rocket.velocity.y / SCALE;
    const nextVelocity = currentVelocity + acceleration * deltaSeconds;
    Body.setVelocity(this.rocket, { x: 0, y: -nextVelocity * SCALE });
    Engine.update(this.engine, deltaSeconds * 1000);
    this.time += deltaSeconds;
    this.status = this.time < this.params.burnDuration ? 'burning' : 'coasting';

    if (this.environment.ground && this.rocket.position.y >= this.rocketY(0)) {
      Body.setPosition(this.rocket, { x: this.rocket.position.x, y: this.rocketY(0) });
      Body.setVelocity(this.rocket, { x: 0, y: 0 });
      this.running = false;
      this.status = 'landed';
    }
  }

  snapshot() {
    const altitude = Math.max(0, (GROUND_Y - this.rocket.position.y) / SCALE - ROCKET_HEIGHT / 2);
    const velocity = -this.rocket.velocity.y / SCALE;
    const acceleration = (this.time < this.params.burnDuration ? this.params.thrustAcceleration : 0) - this.environment.gravity;
    const predictedAltitude = rocketPositionAtTime({
      initialPosition: this.params.initialHeight,
      initialVelocity: this.params.initialVelocity,
      thrustAcceleration: this.params.thrustAcceleration,
      gravity: this.environment.gravity,
      burnDuration: this.params.burnDuration,
      time: this.time,
    });
    return {
      time: this.time,
      altitude,
      velocity,
      acceleration,
      predictedAltitude,
      environment: this.environment,
      status: this.status,
      running: this.running,
      rocket: { x: this.rocket.position.x, y: this.rocket.position.y, angle: this.rocket.angle },
      groundY: GROUND_Y,
      scale: SCALE,
      worldWidth: WORLD_WIDTH,
      equation: {
        velocity: velocityAtTime(this.params.initialVelocity, acceleration, this.time),
        position: positionAtTime(this.params.initialHeight, this.params.initialVelocity, acceleration, this.time),
      },
    };
  }
}
