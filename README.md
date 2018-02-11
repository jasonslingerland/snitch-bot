# snitch-bot
A little framework to run jira queries at specified intervals and post useful info to slack.

There must be a creds.js which looks like:

```
module.exports = {
  hookUrls: {
    <a slack channel name>: <a slack channel hook URL>
  },
  jiraBaseUrl: <url for jira API>,
  username: <jira username>,
  password: <jira password>
}
```

To add a job you create a javascript file in the jobs directory that looks like:

```
module.exports = {
  name: <job name>,
  description: <job description>,
  slackChannel: <slack channel name (one of the ones in creds.js)>,
  invokeEvery: <time period to run the job, see link below code snippet for format>,
  fn: <function that takes:
         - A function that posts a slack message
         - An object used to interface with the Jira API>
}
```
### important note for invokeEvery

I'm using [this library](https://www.npmjs.com/package/schedule) which is nice
because it allows you to say things like every('1 hour').do(something), but it does have a funny
spelling of minutes, so I suggest just using 'h','m','s' because it doesn't fail if it gets
an invalid argument
