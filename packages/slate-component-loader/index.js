const fs = require('fs');
const path = require('path');
const parse = require('./parser');

const regex = /\{%\s*component '(.*?)',?\s?(.*?)%\}/g;

function getComponentProperties(propertiesString) {
  if (!propertiesString) {
    return [];
  }

  return propertiesString.split(',').map(keyValue => {
    return {
      key: keyValue.split(':')[0].trim(),
      value: keyValue.split(':')[1].trim(),
    };
  });
}

function componentInjector(match, componentName, properties, offset, string) {
  const componentPath = path.resolve(
    `src/components/${componentName}.component.liquid`
  );
  const componentContent = fs.readFileSync(componentPath, 'utf-8');
  let content = '';
  const parts = parse(
    componentContent,
    componentName,
    this.sourceMap,
    componentPath,
    false
  );

  parts.assignProperties = '';
  parts.restoreProperties = '';
  getComponentProperties(properties).map(keyValuePair => {
    const tempVariableName = `${keyValuePair.key}_${new Date().getTime()}`;
    parts.assignProperties += `{% assign ${tempVariableName} = ${
      keyValuePair.key
    } %}\n
    {% assign ${keyValuePair.key} = ${keyValuePair.value} %}\n`;
    parts.restoreProperties += `{% assign ${keyValuePair.key} = ${
      tempVariableName
    } %}\n`;
  });

  content += parts.assignProperties;
  content += parts.template.content;
  content += parts.restoreProperties;

  console.log(parts);
  return content;
}

module.exports = function(content) {
  this.cacheable();

  return content.replace(regex, componentInjector);
};
