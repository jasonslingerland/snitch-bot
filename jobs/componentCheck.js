'use strict';

module.exports = {
  name: 'componentCheck',
  description: 'checks for new components',
  type: 'time-based',
  phrases: [
    'component'
  ],
  dependencies: [
    'slackChannel',
    'jira',
    'mongo'
  ],
  slackChannel: 'test',
  invokeEvery: '30 m',
  fn: function ({
                  slackChannel,
                  jira,
                  mongo
                }) {
    const collection = mongo.collection('components');
    const projects = [ 'AND','BEL','IOS','TRN' ];
    const componentsPromises = [];
    for (const project of projects) {
      componentsPromises.push(jira.get(`project/${project}/components`));
    }
    Promise.all(componentsPromises).then(async results => {
     // if mongo is empty populate
      if (await collection.count() === 0) {
        // slackChannel('Known components list was empty, filling now.');
        const knownComponents = [];
        for (const result of results) {
          for (const componentObj of result.data) {
            knownComponents.push({
              name: componentObj.name,
              project: componentObj.project
            });
          }
        }
        // store counts of each
        const countsObj = createCountsObj(results, projects);
        collection.insertOne(countsObj);
        await collection.insertMany(knownComponents);
      } else {
        const countsObj = createCountsObj(results, projects);
        const countsAreDifferent = !(await collection.findOne(countsObj));
        if (countsAreDifferent) {
          const differingProjects = diffCountObjects(countsObj, await collection.findOne({
            'AND': {
              '$exists': true
            }
          }),projects);
          const newComponents = [];
          for (const differingProject in differingProjects) {
            // remember, in = key
            const components = results[projects.indexOf(differingProject)].data;
            const componentSearchPromises = [];
            for (const componentObj of components) {
              // search for component in mongo then promise.all and
              componentSearchPromises.push(collection.findOne({
                name: componentObj.name,
                project: componentObj.project
              }));
            }
            const componentSearchResults = await Promise.all(componentSearchPromises);
            let i = 0;
            for (const searchResult of componentSearchResults) {
              if (searchResult === null) {
                newComponents.push(components[i]);
              }
              i+=1;
            }
          }
          let message = '*Found new component(s)*:\n';
          for (const componentObj of newComponents) {
            message += (`>${componentObj.lead.key} created new ${componentObj.project} component: \`${componentObj.name}\`\n`);
          }
          slackChannel(message);
          newComponents.map(function (componentObj) {
            return {
              name: componentObj.name,
              project: componentObj.project
            };
          });
          await collection.insertMany(newComponents);
          await collection.findOneAndUpdate({
            'AND': {
              '$exists': true
            }
          }, countsObj);
        }
      }
      console.log('done');
    }).catch(console.log);
  }
};

function createCountsObj(results, projects) {
  const countsObj = {};
  let i = 0;
  for (const project of projects) {
    countsObj[project] = results[i].data.length;
    i += 1;
  }
  return countsObj;
}

function diffCountObjects(newCounts, oldCounts, projects) {
  const differingProjects = {};
  for (const project of projects) {
    if (newCounts[project] !== oldCounts[project]) {
      differingProjects[project] = newCounts[project] - oldCounts[project];
      if (differingProjects[project] < 0) {
        throw new Error('new counts of components in project ' + project + ' less than old count');
      }
    }
  }
  return differingProjects;
}
