'use strict';
const utils = require('../utils');

module.exports = {
  name: 'hello',
  description: 'say hello',
  type: 'responsive',
  dependencies: [
    'jira'
  ],
  hiddenFromHelp: false,
  phrases: [
    'fix version change by user jiraID rel-1.69'
  ],
  fn: async function ({
                  bot,
                  message,
                  jira
                }) {
    const splitMessage = message.text.split(' ');
    const jiraId = splitMessage[splitMessage.length - 2];
    let release = splitMessage[splitMessage.length - 1];
    if (!release.includes('rel-')) {
      release = 'rel-' + release;
    }
    const jql = `fixVersion changed BY ${jiraId} TO ${release} or fixVersion changed BY ${jiraId} FROM ${release}`;
    const issuesString = await utils.listIssuesInResult({
      bot: bot,
      message: message,
      jira: jira,
      jqlOrPromise: jql
    });
    bot.reply(message, '*Issues found:*\n' + issuesString);
  }
};
