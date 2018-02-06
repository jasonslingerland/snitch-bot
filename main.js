const axios = require('axios');
const creds = require('./creds');
const base64UserPass = Buffer.from(creds.username + ':' + creds.password).toString('base64');

const slack = axios.create({
  headers: { 'Content-type': 'application/json' }
});
const jira = axios.create({
  headers: {
    'Content-type': 'application/json',
    'Authorization': `Basic ${base64UserPass}`
  },
  baseURL: 'https://belmonttechinc.atlassian.net/rest/api/2/'
});

function postMessage(message){
  return slack.post(creds.hookUrl, {
    'text': message
  });
}

//jira.get('issue/BEL-83255').then(console.log).catch(console.log);

makeJqlQuery = function (query) {
  query.validateQuery = 'strict';
  return jira.post('search', query);
}

makeJqlQuery({ jql: "createdDate >= startOfDay() order by lastViewed DESC", maxResults: 10}).then(response => {
 console.log(response.data);
});

