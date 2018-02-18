// taken from: https://olegkorol.de/2017/04/23/Creating-a-smart-ChatBot-for-Slack/
'use strict';
const Botkit = require('botkit');
const creds = require('./creds');

// use the tokens you got from the previous step
const slack_token  = creds.oauth;
const slack_oauth  = creds.oauth;

exports.fn = {
  /**
   * Starts Slack-Bot
   *
   * @returns {*}
   */
  slackBot() {
    // initialisation
    const slackController = Botkit.slackbot({
      // optional: wait for a confirmation events for each outgoing message before continuing to the next message in a conversation
      require_delivery: true,
      debug: true
    });
    const slackBot = slackController.spawn({
      token: slack_token
    });
    // create rtm connection
    slackBot.startRTM((err, bot, payload) => {
      if (err) {
        throw new Error('Could not connect to Slack');
      }
      slackController.log('Slack connection established.');
    });
    // listener that handles incoming messages
    slackController.hears(['.*'], ['direct_message', 'direct_mention'], (bot, message) => {
      slackController.log('Slack message received');
      console.log(message);
      bot.reply(message, 'I have received your message!')
    });
  }
};

