// Operations on rules

var fs = require('fs');
var path = require('path');
var rules; // Cashing list of rules, so that we only load them once

function getAllRules() {
  if (!rules) {
    rules = [];
    fs.readdirSync(path.join(__dirname, 'rules')).forEach(function(file) {
      rules.push(require(path.join(__dirname, 'rules', file)));
    });
  }
  return rules;
}

function getRule(rule) {
  var rules = getAllRules();
  for (var i = 0; i < rules.length; i ++) {
    if (rules[i].name === rule) {
      return rules[i];
    }
  }
}

function doesRuleExist(rule) {
  return getRule(rule) != undefined;
}

function isRuleEnabled(ruleConfig) {
  if (Array.isArray(ruleConfig)) {
    return ruleConfig[0] === 'on';
  }
  return ruleConfig === 'on';
}

function runAllEnabledRules(parsedFile, fileName, configuration) {
  var errors = [];
  getAllRules().forEach(function(rule) {
    if (isRuleEnabled(configuration[rule.name])) {
      var error = rule.run(parsedFile, fileName, configuration[rule.name][1]);
      errors = error ? errors.concat(error) : errors;
    }
  });
  return errors;
}

function verifyRuleConfiguration(rule, ruleConfig) {
  var enablingSettings = ['on', 'off'];
  var genericErrorMsg = 'Invalid rule configuration - ';

  if (Array.isArray(ruleConfig)) {
    if (enablingSettings.indexOf(ruleConfig[0]) == -1) {
      throw new Error(genericErrorMsg + 'The first part of the config should be "on" or "off"');
    }
    if (ruleConfig.length != 2 || typeof(ruleConfig[1]) !== 'object') {
      throw new Error(genericErrorMsg + ' The config should only have 2 parts and the second part should be a keyworded map');
    }
    var ruleObj = getRule(rule);

    for (var subConfig in ruleConfig[1]) {
      if (ruleObj.availableConfigs[subConfig] === undefined) {
        throw new Error(genericErrorMsg + ' The rule does not have the specified configuration argument');
      }
    }
  }
  return enablingSettings.indexOf(ruleConfig) != -1;
}

module.exports = {
  doesRuleExist: doesRuleExist,
  isRuleEnabled: isRuleEnabled,
  runAllEnabledRules: runAllEnabledRules,
  verifyRuleConfiguration: verifyRuleConfiguration
};
