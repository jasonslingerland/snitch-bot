'use strict';

const axios = require('axios');
const creds = require('./creds');
const base64UserPass = Buffer.from(creds.username + ':' + creds.password).toString('base64');
const testRunner = require('./jobRunner');
const axiosRetry = require('axios-retry');

const slack = axios.create({
  headers: { 'Content-type': 'application/json' }
});
let jira = axios.create({
  headers: {
    'Content-type': 'application/json',
    'Authorization': `Basic ${base64UserPass}`
  },
  baseURL: creds.jiraBaseUrl + '/rest/api/2/'
});
axiosRetry(jira, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    /*
      retry on everything because jira gives me 401s for some mystifying reason
      and now I don't trust their status codes...
    */
    return true;
  }
});

// jira.get(`issue/BEL-89197/changelog`).then(console.log);

function createPostMessageFn(slackHookUrl) {
  return function (message) {
    return slack.post(slackHookUrl, {
      text: message,
      mrkdwn: true,
    });
  };
}

let postSlackMessageFunctions = {};
for (const slackChannelName in creds.hookUrls) {
  postSlackMessageFunctions[slackChannelName] =
    createPostMessageFn(creds.hookUrls[slackChannelName]);
}

jira.makeJqlQuery = function (query) {
  if (typeof query === 'string') {
    query = {
      jql: query
    }
  }
  query.validateQuery = 'strict';
  return jira.post('search', query);
};

testRunner.runJobs(postSlackMessageFunctions, jira);

