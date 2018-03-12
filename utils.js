'use strict';
const jiraBaseUrl = require('./creds').jiraBaseUrl;

const createIssueLink = function (idOrKey) {
  return `<${jiraBaseUrl}/browse/${idOrKey}|${idOrKey}>`;
};

const getIssueKeys = function (issues) {
  let issueKeys = [];
  issues.forEach(issue => {
    issueKeys.push(issue.key);
  });
  return issueKeys;
};

// TODO list issues in request or issues that match jql

const getIssueCount = function ({
                                  jqlOrPromise,
                                  bot,
                                  message,
                                  jira
}) {
  return new Promise(function (resolve, reject) {
    let promise;
    if (typeof jqlOrPromise === 'string') {
      promise = jira.makeJqlQuery({
        jql: jqlOrPromise,
        fields: ['issuetype'],
        maxResults: 1
      });
    } else {
      promise = jqlOrPromise;
    }
    promise.then(result => {
      if (!Array.isArray(result)) {
        result = [result];
      }
      let counts = [];
      for (let item of result) {
        if (item.data.warningMessages) {
          bot.reply(message, `<@${message.user}> sorry, something went wrong. `
            + `Received error message from jira:\n \`${result.data.warningMessages.join('\`\n')}\``);
          reject(item);
        }
        counts.push(item.data.total);
      }
      if (counts[1] === undefined) {
        resolve(counts[0]);
      } else {
        resolve(counts);
      }
    }).catch(error => {
      console.log(error);
      bot.reply(message, `<@${message.user}> sorry, something went wrong.`);
    });
  });
};

const somethingWentWrong = function (bot, message) {
  return function() {
    bot.reply(message, 'Sorry, something went wrong.');
  }
};

module.exports = {
  createIssueLink: createIssueLink,
  jiraBaseUrl: jiraBaseUrl,
  getIssueKeys: getIssueKeys,
  getIssueCount: getIssueCount,
  somethingWentWrong: somethingWentWrong
};

