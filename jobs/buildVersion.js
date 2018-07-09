'use strict';
const axios = require('axios');

module.exports = {
  name: 'buildVersion',
  description: 'which build production, staging, and demo-c are on',
  type: 'responsive',
  dependencies: [
  ],
  hiddenFromHelp: false,
  phrases: [
    'what build is production on',
    'what build does staging have',
    'which build is on demo-c right now',
    'which build do we have on production right now'
  ],
  fn: function ({
                  bot,
                  message
                }) {
    const messageText = message.text.toLowerCase();
    let server;
    if (messageText.includes('production') || messageText.includes("cad")) {
      server = 'cad';
    }
    else if (messageText.includes('staging')) {
      server = 'staging.dev';
    }
    else if (messageText.includes('demo-c')) {
      server = 'demo-c.dev';
    }
    else {
      bot.reply(message, 'I\'m sorry, I need to know which server you\'re interested in. Please ask again and specify `production`, `staging`, or `demo-c`');
      return
    }
    axios.get(`https://${ server }.onshape.com/api/build`).then(result => {
      const reply = `The build on ${ server }.onshape.com right now is \`${ result.data["Implementation-Version"].split('.').slice(0,2).join('.') }\``
      bot.reply(message, reply);
    }).catch(console.log);
  }
};
