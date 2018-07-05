'use strict';
const utils = require('../utils');

module.exports = {
  name: 'releaseProcess',
  description: 'links to the confluence article about the release process',
  type: 'responsive',
  dependencies: [
  ],
  hiddenFromHelp: false,
  phrases: [
    'list teams',
    'list the names of the teams you know',
    'what team names do you know'
  ],
  fn: function ({
                  bot,
                  message
                }) {
    let reply = 'Here are the team names I know:\n';
    utils.teamNames.forEach(name => {
      reply += `\`${ name }\`\n`
    })
    bot.reply(message, reply);
  }
};
