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
    'what bugs do we have for BEL-12345',
    'AND-12345',
    'what should be closed for AND-12345 to ship',
    'what does AND-12345 depend on',
    'what issues are there for AND-12345',
    'what bugs do we have for AND-12345',
    'IOS-12345',
    'what should be closed for IOS-12345 to ship',
    'what does IOS-12345 depend on',
    'what issues are there for IOS-12345',
    'what bugs do we have for IOS-12345',
    'TRN-12345',
    'what should be closed for TRN-12345 to ship',
    'what does TRN-12345 depend on',
    'what issues are there for TRN-12345',
    'what bugs do we have for TRN-12345'
  ],
  fn: function ({
                  bot,
                  message,
                  jira
                }) {
    const messageText = message.text.toLowerCase();
    const issueNumber = messageText.match(/\d+/)[0];
    const project = messageText.substr(messageText.indexOf(issueNumber)-4,4);
    utils.listIssuesInResult({
      jqlOrPromise: `issue in linkedissues(${ project }${ issueNumber }) AND status in (Open, "In Progress") AND fixVersion is not EMPTY AND type = bug`,
      bot: bot,
      message: message,
      jira: jira
    }).
    then(issueList => {
      bot.reply(message, `*To ship ${ project }${ issueNumber }, we need to fix*:\n${issueList}`);
    }).catch(err => {
      console.log(err.data);
    });
  }
};
