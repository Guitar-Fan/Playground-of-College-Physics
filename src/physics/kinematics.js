export function velocityAtTime(initialVelocity, acceleration, time) {
  return initialVelocity + acceleration * time;
}

export function positionAtTime(initialPosition, initialVelocity, acceleration, time) {
  return initialPosition + initialVelocity * time + 0.5 * acceleration * time ** 2;
}

export function velocityAtPosition(initialVelocity, acceleration, initialPosition, position) {
  const squaredVelocity = initialVelocity ** 2 + 2 * acceleration * (position - initialPosition);
  return squaredVelocity < 0 ? null : Math.sqrt(squaredVelocity);
}

export function rocketPositionAtTime({ initialPosition, initialVelocity, thrustAcceleration, gravity, burnDuration, time }) {
  const burnTime = Math.min(time, burnDuration);
  const coastTime = Math.max(0, time - burnDuration);
  const burnAcceleration = thrustAcceleration - gravity;
  const positionAtBurn = positionAtTime(initialPosition, initialVelocity, burnAcceleration, burnTime);
  const velocityAtBurn = velocityAtTime(initialVelocity, burnAcceleration, burnTime);
  return positionAtTime(positionAtBurn, velocityAtBurn, -gravity, coastTime);
}
