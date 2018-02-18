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

module.exports = {
  createIssueLink: createIssueLink,
  jiraBaseUrl: jiraBaseUrl,
  getIssueKeys: getIssueKeys
};

