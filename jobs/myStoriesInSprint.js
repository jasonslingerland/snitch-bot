'use strict';
const utils = require('../utils');

module.exports = {
  name: 'myStoriesInSprint',
  description: 'gives links to a user\'s stories in the sprint',
  type: 'responsive',
  dependencies: [
    'jira'
  ],
  userInfoNeeded: [
    'jiraUserId',
    'jiraTeam'
  ],
  hiddenFromHelp: false,
  phrases: [
    'what are my stories this sprint?',
    'stories this sprint',
    'what are my stories'
  ],
  fn: function ({
                  bot,
                  message,
                  jira,
                  userInfo
                }) {
    let isTeam = false;
    let isMine = false;
    let assignee = `assignee = ${userInfo.jiraUserId}`;
    let ownershipString = 'Your'
    const messageText = message.text.toLowerCase();
    if (messageText.includes('team')) {
      isTeam = true}
    if (messageText.includes('my') || messageText.includes('mine')) {
      isMine = true}
    if (isTeam && isMine) {
      assignee = `assignee in membersOf(${ userInfo.jiraTeam })`;
      ownershipString = 'Your team\'s';
    }
    else if (isTeam) {
      const team = utils.getTeamFromMessageText(messageText);
      if (!team) {
        bot.reply(message, 'Sorry, I\'m not what team you\'re referring to. Type `@QA-Bot list teams` for the ones that I know.');
        return };
      assignee = `assignee in membersOf("${ team }")`;
      ownershipString = `The "${ team }" team's`;
    };
    const jqlOrPromise = `${ assignee } AND status NOT IN (resolved, closed) AND sprint IN openSprints()`;
    const jqlURL = utils.jiraBaseUrl + '/issues/?jql=' + encodeURIComponent(jqlOrPromise);
    utils.listIssuesInResult({
      jqlOrPromise,
      bot,
      message,
      jira
    }).
    then(issueList => {
      const reply = {
        text: `*<${ jqlURL }|${ ownershipString } stories in this sprint> are*:\n`,
        attachments: [ {
          color: 'good',
          text: `${issueList}`
        } ]
      };
      bot.reply(message, reply);
    }).catch(err => {
      console.log(err.data);
    });
  }
};
