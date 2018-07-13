// (mostly) taken from: https://olegkorol.de/2017/04/23/Creating-a-smart-ChatBot-for-Slack/
'use strict';
const Botkit = require('botkit');
const creds = require('./creds');

// use the tokens you got from the previous step
const slack_token  = creds.oauth;

exports.fn = {
  slackBot(messageReceivedFn) {
    // initialisation
    const slackController = Botkit.slackbot({
      // optional: wait for a confirmation events for each outgoing message before continuing to the next message in a conversation
      debug: true,
      require_delivery: true,
      retry: true
    });
    const slackBot = slackController.spawn({
      token: slack_token
    });
    // create rtm connection
    function startRtm() {
      slackBot.startRTM((err) => {
        if (err) {
          throw new Error('Could not connect to Slack');
        }
        slackController.log('Slack connection established.');
      });
    }
    startRtm();
    // listener that handles incoming messages
    slackController.hears([ '.*' ], [ 'direct_message', 'direct_mention' ], messageReceivedFn);
    slackController.on('rtm_close', function (bot) {
      bot.say({
        channel: 'C90JDAY92',
        text: 'still awake!'
      });
      console.log('** The RTM api just closed. Trying reconnect...');
      startRtm();
    });
  }
};
