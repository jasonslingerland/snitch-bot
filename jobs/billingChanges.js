'use strict';
const utils = require('../utils');

module.exports = {
  name: 'billingChanges',
  description: 'checks for billing changes',
  slackChannel: 'test',
  invokeEvery: '10 s',
  fn: function (postSlackMessage, jira) {
    jira.makeJqlQuery({
      jql: 'type = story and component = billing and createdDate >= -7d',
      fields: ['issuetype']
    }).then(result => {
      const issueKeys = utils.getIssueKeys(result.data.issues);
      let message = 'Oh boy! New billing changes!!\n';
      for (const key of issueKeys) {
        message += `>${utils.createIssueLink(key)}\n`;
      }
      if (!issueKeys[0]) {
        console.log('no new billing changes');
      } else {
        postSlackMessage(message);
      }
    }).catch(console.log);
  }
};

