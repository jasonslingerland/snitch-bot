'use strict';
const axios = require('axios');

module.exports = {
  name: 'cat facts',
  description: 'give me a cat fact',
  type: 'responsive',
  dependencies: [
  ],
  hiddenFromHelp: true,
  phrases: [
    'me need cat facts',
    'cat facts',
    'tell me a cat fact'
  ],
  fn: function ({
                  bot,
                  message
                }) {
    axios.get('https://catfact.ninja/fact').then(result => {
      bot.reply(message, result.data.fact);
    }).catch(console.log);
  }
};
