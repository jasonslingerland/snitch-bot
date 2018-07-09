'use strict';

const axios = require('axios');
const creds = require('./creds');
const base64UserPass = Buffer.from(creds.username + ':' + creds.password).toString('base64');
const testRunner = require('./jobRunner');
const axiosRetry = require('axios-retry');
const slackBot = require('./chatbot').fn.slackBot;
const UserInfoStore = require('./mongoInit').UserInfoStore;

const slack = axios.create({
  headers: {
    'Content-type': 'application/json'
  }
});
const jira = axios.create({
  headers: {
    'Content-type': 'application/json',
    'Authorization': `Basic ${base64UserPass}`
  },
  baseURL: creds.jiraBaseUrl + '/rest/api/2/'
});
axiosRetry(jira, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: () => {
    /*
      retry on everything because jira gives me 401s for some mystifying reason
      and now I don't trust their status codes...
    */
    return true;
  }
});

function createPostMessageFn(slackHookUrl) {
  return function (message) {
    return slack.post(slackHookUrl, {
      text: message,
      mrkdwn: true,
    });
  };
}

const postSlackMessageFunctions = {};
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

UserInfoStore.init().then(userInfoStoreAndDb => {
  testRunner.runJobs(slackBot, {
    postSlackMessageFunctions: postSlackMessageFunctions,
    jira: jira,
    userInfoStore: userInfoStoreAndDb.userInfoStore,
    mongo: userInfoStoreAndDb.db
  });
}).catch(console.log);
