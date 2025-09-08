const securityComponents = require('./security.components');
const parametersComponents = require('./parameters.components');

module.exports = {
  securitySchemes: securityComponents.securitySchemes,
  parameters: parametersComponents.parameters
};