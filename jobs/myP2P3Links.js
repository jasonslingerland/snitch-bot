'use strict';
const utils = require('../utils');

module.exports = {
  name: 'myP2P3Links',
  description: 'gives links to a user\'s p2 or p3 bugs',
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
    'p2 links',
    'p3 links',
    'give me my team\'s p2 links',
    'give me p2 links',
    'give me p3 links',
    'give me my p2 details',
    'give me details for my p3s',
    'give me the details for the team\'s p3 bugs'
  ],
  fn: function ({
                  bot,
                  message,
                  jira,
                  userInfo
                }) {
    const filters = [];
    let assignee = `assignee = ${ userInfo.jiraUserId } AND `;
    let ownershipString = '';
    let isTeam = false;
    let isMine = false;
    const p2p3 = [];
    const messageText = message.text.toLowerCase();
    if (messageText.includes('team')) {
      isTeam = true}
    if (messageText.includes('my') || messageText.includes('mine')) {
      isMine = true}
    if (isTeam && isMine) {
      assignee = `assignee in membersOf(${ userInfo.jiraTeam }) AND `;
      ownershipString = 'Your team\'s';
    }
    else if (isTeam) {
      const team = utils.getTeamFromMessageText(messageText);
      if (!team) {
        bot.reply(message, 'Sorry, I\'m not what team you\'re referring to. Type `@QA-Bot list teams` for the ones that I know.');
        return };
      assignee = `assignee in membersOf("${ team }") AND `;
      ownershipString = `${ team }'s`;
    };

    if (messageText.includes('p2')) {
      p2p3.push(' P2');
      filters.push(`${ assignee }filter = 15209`);
    }
    if (messageText.includes('p3')) {
      p2p3.push(' P3');
      filters.push(`${ assignee }filter = 17400`);
    }
    const priorityString = p2p3.join(' and');
    console.log(filters);
    utils.listIssuesInResult({
      jqlOrPromise: filters,
      bot,
      message,
      jira
    }).
    then(issueList => {
      const reply = {
        text: `*${ ownershipString }${ priorityString } bugs are*:\n`,
        attachments: [ {
          color: ((issueList[0] === 'No issues.') ? 'good' : 'danger'),
          text: `${issueList}`
        } ]
      };
      bot.reply(message, reply);
    }).catch(err => {
      console.log(err);
    });
  }
};
