import './styles.scss';

import { Controller } from 'stimulus';

export default class extends Controller {
  connect() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.element.classList.add('pressed');
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.element.classList.remove('pressed');
      }
    });
  }
}
