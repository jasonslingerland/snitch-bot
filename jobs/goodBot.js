'use strict';

module.exports = {
  name: 'goodBot',
  description: 'respond to being called a good boy',
  type: 'responsive',
  dependencies: [
    'responsiveJobs'
  ],
  hiddenFromHelp: true,
  phrases: [
    'good work',
    'good bot',
    'good work son',
    'good job son',
    'who\'s a good boy?'
  ],
  fn: function ({
                  bot,
                  message
                }) {
    if (message.text.includes('son')) {
      bot.reply(message, 'Thanks dad!');
    } else {
      bot.reply(message, ':blush: thanks!');
    }
  }
};
