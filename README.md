# snitch-bot
A little framework to run jira queries at specified intervals and post useful info to slack.

There must be a creds.js which looks like:

```
module.exports = {
  hookUrls: {
    <a slack channel name>: <a slack channel hook URL>
  },
  jiraBaseUrl: <url for jira (e.g. https://companyName.atlassian.net)>,
  username: <jira username>,
  password: <jira password>
}
```

To add a job you create a javascript file in the jobs directory that looks like:

```
module.exports = {
  name: <job name>,
  description: <job description>,
  type: <job type. currently either 'time-based' or 'reactive',
  dependencies: [
    <list of dependencies as strings. Look at the bottom of main.js
     for the list of those. e.g. 'slackChannel'>
  ],
  slackChannel: <slack channel name (one of the ones in creds.js)>, // OPTIONAL
  invokeEvery: <time period to run the job, see link below code snippet for format>, // OPTIONAL
  fn: <function to do the job, it's given what's listed in the dependencies
       list as a destructured (object) parameter, must be exactly as listed in dependencies>
}
```
### important note for invokeEvery

I'm using [this library](https://www.npmjs.com/package/schedule) which is nice
because it allows you to say things like every('1 hour').do(something), but it does have a funny
spelling of minutes, so I suggest just using 'h','m','s' because it doesn't fail if it gets
an invalid argument
