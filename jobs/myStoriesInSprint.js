'use strict';
const utils = require('../utils');

module.exports = {
  name: 'myStoriesInSprint',
  description: 'gives links to a user\'s stories in the sprint',
  type: 'responsive',
  dependencies: [
    'jira'
  ],
  userInfoNeeded: [
    'jiraUserId'
  ],
  hiddenFromHelp: false,
  phrases: [
    'what are my stories this sprint?',
    'stories this sprint'
  ],
  fn: function ({
                  bot,
                  message,
                  jira,
                  userInfo
                }) {
    utils.listIssuesInResult({
      jqlOrPromise: `assignee = ${userInfo.jiraUserId} AND status NOT IN (resolved, closed) AND sprint IN openSprints()`,
      bot: bot,
      message: message,
      jira: jira
    }).
    then(issueList => {
      bot.reply(message, `*Your stories in this sprint are*:\n${issueList}`);
    }).catch(err => {
      console.log(err.data);
    });
  }
};
