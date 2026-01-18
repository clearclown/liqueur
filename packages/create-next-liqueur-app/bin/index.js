#!/usr/bin/env node

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const green = (text) => `\x1b[32m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function question(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log();
  console.log(cyan('  ╔═══════════════════════════════════════════╗'));
  console.log(cyan('  ║') + '   Create Next.js Liqueur App              ' + cyan('║'));
  console.log(cyan('  ║') + '   AI-driven dashboard generator          ' + cyan('║'));
  console.log(cyan('  ╚═══════════════════════════════════════════╝'));
  console.log();

  let projectName = process.argv[2];

  if (!projectName) {
    projectName = await question(cyan('? ') + 'Project name: ');
    if (!projectName) {
      console.log(red('Error: Project name is required'));
      process.exit(1);
    }
  }

  const projectPath = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(projectPath)) {
    console.log(red(`Error: Directory "${projectName}" already exists`));
    process.exit(1);
  }

  console.log();
  console.log(`Creating a new Liqueur app in ${green(projectPath)}`);
  console.log();

  // Copy template
  const templatePath = path.join(__dirname, '..', 'template');
  console.log(`${cyan('>')} Copying template...`);
  copyDir(templatePath, projectPath);

  // Update package.json
  const pkgPath = path.join(projectPath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  pkg.name = projectName;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  // Rename gitignore
  const gitignorePath = path.join(projectPath, 'gitignore');
  if (fs.existsSync(gitignorePath)) {
    fs.renameSync(gitignorePath, path.join(projectPath, '.gitignore'));
  }

  // Rename env.example
  const envExamplePath = path.join(projectPath, 'env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.renameSync(envExamplePath, path.join(projectPath, '.env.example'));
  }

  // Install dependencies
  console.log(`${cyan('>')} Installing dependencies...`);
  console.log();

  try {
    execFileSync('npm', ['install'], {
      cwd: projectPath,
      stdio: 'inherit',
    });
  } catch {
    console.log(yellow('Warning: Failed to install dependencies. Run "npm install" manually.'));
  }

  console.log();
  console.log(green('Success!') + ` Created ${projectName} at ${projectPath}`);
  console.log();
  console.log('Inside that directory, you can run:');
  console.log();
  console.log(cyan('  npm run dev'));
  console.log('    Starts the development server.');
  console.log();
  console.log(cyan('  npm run build'));
  console.log('    Builds the app for production.');
  console.log();
  console.log('Get started:');
  console.log();
  console.log(cyan(`  cd ${projectName}`));
  console.log(cyan('  cp .env.example .env'));
  console.log(cyan('  # Edit .env with your API keys'));
  console.log(cyan('  npm run dev'));
  console.log();
}

main().catch((err) => {
  console.error(red('Error:'), err.message);
  process.exit(1);
});
