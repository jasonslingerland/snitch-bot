'use strict';
const utils = require('../utils');

module.exports = {
  name: 'closeBug',
  description: 'gives links to issues that need to be fixed for a particular bug to ship',
  type: 'responsive',
  dependencies: [
    'jira'
  ],
  userInfoNeeded: [
    'jiraUserId'
  ],
  hiddenFromHelp: false,
  phrases: [
    'BEL-12345',
    'what should be closed for BEL-12345 to ship',
    'what does BEL-12345 depend on',
    'what issues are there for BEL-12345',
    'what bugs do we have for BEL-12345'
  ],
  fn: function ({
                  bot,
                  message,
                  jira,
                  userInfo
                }) {
    let messageText = message.text.toLowerCase();
    const bel = messageText.match(/\d+/)[0];
    utils.listIssuesInResult({
      jqlOrPromise: `issue in linkedissues(BEL-${ bel }) AND status in (Open, "In Progress") AND fixVersion is not EMPTY AND type = bug`,
      bot: bot,
      message: message,
      jira: jira
    }).
    then(issueList => {
      bot.reply(message, `*To ship BEL-${ bel }, we need to fix*:\n${issueList}`);
    }).catch(err => {
      console.log(err.data);
    });
  }
};
