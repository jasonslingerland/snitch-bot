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
 fn: function({
                slackChannel,
                jira,
                mongo
 }) {
   const collection = mongo.collection('sentFixVersionNotifications');
   jira.makeJqlQuery({
     jql: 'fixVersion CHANGED DURING (-7d, now())',
     maxResults: 150,
     fields: ['issuetype']
   }).then(result => {
     let fixVersionChangedIssues = result.data.issues;
     let fixVersionChangedIds = [];
     fixVersionChangedIssues.forEach(issue => {
       fixVersionChangedIds.push(issue.key);
     });
     getUnwantedChanges(fixVersionChangedIds, jira, collection).
       then(result => {
         const changes = result.filter(change => {return change !== ''});
         console.log('building slack message');
         let slackMessage = buildSlackMessage(changes);
         console.log(slackMessage);
         if (slackMessage === '') {
           return;
         } else {
           slackChannel(slackMessage).
             then(console.log).catch(console.log);
         }
       }).catch(console.log);
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

function getUnwantedChanges(fixVersionChangedIds, jira, collection) {
  let promises = [];
  for (const fixVersionChangeId of fixVersionChangedIds) {
    promises.push(getUnwantedChangeInIssue(fixVersionChangeId, jira, collection));
  }
  return Promise.all(promises);
}

async function getUnwantedChangeInIssue(fixVersionChangedId, jira, collection) {
  let response = await jira.get(`issue/${fixVersionChangedId}/changelog`);
  // reversing because we want the most recent change
  for (let changeObject of response.data.values.reverse()) {
    let userIsInQA = qaUserList.includes(changeObject.author.name);
    for (let change of changeObject.items.reverse()) {
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

function buildChangeString(fixVersionChangedId, fromString, toString) {
  const beginning = utils.createIssueLink(fixVersionChangedId);
  let end;
  if (fromString === null) {
    end = ` ADDED fix version ${toString}`;
  } else if (toString === null) {
    end = ` REMOVED fix version ${fromString}`;
  } else {
    end = ` CHANGED from ${fromString} to ${toString}`;
  }
  return beginning + end;
}

function buildSlackMessage(changes) {
  let consolidatedChanges = {};
  for (let change of changes) {
    let entry = consolidatedChanges[change.author];
    console.log(change.author);
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
