'use strict';
const utils = require('../utils');

module.exports = {
 name: 'fix version snitch',
 description: 'checks to see if anyone not in QA changes a fix version',
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
   const collection = mongo.collection('sentFixVersionNotifications');
   let fixVersionChangedIds = [];
   let issuesReceived = 0;
   let totalNumIssues;
   const issueSummaries = {};
   do {
     const jiraQueryResult = await jira.makeJqlQuery({
       jql: `fixVersion CHANGED DURING (-30m, now())`,
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
       console.log('building slack message');
       const slackMessage = buildSlackMessage(changes);
       console.log(slackMessage);
       if (slackMessage !== '') {
         slackChannel(slackMessage).then(console.log).catch(console.log);
       }
     }).catch(console.log);
 }
};

const qaUserList = [
  'jramsley',
  'jslingerland',
  'mbarr',
  'kathyChang',
  'jsundahl',
  'rbaek',
  'rdharmadhikari',
  'nkania'
];

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
    const userIsInQA = qaUserList.includes(changeObject.author.name);
    for (const change of changeObject.items.reverse()) {
      if (change.fieldId === 'fixVersions') {
        if (userIsInQA) {
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
  let end;
  if (fromString === null) {
    end = ` ADDED fix version ${toString}`;
  } else if (toString === null) {
    end = ` REMOVED fix version ${fromString}`;
  } else {
    end = ` CHANGED from ${fromString} to ${toString}`;
  }
  end = end + '\n>  ' + summary;
  return beginning + end;
}

function buildSlackMessage(changes) {
  const consolidatedChanges = {};
  for (const change of changes) {
    const entry = consolidatedChanges[change.author];
    console.log(change.author);
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
