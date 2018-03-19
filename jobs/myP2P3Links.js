'use strict';
const utils = require('../utils');

module.exports = {
  name: 'myP2P3Links',
  description: 'gives links to a user\'s p2 or p3 bugs',
  type: 'responsive',
  dependencies: [
    'jira'
  ],
  userInfoNeeded: [
    'jiraUserId'
  ],
  hiddenFromHelp: false,
  phrases: [
    'p2 links',
    'p3 links',
    'give me p2 links',
    'give me p3 links'
  ],
  fn: function ({
                  bot,
                  message,
                  jira,
                  phraseMatch,
                  userInfo
                }) {
    let filterPath;
    let priorityString;
    if (phraseMatch.includes('p2')) {
      filterPath = 'filter/15209';
      priorityString = 'P2';
    } else {
      filterPath = 'filter/17400';
      priorityString = 'P3'
    }
    jira.get(filterPath).
    then(filterResults => {
      console.log(filterResults);
      utils.listIssuesInResult({
        jqlOrPromise: `assignee = ${userInfo.jiraUserId} AND ` +filterResults.data.jql,
        bot: bot,
        message: message,
        jira: jira
      }).
      then(issueList => {
        bot.reply(message, `*Your ${priorityString} bugs are*:\n${issueList}`);
      }).catch(err => {
        console.log('$$$$$$$$');
      });
    }).catch(err => {
      console.log(err);
      utils.somethingWentWrong(bot, message);
    });
  }
};
