'use strict';
const utils = require('../utils');

module.exports = {
 name: 'celebrate milestone',
 description: 'checks to see if we reached 100000 issues',
 type: 'time-based',
 hiddenFromHelp: true,
 dependencies: [
   'slackChannel',
   'jira'
 ],
 slackChannel: 'test',
 invokeEvery: '1 m',
 fn: async function({
                slackChannel,
                jira
 }) {
   let ids = [];
   let issuesReceived = 0;
   let totalNumIssues;
   do {
     const jiraQueryResult = await jira.makeJqlQuery({
       jql: 'created >=-1m',
       maxResults: 10,
       fields: [ ],
       startAt: issuesReceived
     });
     issuesReceived += jiraQueryResult.data.maxResults;
     totalNumIssues = jiraQueryResult.data.total;
     ids = utils.getIssueKeys(jiraQueryResult.data.issues);
   } while (issuesReceived < totalNumIssues);
   getMessage(ids, slackChannel);
  }
};

function getMessage(ids, slackChannel) {
  ids.forEach(id => {
    if (id.includes('100000')) {
      const project = id.slice(0,3);
      slackChannel(`Congratulations on the 100000th issue in the ${ project } Project! :tada: :party_parrot:`).then(console.log).catch(console.log);
    };
  });
};
