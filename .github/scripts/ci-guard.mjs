import { readFileSync } from 'node:fs';
const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
const beforeJobs = workflow.split(/^jobs:\s*$/m)[0];
const build = workflow.split(/^  build:\s*$/m)[1]?.split(/^  deploy:\s*$/m)[0] || '';
const deploy = workflow.split(/^  deploy:\s*$/m)[1] || '';
const failures = [];
if (/secrets\./.test(beforeJobs) || /secrets\./.test(build)) failures.push('Production secrets are available to the PR build job.');
if (!/github\.event_name != 'pull_request'/.test(deploy)) failures.push('Production deploy is not excluded from pull requests.');
if (!/github\.ref == 'refs\/heads\/main'/.test(deploy)) failures.push('Production deploy is not restricted to main.');
if (!/reset --hard "\$EXPECTED_SHA"/.test(deploy)) failures.push('Production deploy does not pin the exact tested commit.');
if (failures.length) {
  failures.forEach((message) => console.error(`::error::${message}`));
  process.exitCode = 1;
} else {
  console.log('Playground deployment isolation checks passed (targeted static checks).');
}
