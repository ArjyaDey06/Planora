const fs = require('fs');
const path = 'd:\\Planora\\src\\components\\FinancialAssessment\\GoalBasedPlanningResults.jsx';

try {
  const content = fs.readFileSync(path, 'utf8');
  console.log('File read successfully');
  
  // Basic syntax check by attempting to parse as JS
  require('acorn').parse(content, {ecmaVersion: 2020, sourceType: 'module'});
  console.log('Syntax is valid');
} catch (error) {
  console.log('Syntax error:', error.message);
}
