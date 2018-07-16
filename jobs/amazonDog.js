'use strict';

module.exports = {
  name: 'amazonDog',
  description: 'gives you a random amazon dog',
  type: 'responsive',
  dependencies: [
  ],
  hiddenFromHelp: false,
  phrases: [
    'amazon dog',
    'give me a dog',
    'amazon puppy'
  ],
  fn: function ({
                  bot,
                  message
                }) {
    bot.reply(message, `https://images-na.ssl-images-amazon.com/images/G/01/error/${(Math.floor(Math.random() * 43) + 1)}._TTD_.jpg`);
  }
};