import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('./', import.meta.url));
const readJson = file => JSON.parse(readFileSync(`${dir}${file}`, 'utf8'));

const { dependencies } = readJson('package.json');
const lock = existsSync(`${dir}package-lock.json`) ? readJson('package-lock.json') : { packages: {} };

const installedVersion = name => {
    const file = `node_modules/${name}/package.json`;
    return existsSync(`${dir}${file}`) ? readJson(file).version : null;
};

const upToDate = Object.keys(dependencies)
    .every(name => installedVersion(name) && installedVersion(name) === lock.packages[`node_modules/${name}`]?.version);

if (!upToDate) {
    execSync(lock.packages[''] ? 'npm ci --no-audit --no-fund' : 'npm install --no-audit --no-fund', { cwd: dir, stdio: 'inherit' });
}
