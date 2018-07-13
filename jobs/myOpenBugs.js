'use strict'

const utils = require('../utils');

module.exports = {
  name: 'myOpenBugs',
  description: 'lists number of open bugs of a given priority that the entire project, a user or a team has',
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
    'how many p2s are there',
    'what are my bugs',
    'what are my p2 bugs',
    'what are my p3 bugs',
    'what are my team\'s p2s',
    'give me the p2 p3 count',
    'what is the total p2 p3 count',
    'total bug count',
    'bug count',
    'p2 p3 count',
    'p2 count',
    'p3 count',
    'p2 p3 total',
    'p2 total',
    'p3 total',
    'bug total',
    'how many p3s are there',
    'how many p2s and p3s are there',
    'how many bugs are there',
    'how many p2 and p3 bugs are there',
    'how many p2 bugs do we have',
    'how many p3 bugs do we have',
    'how many p2 and p3 bugs do we have'
  ],
  fn: function ({
                  bot,
                  message,
                  jira,
                  userInfo
                }) {
    const p2p3 = [];
    const filters = [];

    let assignee = '';
    let reply = '';
    let personal = '';
    let isTeam = false;
    let isMine = false;
    const messageText = message.text.toLowerCase();
    if (messageText.includes('team')) {
      isTeam = true}
    if (messageText.includes('my') || messageText.includes('mine')) {
      isMine = true}
    if (isTeam && isMine) {
      assignee = `assignee in membersOf(${ userInfo.jiraTeam }) AND `;
      reply += `<@${message.user}>, your team has: \n`;
      personal = 'my team\'s';
    }
    else if (isMine) {
      assignee = `assignee = ${ userInfo.jiraUserId } AND `;
      reply += `<@${message.user}>, you have: \n`;
      personal = 'my'
    }
    else if (isTeam) {
      const team = utils.getTeamFromMessageText(messageText);
      if (!team) {
        bot.reply(message, 'Sorry, I\'m not what team you\'re referring to. Type `@QA-Bot list teams` for the ones that I know.');
        return };
      assignee = `assignee in membersOf("${ team }") AND `;
      personal = `the ${ team } team's`
      reply += `"${ team }" has: \n`;
    }
    else {
      reply += 'There are: \n'
    };

    if (messageText.includes('p2')) {
      p2p3.push(' P2');
      filters.push(`${ assignee }filter = 15209`);
    }
    if (messageText.includes('p3')) {
      p2p3.push(' P3');
      filters.push(`${ assignee }filter = 17400`);
    }
    else if (!messageText.includes('p2') && !messageText.includes('p3')) {
      p2p3.push('');
      filters.push(`${ assignee }status IN (Open, Reopened, "In Progress") AND type = bug`);
    }

    const suggestLinks = p2p3.join(' and');
    function getReply(counts) {
      p2p3.forEach((bugType, index) => {
      reply += `\`${ counts[index] }\` open${ bugType } bugs\n`});
      if (suggestLinks && personal) {
        reply += `For more details, ask me \`give me ${ personal }${ suggestLinks } links\``
      };
      reply = reply.trim();
      return reply;
    }
    utils.getIssueCount({
      jqlOrPromise: filters,
      bot,
      message,
      jira
    }).
    then(counts => {
      bot.reply(message, getReply(counts));
    }).catch(response => {
      console.log(response);
    });
  }
};
