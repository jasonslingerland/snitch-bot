'use strict';

module.exports = {
  name: 'help',
  description: 'lists things I can do',
  type: 'responsive',
  dependencies: [
    'responsiveJobs'
  ],
  hiddenFromHelp: true, //TODO: add this to docs
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
    for (const job of responsiveJobs) {
      if (!job.hiddenFromHelp) {
        let phrasesString = '';
        for (const phrase of job.phrases.slice(0, 5)) {
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
