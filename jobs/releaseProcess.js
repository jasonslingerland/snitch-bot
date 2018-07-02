'use strict';

module.exports = {
  name: 'hello',
  description: 'say hello',
  type: 'responsive',
  dependencies: [
  ],
  hiddenFromHelp: false,
  phrases: [
    'what\'s the release process',
    'give me the article for the release process'
  ],
  fn: function ({
                  bot,
                  message
                }) {
    bot.reply(message, 'You can consult the Confluence article <https://belmonttechinc.atlassian.net/wiki/spaces/DEV/pages/10387559/Software+Release+Process|here> for information about the release process');
  }
};
