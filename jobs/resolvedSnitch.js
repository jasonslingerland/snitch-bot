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
 invokeEvery: '1 m',
 fn: async function({
                slackChannel,
                jira,
                mongo
 }) {
   const collection = mongo.collection('sentResolvedNotifications');
   let statusChangedIds = [];
   let issuesReceived = 0;
   let totalNumIssues;
   const issueSummaries = {};
   const issueChanges = {};
   const issueResolutions = {};
   do {
     await jira.get('search', {
       params : {
         jql: 'project in (BelCAD, Android, iOS) AND issuetype in (Epic, Improvement, Story, "Technical task") AND status CHANGED DURING (-10m, now() ) AND NOT status CHANGED DURING (-10m, now() ) BY membersOf(QE)',
         maxResults: 20,
         fields: 'summary, resolution',
         startAt: issuesReceived,
         expand: 'changelog'
       }
     }).then(function (response) {
       issuesReceived += response.data.maxResults;
       totalNumIssues = response.data.total;
       statusChangedIds = statusChangedIds.concat(utils.getIssueKeys(response.data.issues));
       response.data.issues.forEach(issue => {
         issueSummaries[issue.key] = issue.fields.summary;
         issueResolutions[issue.key] = issue.fields.resolution;
         issueChanges[issue.key] = issue.changelog.histories;
       });
     }).catch(console.log);
   } while (issuesReceived < totalNumIssues);
   getUnwantedChanges(statusChangedIds, collection, issueSummaries, issueResolutions, issueChanges).
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

function getUnwantedChanges(statusChangedIds, collection, issueSummaries, issueResolutions, issueChanges) {
  const promises = [];
  for (const statusChangedId of statusChangedIds) {
    promises.push(getUnwantedChangeInIssue(statusChangedId, collection, issueSummaries[statusChangedId], issueResolutions[statusChangedId], issueChanges[statusChangedId]));
  };
  return Promise.all(promises);
}

async function getUnwantedChangeInIssue(statusChangedId, collection, summary, resolution, changes) {
  for (const change of changes) {
    for (const item of change.items) {
      if (item.fieldId === 'status') {
        if (item.toString !== 'Resolved' && item.toString !== 'In QA Testing') {
          return '';
        } else {
          const changeKey = {
            author: change.author.name,
            timestamp: change.created
          };
          const mongoResult = await collection.findOne(changeKey);
          if (mongoResult === null) {
            await collection.insertOne(changeKey);
            return {
              author: change.author.name,
              changeString: buildChangeString(statusChangedId,
                                              summary,
                                              item.fromString,
                                              item.toString,
                                              resolution.name)
            };
          } else {
            return ''
          };
        }
      }
    };
  };
  return '';
}

function buildChangeString(statusChangedId, summary, fromString, toString, resolution) {
  const beginning = utils.createIssueLink(statusChangedId) + ' STATUS changed ';
  let end = ` ~${fromString}~ --> *${toString}*` + '\n> ' + summary;
  if (resolution) {
    end += `\n> _Resolution: ${ resolution }_`
  }
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
