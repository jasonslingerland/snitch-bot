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
    'stories this sprint',
    'what are my stories'
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
      const reply = {
        text: `*Your stories in this sprint are*:\n`,
        attachments: [ {
          color: 'good',
          text: `${issueList}`
        } ]
      };
      bot.reply(message, reply);
    }).catch(err => {
      console.log(err.data);
    });
  }
};
