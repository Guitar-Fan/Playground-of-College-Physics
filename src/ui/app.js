import { getEnvironments } from '../environments/index.js';

const DEFAULTS = {
  initialVelocity: 0,
  thrustAcceleration: 22,
  burnDuration: 4,
  initialHeight: 0,
};

export function createApp(root, experiment) {
  root.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <div>
          <p class="eyebrow">Kinematics Lab / 01</p>
          <h1>Rocket launch lab</h1>
          <p class="lede">Tune the launch, compare worlds, and watch the equations become motion.</p>
        </div>
        <div class="status-chip" id="status-chip" data-status="ready"><span class="status-dot"></span><span id="status-label" aria-live="polite">Ready</span></div>
      </header>
      <section class="workspace">
        <div class="stage-panel">
          <div class="stage-toolbar"><span>LIVE SIMULATION</span><span id="environment-label">Earth / 9.81 m/s²</span></div>
          <div class="canvas-wrap" id="canvas-wrap"></div>
          <div class="stage-footer"><span>Height <strong id="height-readout">0.0 m</strong></span><span>Velocity <strong id="velocity-readout">0.0 m/s</strong></span><span>Time <strong id="time-readout">0.0 s</strong></span></div>
        </div>
        <aside class="control-panel">
          <div class="panel-heading"><span class="section-kicker">MISSION CONTROL</span><h2>Launch parameters</h2></div>
          <label class="field">Environment<select id="environment-input"></select></label>
          <div class="field-grid">
            <label class="field">Initial height <span class="unit">m</span><input id="height-input" type="number" min="0" max="1000" step="1" value="0"></label>
            <label class="field">Initial velocity <span class="unit">m/s</span><input id="velocity-input" type="number" min="-100" max="100" step="1" value="0"></label>
            <label class="field">Thrust acceleration <span class="unit">m/s²</span><input id="thrust-input" type="number" min="0" max="100" step="0.5" value="22"></label>
            <label class="field">Burn duration <span class="unit">s</span><input id="burn-input" type="number" min="0" max="30" step="0.5" value="4"></label>
          </div>
          <div class="actions"><button class="button button-primary" id="run-button">Launch</button><button class="button button-secondary" id="pause-button">Pause</button><button class="button button-quiet" id="reset-button">Reset</button></div>
          <div class="readout-block"><div class="readout-title">Flight data</div><div class="metric-row"><span>Acceleration</span><strong id="acceleration-readout">12.2 m/s²</strong></div><div class="metric-row"><span>Predicted altitude</span><strong id="prediction-readout">0.0 m</strong></div><div class="metric-row"><span>Phase</span><strong id="phase-readout">Ready</strong></div></div>
          <div class="equation-block"><div class="readout-title">Active model</div><p>v = v₀ + at</p><p>x = x₀ + v₀t + ½at²</p><p class="equation-note">Thrust acts during burn; gravity acts continuously.</p></div>
        </aside>
      </section>
    </div>
  `;

  const elements = {
    canvas: root.querySelector('#canvas-wrap'),
    environment: root.querySelector('#environment-input'),
    height: root.querySelector('#height-input'),
    velocity: root.querySelector('#velocity-input'),
    thrust: root.querySelector('#thrust-input'),
    burn: root.querySelector('#burn-input'),
    run: root.querySelector('#run-button'),
    pause: root.querySelector('#pause-button'),
    reset: root.querySelector('#reset-button'),
    statusChip: root.querySelector('#status-chip'),
    status: root.querySelector('#status-label'),
    environmentLabel: root.querySelector('#environment-label'),
    heightReadout: root.querySelector('#height-readout'),
    velocityReadout: root.querySelector('#velocity-readout'),
    timeReadout: root.querySelector('#time-readout'),
    accelerationReadout: root.querySelector('#acceleration-readout'),
    predictionReadout: root.querySelector('#prediction-readout'),
    phaseReadout: root.querySelector('#phase-readout'),
  };

  getEnvironments().forEach((environment) => {
    elements.environment.add(new Option(environment.name, environment.id));
  });

  const readParams = () => ({
    initialHeight: numberValue(elements.height, DEFAULTS.initialHeight),
    initialVelocity: numberValue(elements.velocity, DEFAULTS.initialVelocity),
    thrustAcceleration: numberValue(elements.thrust, DEFAULTS.thrustAcceleration),
    burnDuration: numberValue(elements.burn, DEFAULTS.burnDuration),
  });

  const resetFromControls = () => experiment.reset(readParams(), elements.environment.value);
  elements.run.addEventListener('click', () => experiment.run());
  elements.pause.addEventListener('click', () => experiment.pause());
  elements.reset.addEventListener('click', resetFromControls);
  elements.environment.addEventListener('change', resetFromControls);
  [elements.height, elements.velocity, elements.thrust, elements.burn].forEach((input) => input.addEventListener('change', resetFromControls));

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  elements.canvas.append(canvas);
  const stars = Array.from({ length: 80 }, (_, index) => ({
    x: (index * 83) % 1000,
    y: (index * 47) % 590,
    size: 1 + (index % 3),
  }));
  let lastFrame = performance.now();

  const resizeCanvas = () => {
    canvas.width = elements.canvas.clientWidth || 720;
    canvas.height = 520;
  };
  const frame = (now) => {
    experiment.step(Math.min((now - lastFrame) / 1000, 0.05));
    lastFrame = now;
    const snapshot = experiment.snapshot();
    drawScene(context, canvas, snapshot, stars);
    updateReadouts(snapshot, elements);
    requestAnimationFrame(frame);
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  requestAnimationFrame(frame);
}

function numberValue(input, fallback) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function updateReadouts(snapshot, elements) {
  const environmentName = snapshot.environment.name;
  elements.status.textContent = capitalize(snapshot.status);
  elements.statusChip.dataset.status = snapshot.status;
  elements.environmentLabel.textContent = `${environmentName} / ${snapshot.environment.gravity.toFixed(2)} m/s²`;
  elements.heightReadout.textContent = `${snapshot.altitude.toFixed(1)} m`;
  elements.velocityReadout.textContent = `${snapshot.velocity.toFixed(1)} m/s`;
  elements.timeReadout.textContent = `${snapshot.time.toFixed(1)} s`;
  elements.accelerationReadout.textContent = `${snapshot.acceleration.toFixed(1)} m/s²`;
  elements.predictionReadout.textContent = `${Math.max(0, snapshot.predictedAltitude).toFixed(1)} m`;
  elements.phaseReadout.textContent = capitalize(snapshot.status);
}

function drawScene(context, canvas, snapshot, stars) {
  const { theme } = snapshot.environment;
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, theme.skyTop);
  gradient.addColorStop(1, theme.skyBottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (theme.stars) {
    context.fillStyle = 'rgba(255, 255, 255, 0.86)';
    stars.forEach((star) => {
      context.beginPath();
      context.arc((star.x / 1000) * canvas.width, star.y, star.size, 0, Math.PI * 2);
      context.fill();
    });
  }

  const groundY = snapshot.groundY / snapshot.worldWidth * canvas.width;
  const pixelsPerMeter = snapshot.scale * (canvas.width / snapshot.worldWidth);
  if (snapshot.environment.ground) {
    context.fillStyle = theme.ground;
    context.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    context.fillStyle = 'rgba(255, 255, 255, 0.35)';
    context.fillRect(0, groundY, canvas.width, 2);
  }

  const rocketX = (snapshot.rocket.x / snapshot.worldWidth) * canvas.width;
  const rocketY = groundY - (snapshot.altitude + 1.1) * pixelsPerMeter;
  context.save();
  context.translate(rocketX, rocketY);
  context.fillStyle = theme.accent;
  context.beginPath();
  context.ellipse(0, -pixelsPerMeter * 0.7, pixelsPerMeter * 0.31, pixelsPerMeter * 0.45, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f7f4ed';
  roundedRect(context, -pixelsPerMeter * 0.27, pixelsPerMeter * 0.28 - pixelsPerMeter * 0.575, pixelsPerMeter * 0.54, pixelsPerMeter * 1.15, 8);
  context.fillStyle = '#17324d';
  context.beginPath();
  context.arc(0, pixelsPerMeter * 0.18, pixelsPerMeter * 0.1, 0, Math.PI * 2);
  context.fill();
  if (snapshot.status === 'burning') {
    triangle(context, '#ffc857', -pixelsPerMeter * 0.15, pixelsPerMeter * 0.88, pixelsPerMeter * 0.15, pixelsPerMeter * 0.88, 0, pixelsPerMeter * 1.5 + Math.sin(snapshot.time * 18) * 4);
    triangle(context, '#ef6f45', -pixelsPerMeter * 0.08, pixelsPerMeter * 0.88, pixelsPerMeter * 0.08, pixelsPerMeter * 0.88, 0, pixelsPerMeter * 1.28);
  }
  context.restore();

  context.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(26, groundY - snapshot.altitude * pixelsPerMeter);
  context.lineTo(26, groundY);
  context.stroke();
  context.fillStyle = 'rgba(255, 255, 255, 0.86)';
  context.font = '12px "DM Sans", sans-serif';
  context.fillText(`${snapshot.altitude.toFixed(1)} m`, 38, groundY - snapshot.altitude * pixelsPerMeter - 8);
  context.fillStyle = 'rgba(255, 255, 255, 0.6)';
  context.fillText('launch altitude', 38, groundY - 10);
}

function triangle(context, color, x1, y1, x2, y2, x3, y3) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.lineTo(x3, y3);
  context.closePath();
  context.fill();
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
