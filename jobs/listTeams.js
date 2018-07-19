'use strict';
const utils = require('../utils');

module.exports = {
  name: 'listTeams',
  description: 'lists all the jira team names that the bot can automatically recognize',
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
