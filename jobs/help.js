'use strict';

module.exports = {
  name: 'help',
  description: 'lists things I can do',
  type: 'responsive',
  dependencies: [
    'responsiveJobs'
  ],
  hiddenFromHelp: false, //TODO: add this to docs
  phrases: [
    'help',
    'help me',
    '?',
    'what can you do?'
  ],
  fn: function ({
                  responsiveJobs,
                  bot,
                  message
  }) {
    let messageText = 'I\'m here to help! Here\'s what I can do:\n';
    for (let job of responsiveJobs) {
      if (!job.hiddenFromHelp) {
        let phrasesString = '';
        for (let phrase of job.phrases) {
          phrasesString += " `" + phrase + "` ";
        }
        messageText += `*${job.name}*\n`;
        messageText += `> Description: \`\`\`${job.description}\`\`\`\n`;
        messageText += `> Trigger this job with phrases such as: ${phrasesString}\n`;
      }
    }
    bot.reply(message, messageText);
  }
};
