'use strict';

module.exports = {
  name: 'myOpenBugs',
  description: 'lists number of open bugs that a user has',
  type: 'responsive',
  dependencies: [
    'jira'
  ],
  userInfoNeeded: [
    'jiraUserId'
  ],
  hiddenFromHelp: true,
  phrases: [
    'open bugs',
    'how many open bugs do i have',
    'open bug count'
  ],
  fn: function ({
                  bot,
                  message,
                  jira,
                  userInfo
                }) {
    jira.makeJqlQuery({
      jql: `assignee = ${userInfo.jiraUserId} AND status = open AND type = bug`,
      fields: ['issuetype'],
      maxResults: 1
    }).then(result => {
      if (result.data.warningMessages) {
        bot.reply(message, `<@${message.user}> sorry, something went wrong. `
          + `Received error message from jira:\n \`${result.data.warningMessages.join('\`\n')}\``);
      } else {
        const count = result.data.total;
        let plural = '';
        if (count > 1) {
          plural = 's'
        }
        bot.reply(message, `<@${message.user}> you have \`${count}\` open bug${plural}.`);
      }
    }).catch(response => {
      bot.reply(message, `<@${message.user}> sorry, something went wrong.`)
    });
  }
};
