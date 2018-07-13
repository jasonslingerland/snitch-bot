'use strict';
const utils = require('../utils');

module.exports = {
 name: 'resolved snitch',
 description: 'checks to see if anyone resolved a story',
 type: 'time-based',
 dependencies: [
   'slackChannel',
   'jira',
   'mongo'
 ],
 slackChannel: 'test',
 invokeEvery: '5 m',
 fn: async function({
                slackChannel,
                jira,
                mongo
 }) {
   const collection = mongo.collection('sentResolvedNotifications');
   let fixVersionChangedIds = [];
   let issuesReceived = 0;
   let totalNumIssues;
   const issueSummaries = {};
   do {
     const jiraQueryResult = await jira.makeJqlQuery({
       jql: `status CHANGED DURING (-30m, now()) AND issuetype in (Epic, Improvement, Story, "Technical task")`,
       maxResults: 250,
       fields: [ 'summary' ],
       startAt: issuesReceived
     });
     issuesReceived += jiraQueryResult.data.maxResults;
     totalNumIssues = jiraQueryResult.data.total;
     fixVersionChangedIds = fixVersionChangedIds.concat(utils.getIssueKeys(jiraQueryResult.data.issues));
     jiraQueryResult.data.issues.forEach(issue => {
       issueSummaries[issue.key] = issue.fields.summary;
     });
   } while (issuesReceived < totalNumIssues);
   getUnwantedChanges(fixVersionChangedIds, jira, collection, issueSummaries).
     then(result => {
       const changes = result.filter(change => {return change !== ''});
       const slackMessage = buildSlackMessage(changes);
       console.log(slackMessage);
       if (slackMessage !== '') {
         slackChannel(slackMessage).then(console.log).catch(console.log);
       }
     }).catch(console.log);
 }
};

function getUnwantedChanges(fixVersionChangedIds, jira, collection, issueSummaries) {
  const promises = [];
  for (const fixVersionChangeId of fixVersionChangedIds) {
    promises.push(getUnwantedChangeInIssue(fixVersionChangeId, issueSummaries[fixVersionChangeId], jira, collection));
  }
  return Promise.all(promises);
}

async function getUnwantedChangeInIssue(fixVersionChangedId, summary, jira, collection) {
  const response = await jira.get(`issue/${fixVersionChangedId}/changelog`);
  // reversing because we want the most recent change
  for (const changeObject of response.data.values.reverse()) {
    for (const change of changeObject.items.reverse()) {
      if (change.fieldId === 'status') {
        if (change.toString !== 'Resolved' && change.toString !== 'In QA Testing') {
          return '';
        } else {
          const changeKey = {
            author: changeObject.author.name,
            timestamp: changeObject.created
          };
          const mongoResult = await collection.findOne(changeKey);
          if (mongoResult === null) {
            await collection.insertOne(changeKey);
            return {
              author: changeObject.author.name,
              changeString: buildChangeString(fixVersionChangedId,
                                              summary,
                                              change.fromString,
                                              change.toString)
            };
          } else {
            return '';
          }
        }
      }
    }
  }
  return '';
}

function buildChangeString(fixVersionChangedId, summary, fromString, toString) {
  const beginning = utils.createIssueLink(fixVersionChangedId);
  const end = ` status CHANGED from ${fromString} to ${toString}` + '\n>  ' + summary;
  return beginning + end;
}

function buildSlackMessage(changes) {
  console.log('building slack message');
  const consolidatedChanges = {};
  for (const change of changes) {
    const entry = consolidatedChanges[change.author];
    if (entry) {
      entry.push(change.changeString);
    } else {
      consolidatedChanges[change.author] = [ change.changeString ];
    }
  }
  let message = '';
  for (const key in consolidatedChanges) {
    message += `*${key}*\n`;
    for (const item of consolidatedChanges[key]) {
      message += `>${item}\n`;
    }
  }
  return message;
}
