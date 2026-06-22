const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const pythonBin = process.platform === 'win32' ? 'python' : 'python3';

function npmStep(name, args) {
    if (process.platform === 'win32') {
        return {
            name,
            command: 'cmd.exe',
            args: ['/d', '/s', '/c', [npmBin, ...args].join(' ')]
        };
    }
    return { name, command: npmBin, args };
}

const steps = [
    {
        name: 'validate package manifests',
        command: process.execPath,
        args: ['-e', [
            "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))",
            "JSON.parse(require('fs').readFileSync('ui/package.json', 'utf8'))",
            "JSON.parse(require('fs').readFileSync('backend-node/package.json', 'utf8'))"
        ].join(';')]
    },
    npmStep('frontend lint', ['--prefix', 'ui', 'run', 'lint']),
    npmStep('frontend unit tests', ['--prefix', 'ui', 'run', 'test:unit', '--', '--run']),
    npmStep('frontend build', ['--prefix', 'ui', 'run', 'build']),
    {
        name: 'decision analysis API script smoke',
        command: process.execPath,
        args: ['test/decision-analysis-smoke.js']
    },
    {
        name: 'decision analysis responsive script',
        command: process.execPath,
        args: ['test/responsive-check.js']
    },
    npmStep('backend node tests', ['--prefix', 'backend-node', 'test']),
    {
        name: 'backend node syntax',
        command: process.execPath,
        args: ['--check', 'backend-node/server.js']
    },
    {
        name: 'python compile check',
        command: pythonBin,
        args: ['-m', 'compileall', '-q', 'backend-python']
    }
];

function removePycache(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === '__pycache__') {
                fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
                removePycache(fullPath);
            }
        }
    }
}

let failed = false;

for (const step of steps) {
    console.log(`\n==> ${step.name}`);
    const result = spawnSync(step.command, step.args, {
        cwd: root,
        stdio: 'inherit',
        shell: false
    });

    if (result.status !== 0) {
        if (result.error) {
            console.error(result.error);
        }
        console.error(`\nFAILED: ${step.name}`);
        failed = true;
        break;
    }
}

removePycache(path.join(root, 'backend-python'));

if (failed) {
    process.exit(1);
}

console.log('\nAll project checks passed.');
