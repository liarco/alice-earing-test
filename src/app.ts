import './styles/app.scss';

import SpacebarDebuggerController from './controllers/SpacebarDebuggerController';
import {HearingTest, TestMode} from './HearingTest';

const StimulusBridge = require('@symfony/stimulus-bridge');

export const app = StimulusBridge.startStimulusApp(require.context(
  '@symfony/stimulus-bridge/lazy-controller-loader!./controllers',
  true,
  /\.(j|t)sx?$/
));

// Register Stimulus controllers
app.register('spacebar-debugger', SpacebarDebuggerController);

const hearingTest = new HearingTest();

document.getElementById('test-toggler')!.addEventListener('click', function (e) {
  this.classList.toggle('running');

  if (this.classList.contains('running')) {
    this.querySelector('span')!.textContent = 'Stop';
    hearingTest.start(
      (document.getElementById('test-mode')! as HTMLSelectElement).value as TestMode,
      parseInt((document.getElementById('tests-number')! as HTMLInputElement).value),
    );
  } else {
    this.querySelector('span')!.textContent = 'New';
    hearingTest.stop();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Enter') {
    document.getElementById('test-toggler')!.click();
  }
});
