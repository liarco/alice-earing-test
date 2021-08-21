const SOUNDS_DURATION = 3000;
const MIN_DELAY_BETWEEN_SOUNDS = 1000;
const MAX_DELAY_BETWEEN_SOUNDS = 10000;
const FREQUENCIES: Frequency[] = [
  {hertz: 440, age: '0+'},
  {hertz: 8000, age: '0+'},
  {hertz: 12000, age: '< 50'},
  {hertz: 15000, age: '< 40'},
  {hertz: 16000, age: '< 30'},
  {hertz: 17000, age: '< 24'},
  {hertz: 17400, age: '< 18'},
];
const DEFAULT_MAX_TESTS = FREQUENCIES.length;
const INITIAL_ROUND_STATS: RoundStats = {
  highestGuessedFrequency: null,
  rightGuesses: 0,
  retriggered: 0,
  badGuesses: 0,
  rightGuessesByFrequency: {},
  playedFrequencies: {},
};

export type TestMode = 'TO_TOP'|'TO_BOTTOM'|'RANDOM';
interface Frequency {
  hertz: number;
  age: string;
}
interface RoundStats {
  highestGuessedFrequency: Frequency|null;
  rightGuesses: number;
  retriggered: number;
  badGuesses: number;
  rightGuessesByFrequency: {
    [hertz: number]: {
      frequency: Frequency;
      counter: number;
    };
  };
  playedFrequencies: {
    [hertz: number]: {
      frequency: Frequency;
      counter: number;
    };
  };
};

class Sound {
  private context: AudioContext;
  private oscillator: OscillatorNode;
  private gain: GainNode;
  private playing = false;

  public constructor(
    private frequency: Frequency,
    private hearingTest: HearingTest,
  ) {
    this.context = hearingTest.audioContext;
    this.gain = this.context.createGain();
    this.gain.connect(this.context.destination);
    this.gain.gain.value = 0;

    this.oscillator = this.context.createOscillator();
    this.oscillator.connect(this.gain);
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = this.frequency.hertz;
  }

  public play()
  {
    console.debug(`Now playing: ${this.frequency.hertz} (${this.frequency.age})`);

    this.oscillator.start();
    this.gain.gain.setTargetAtTime(1, this.context.currentTime, 0.015);
    this.playing = true;
    this.hearingTest.currentFrequency = this.frequency;

    setTimeout(() => {
      this.stop();
    }, SOUNDS_DURATION);
  }

  public stop()
  {
    console.debug('Stopping sound...');

    if (this.playing) {
      this.playing = false;
      this.hearingTest.currentFrequency = null;

      this.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.015);
      
      setTimeout(() => {
        this.oscillator.stop();
      }, 50);
    }
  }
}

function getRandomInt(min: number, max: number)
{
  min = Math.ceil(min); // Inclusive
  max = Math.floor(max); // Exclusive
  
  return Math.floor(Math.random() * (max - min) + min);
}

function resetFocus()
{
  if (document.activeElement) {
    (document.activeElement as HTMLElement).blur();
  }
}

export class HearingTest {
  public readonly audioContext = new window.AudioContext();
  public currentFrequency: Frequency|null = null;
  private currentSound: Sound|null = null;
  private active = false;
  private frequencies: Frequency[] = []; 
  private alreadyGuessed = false;
  private currentRoundStats: RoundStats = INITIAL_ROUND_STATS;

  public constructor()
  {
    document.addEventListener('keydown', (e) => this.onKeyPressed(e));
  }

  public start(mode: TestMode, maxTests: number = DEFAULT_MAX_TESTS)
  {
    if (this.active) {
      this.stop();
    }

    resetFocus();

    console.debug(`Starting a new round in "${mode}" mode and with ${maxTests} tests (maximum)...`);

    // Initialize round...
    this.buildFrequencies(mode, maxTests);
    this.currentRoundStats = INITIAL_ROUND_STATS;
    this.active = true;
    this.loop();
  }

  public stop()
  {
    if (!this.active) {
      return;
    }

    console.debug('Stopping current round...')

    this.active = false;
    this.currentSound?.stop();

    console.log('RESULTS:', JSON.stringify(this.currentRoundStats, null, 2));
  }

  public loop()
  {
    if (!this.active) {
      return;
    }

    if (this.frequencies.length < 1) {
      // Round has ended, force stopping from UI...
      document.getElementById('test-toggler')!.click();
      
      return;
    }

    setTimeout(() => {
      if (!this.active) {
        return;
      }

      const nextFrequency = this.frequencies.pop()!;

      this.playSound(nextFrequency);

      // Update stats...
      if (this.currentRoundStats.playedFrequencies[nextFrequency.hertz] === undefined) {
        this.currentRoundStats.playedFrequencies[nextFrequency.hertz] = {
          frequency: nextFrequency,
          counter: 0,
        };
      }
      this.currentRoundStats.playedFrequencies[nextFrequency.hertz].counter++;
      
      setTimeout(() => this.loop(), SOUNDS_DURATION);
    }, getRandomInt(MIN_DELAY_BETWEEN_SOUNDS, MAX_DELAY_BETWEEN_SOUNDS + 1));
  }

  private onKeyPressed(e: KeyboardEvent)
  {
      if (!this.active || e.code !== 'Space') {
        return;
      }

      if (this.currentFrequency !== null) {
        if (!this.alreadyGuessed) {
          this.alreadyGuessed = true;

          // Update stats...
          this.currentRoundStats.rightGuesses++;

          if (this.currentRoundStats.highestGuessedFrequency?.hertz ?? 0 < this.currentFrequency.hertz) {
            this.currentRoundStats.highestGuessedFrequency = this.currentFrequency;
          }
      
          if (this.currentRoundStats.rightGuessesByFrequency[this.currentFrequency.hertz] === undefined) {
            this.currentRoundStats.rightGuessesByFrequency[this.currentFrequency.hertz] = {
              frequency: this.currentFrequency,
              counter: 0,
            };
          }
          this.currentRoundStats.rightGuessesByFrequency[this.currentFrequency.hertz].counter++;

          console.info('You got it! :D');
        } else {
          // Update stats...
          this.currentRoundStats.retriggered++;

          console.warn('Uhm... this is a retrigger... :/');
        }
      } else {
        // Update stats...
        this.currentRoundStats.badGuesses++;

        console.error('BAD! Nothing is playing!');
      }
  }

  private playSound(frequency: Frequency)
  {
    resetFocus();

    this.currentSound?.stop();
    this.currentSound = new Sound(frequency, this);
    
    this.alreadyGuessed = false;
    this.currentSound.play();
  }

  private buildFrequencies(mode: string, maxTests: number)
  {
    switch (mode) {
      case 'TO_TOP':
        this.frequencies = FREQUENCIES.slice(0, maxTests).reverse();

        break;
      case 'TO_BOTTOM':
        this.frequencies = FREQUENCIES.slice(FREQUENCIES.length - maxTests, FREQUENCIES.length);

        break;
      case 'RANDOM':
        this.frequencies = [];

        while (this.frequencies.length < maxTests) {
          this.frequencies.push(FREQUENCIES[getRandomInt(0, FREQUENCIES.length)])
        }

        break;
    }
  }
}