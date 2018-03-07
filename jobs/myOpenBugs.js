'use strict';

module.exports = {
  name: 'myOpenBugs',
  description: 'lists number of open bugs that a user has',
  type: 'responsive',
  dependencies: [
    'jira',
    'userInfo'
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
      const count = result.data.total;
      let plural = '';
      if (count > 1) {
        plural = 's'
      }
      bot.reply(message, `<@${message.user}> you have \`${count}\` open bug${plural}.`);
    });
  }
};
