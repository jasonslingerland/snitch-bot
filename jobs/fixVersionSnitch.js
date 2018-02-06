'use strict';

/*
job object should look like:
{
  job name,
  job description,
  slack channel to post to,
  time period for invocation,
  function that takes slack channel and jira object
}
*/
// TODO: double notifications are (will be) annoying
module.exports = {
 name: 'fix version snitch',
 description: 'checks to see if anyone not in QA changes a fix version',
 slackchannel: 'testChannel',
 invokeEvery: 'hour',
 fn: function(postSlackMessage, jira) {
   jira.makeJqlQuery({
     jql: 'fixVersion changed AFTER startOfWeek()',
     maxResults: 150,
     fields: ['issuetype']
   }).then(result => {
     let fixVersionChangedIssues = result.data.issues;
     let fixVersionChangedIds = [];
     fixVersionChangedIssues.forEach(issue => {
       console.log(issue);
       fixVersionChangedIds.push(issue.id);
     });
     getUnwantedChanges(fixVersionChangedIds, jira).
       then(result => {
         console.log('--------------');
         const finalList = result.filter(change => {return change !== ''})
         console.log(finalList);
         //postSlackMessage(finalList.join('\n'));
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
  'rdharmadhikari'
];

function getUnwantedChanges(fixVersionChangedIds, jira) {
  let promises = [];
  for (const fixVersionChangeId of fixVersionChangedIds) {
    promises.push(getUnwantedChangeInIssue(fixVersionChangeId, jira));
  }
  return Promise.all(promises);
}

function getUnwantedChangeInIssue(fixVersionChangedId, jira) {
  return new Promise(function(resolve, reject) {
    jira.get(`issue/${fixVersionChangedId}/changelog`).then(response => {
      // reversing because we want the most recent change
      for (let changeObject of response.data.values.reverse()) {
        if (!qaUserList.includes(changeObject.author.name)) {
          // if the author is not in QA
          for (let change of changeObject.items) {
            if (change.fieldId === 'fixVersions') {
              /*
              console.log(`${changeObject.author.name} changed issue #${fixVersionChangedId}` +
              ` from ${change.fromString} to ${change.toString}`);
              */
              resolve(`${changeObject.author.name} changed issue #${fixVersionChangedId}` +
              ` from ${change.fromString} to ${change.toString}`);
            }
          }
        }
      }
      resolve('');
    }).catch(error=> {resolve('could not search:' + fixVersionChangedId)});
  });
}

