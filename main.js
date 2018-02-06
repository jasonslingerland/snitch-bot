const axios = require('axios');
const creds = require('./creds');
const base64UserPass = Buffer.from(creds.username + ':' + creds.password).toString('base64');

const slack = axios.create({
  headers: { 'Content-type': 'application/json' }
});
let jira = axios.create({
  headers: {
    'Content-type': 'application/json',
    'Authorization': `Basic ${base64UserPass}`
  },
  baseURL: 'https://belmonttechinc.atlassian.net/rest/api/2/'
});

function postMessage(message){
  return slack.post(creds.hookUrl, {
    text: message,
    mrkdwn: true,
  });
}
/*
jira.get('issue/BEL-88130/changelog').then(response => {
//  console.log(response.data.values[0]);
});
*/
jira.makeJqlQuery = function (query) {
  if (typeof query === 'string') {
    query = {
      jql: query
    }
  }
  query.validateQuery = 'strict';
  return jira.post('search', query);
}

const testJob = require('./jobs/fixVersionSnitch');
console.log(testJob.name);
testJob.fn(postMessage, jira);

