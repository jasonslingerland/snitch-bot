'use strict';
const utils = require('../utils');

module.exports = {
 name: 'resolved snitch',
 description: 'checks if anyone has ',
 type: 'time-based',
 dependencies: [
   'slackChannel',
   'jira',
   'mongo'
 ],
 slackChannel: 'test',
 invokeEvery: '1 m',
 fn: async function({
                slackChannel,
                jira,
                mongo
 }) {
   const collection = mongo.collection('sentResolvedNotifications');
   let fixVersionChangedIds = [];
   let issuesReceived = 0;
   let totalNumIssues;
   let issueSummaries = {};
   do {
     const jiraQueryResult = await jira.makeJqlQuery({
       jql: 'status CHANGED DURING (-30m, now()) AND issuetype in (Epic, Improvement, Story, "Technical task") AND status in (Resolved, "In QA Testing")',
       maxResults: 250,
       fields: ['summary'],
       startAt: issuesReceived
     });
     issuesReceived += jiraQueryResult.data.maxResults;
     totalNumIssues = jiraQueryResult.data.total;
     fixVersionChangedIds = fixVersionChangedIds.concat(utils.getIssueKeys(jiraQueryResult.data.issues));
     jiraQueryResult.data.issues.forEach(issue => {
       issueSummaries[issue.key] = issue.fields.summary;
     });
   } while (issuesReceived < totalNumIssues);
   getChanges(fixVersionChangedIds, jira, collection, issueSummaries).
     then(result => {
       const changes = result.filter(change => {return change !== ''});
       console.log('building slack message');
       let slackMessage = buildSlackMessage(changes);
       console.log(slackMessage);
       if (slackMessage !== '') {
         slackChannel(slackMessage).then(console.log).catch(console.log);
       }
     }).catch(console.log);
 }
};

function getChanges(fixVersionChangedIds, jira, collection, issueSummaries) {
  let promises = [];
  for (const fixVersionChangeId of fixVersionChangedIds) {
    promises.push(getChangeInIssue(fixVersionChangeId, issueSummaries[fixVersionChangeId], jira, collection));
  }
  return Promise.all(promises);
}

async function getChangeInIssue(fixVersionChangedId, summary, jira, collection) {
  let response = await jira.get(`issue/${fixVersionChangedId}/changelog`);
  // reversing because we want the most recent change
  for (let changeObject of response.data.values.reverse()) {
    for (let change of changeObject.items.reverse()) {
      if (change.fieldId === 'status') {
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
  return '';
}

function buildChangeString(fixVersionChangedId, summary, fromString, toString) {
  const beginning = utils.createIssueLink(fixVersionChangedId);
  const end = ` status is now ${toString} :tada:` + '\n>  ' + summary;
  return beginning + end;
}

function buildSlackMessage(changes) {
  let consolidatedChanges = {};
  for (let change of changes) {
    let entry = consolidatedChanges[change.author];
    if (entry) {
      entry.push(change.changeString);
    } else {
      consolidatedChanges[change.author] = [change.changeString];
    }
  }
  let message = '';
  for (let key in consolidatedChanges) {
    message += `*${key}*\n`;
    for (let item of consolidatedChanges[key]) {
      message += `>${item}\n`;
    }
  }
  return message;
}
