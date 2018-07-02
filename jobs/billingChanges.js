'use strict';
const utils = require('../utils');

module.exports = {
  name: 'billingChanges',
  description: 'checks for billing changes',
  type: 'time-based',
  dependencies: [
    'slackChannel',
    'jira'
  ],
  slackChannel: 'test',
  invokeEvery: '2 h',
  disabled: true,
  fn: function ({
                  slackChannel,
                  jira
  }) {
    jira.makeJqlQuery({
      jql: 'type = story and component = billing and createdDate >= -7d',
      fields: [ 'issuetype' ]
    }).then(result => {
      const issueKeys = utils.getIssueKeys(result.data.issues);
      let message = 'Oh boy! New billing changes!!\n';
      for (const key of issueKeys) {
        message += `>${utils.createIssueLink(key)}\n`;
      }
      if (!issueKeys[0]) {
        console.log('no new billing changes');
      } else {
        slackChannel(message);
      }
    }).catch(console.log);
  }
};
