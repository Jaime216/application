const { findUserByEmail, getEducationDashboard } = require('../src/db');

async function main() {
  const user = findUserByEmail('alumno@spa.app');
  if (!user) {
    console.error('Demo user not found');
    process.exit(2);
  }

  const dash = getEducationDashboard(user.id);
  console.log('Dashboard result for', user.email);
  console.log(JSON.stringify(dash, null, 2));
}

main();
