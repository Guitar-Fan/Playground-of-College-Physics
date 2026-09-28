import './ui/styles.css';
import { RocketExperiment, DEFAULT_PARAMS } from './physics/rocketExperiment.js';
import { createApp } from './ui/app.js';

const experiment = new RocketExperiment(DEFAULT_PARAMS, 'earth');
createApp(document.querySelector('#app'), experiment);
