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

const normalizeJqlOrPromise = function (jqlOrPromise, maxResults, jira) {
  let promise;
    if (typeof jqlOrPromise === 'string') {
      promise = jira.makeJqlQuery({
        jql: jqlOrPromise,
        fields: ['issuetype'],
        maxResults: maxResults
      });
    } else {
      promise = jqlOrPromise;
    }
    return promise;
};

const listIssuesInResult = function ({
                                       bot,
                                       message,
                                       jira,
                                       jqlOrPromise
                                     }) {
  return new Promise(function (resolve, reject) {
    normalizeJqlOrPromise(jqlOrPromise, 100, jira).
    then(response => {
      if (!Array.isArray(response)) {
        response = [response];
      }
      let issueListStrings = [];
      for (let item of response) {
        if (item.data && item.data.warningMessages) {
          bot.reply(message, `<@${message.user}> sorry, something went wrong. `
            + `Received error message from jira:\n \`${item.data.warningMessages.join('\`\n')}\``);
          reject(item);
        } else {
          let issueListString = '';
          if (item.data === undefined || item.data.issues[0] === undefined) {
            issueListString = '>No issues.';
          } else {
            const issueKeys = getIssueKeys(item.data.issues);
            for (const key of issueKeys) {
              issueListString += `>${createIssueLink(key)}\n`;
            }
          }
          issueListStrings.push(issueListString);
        }
      }
      if (issueListStrings[1] === undefined) {
        resolve(issueListStrings[0]);
      } else {
        resolve(issueListStrings);
      }
    }).catch(err => {
      console.log(err);
      if (err.response.data && err.response.data.errorMessages) {
        bot.reply(message, `<@${message.user}> sorry, something went wrong. `
           + `Received error message from jira:\n \`${err.response.data.errorMessages.join('\`\n')}\``);
      } else {
        somethingWentWrong(bot, message)();
      }
      reject(err);
    });
  });
};

const getIssueCount = function ({
                                  jqlOrPromise,
                                  bot,
                                  message,
                                  jira
}) {
  return new Promise(function (resolve, reject) {
    if (!Array.isArray(jqlOrPromise)) {
      jqlOrPromise = [ jqlOrPromise ];
    }
    let promises = [];
    jqlOrPromise.forEach(function(item) {
      promises.push(normalizeJqlOrPromise(item, 1, jira));
    });
    const promise = Promise.all(promises);
    promise.then(result => {
      if (!Array.isArray(result)) {
        result = [ result ];
      }
      let counts = [];
      for (let item of result) {
        if (item.data && item.data.warningMessages) {
          bot.reply(message, `<@${message.user}> sorry, something went wrong. `
            + `Received error message from jira:\n \`${item.data.warningMessages.join('\`\n')}\``);
          reject(item);
        }
        counts.push(item.data.total);
      }
      resolve(counts);
    }).catch(err => {
      console.log(err);
      if (err.response.data && err.response.data.errorMessages) {
        bot.reply(message, `<@${message.user}> sorry, something went wrong. `
          + `Received error message from jira:\n \`${err.response.data.errorMessages.join('\`\n')}\``);
      } else {
        somethingWentWrong(bot, message)();
      }
      reject(err);
      bot.reply(message, `Sorry, something went wrong.`);
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
  somethingWentWrong: somethingWentWrong,
  listIssuesInResult: listIssuesInResult
};
