if (!String.prototype.padStart) {
  String.prototype.padStart = function (targetLength, padString) {
    const str = String(this);
    const pad = padString || ' ';
    if (str.length >= targetLength) return str;
    const needed = targetLength - str.length;
    return pad.repeat(Math.ceil(needed / pad.length)).slice(0, needed) + str;
  };
}

const { Game } = require('./src/main.js');

const game = new Game();
game.start();
