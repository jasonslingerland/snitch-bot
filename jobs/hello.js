'use strict';

module.exports = {
  name: 'hello',
  description: 'say hello',
  type: 'responsive',
  dependencies: [
    'responsiveJobs'
  ],
  hiddenFromHelp: true,
  phrases: [
    'hello',
    'howdy',
    'hi',
    'what\'s up?',
    'hey',
    'hiya'
  ],
  fn: function ({
                  bot,
                  message
                }) {
    bot.reply(message, 'Howdy! :hand::face_with_cowboy_hat:');
  }
};
