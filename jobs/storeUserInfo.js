'use strict';
const utils = require('../utils');

module.exports = {
  name: 'storeUserInfo',
  description: 'accepts a user\'s info and stores it for use with other jobs',
  type: 'responsive',
  dependencies: [
    'userInfoStore',
    'userInfoStrings'
  ],
  hiddenFromHelp: false,
  phrases: [
    'set my Github id to: "12345"',
    'set my Github user ID to "12345"',
    'set my Jira user ID to "someone@onshape.com"',
    'set my Jira team to "developers"'
  ],
  fn: function ({
                  bot,
                  message,
                  userInfoStore,
                  userInfoStrings
                }) {
    /*
     TODO: either add a better way to automagically keep up with user info stuff, or add to docs that this needs
     to stay updated
     */
    let userInfoValue = message.text.split(/[“”"'`‘’]/)[1];
    if (userInfoValue === undefined) {
      utils.somethingWentWrong(bot, message)();
      return;
    } else {
      userInfoValue = userInfoValue.trim();
    }
    let userInfoKey;
    const lowercaseMessageText = message.text.toLowerCase();
    if (lowercaseMessageText.includes('git')) {
      userInfoKey = 'githubId';
    } else if (lowercaseMessageText.includes('jira') && lowercaseMessageText.includes('team')) {
      userInfoKey = 'jiraTeam'
    } else if (lowercaseMessageText.includes('jira')) {
      userInfoKey = 'jiraUserId'
    } else {
      bot.reply(message, 'Sorry, I can\'t figure out what user info you\'re giving me. Please check your spelling.');
      return;
    }
    if (!userInfoStore[message.user]) {
      userInfoStore[message.user] = {};
    }
    userInfoStore[message.user][userInfoKey] = userInfoValue;
    const valueToSet = {};
    valueToSet[userInfoKey] = userInfoValue;
    userInfoStore.collection.findOneAndUpdate({
        user: message.user
      }, {
        $set: valueToSet
      }, {
        returnOriginal: false,
        upsert: true
      }).then(result => {
      console.log(result);
      bot.reply(message, `Got it! I've set your ${userInfoStrings[userInfoKey]} to \`${userInfoValue}\`. `
        + 'If this isn\'t correct please double check your spelling and formatting and try again.');
    }).catch(utils.somethingWentWrong(bot, message));
  }
};
