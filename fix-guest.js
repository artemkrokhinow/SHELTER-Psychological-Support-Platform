const fs = require('fs');


const authPath = 'c:/Users/k/Desktop/nika1/backend/routes/auth.js';
let authContent = fs.readFileSync(authPath, 'utf8');

authContent = authContent.replace(
  "if (type === 'material') {",
  "if (type === 'material' || type === 'complete_material' || type === 'material_view') {"
);

authContent = authContent.replace(
  "else if (type === 'scenario') {",
  "else if (type === 'scenario' || type === 'complete_scenario' || type === 'complete_exercise') {"
);

fs.writeFileSync(authPath, authContent);


const apiPath = 'c:/Users/k/Desktop/nika1/my-app/src/infrastructure/api/api.js';
let apiContent = fs.readFileSync(apiPath, 'utf8');

apiContent = apiContent.replace(
  "body: JSON.stringify({ type: 'material_view', metadata: { minutes }, name: `Перегляд матеріалу` })",
  "body: JSON.stringify({ type: 'material_view', itemId: materialId, metadata: { minutes }, name: `Перегляд матеріалу` })"
);

fs.writeFileSync(apiPath, apiContent);
console.log('Fixed successfully');
