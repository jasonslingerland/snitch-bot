'use strict';
const jiraBaseUrl = require('./creds').jiraBaseUrl;

const createIssueLink = function (idOrKey) {
  return `<${jiraBaseUrl}/browse/${idOrKey}|${idOrKey}>`;
}

module.exports = {
  createIssueLink: createIssueLink
}

