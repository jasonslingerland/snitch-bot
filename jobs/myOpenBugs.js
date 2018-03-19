'use strict';
const utils = require('../utils');

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
  hiddenFromHelp: false,
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
    utils.getIssueCount({
      jqlOrPromise: `assignee = ${userInfo.jiraUserId} AND status IN (Open, Reopened, "In Progress") AND type = bug`,
      bot: bot,
      message: message,
      jira: jira
    }).
    then(count => {
      let plural = '';
      if (count > 1) {
        plural = 's'
      }
      bot.reply(message, `<@${message.user}> you have \`${count}\` open bug${plural}.`);
    }).catch(response => {
      console.log(response);
    });
  }
};
