import {execFileSync} from 'node:child_process'
import {mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const workflowKitRoot = resolve(
  process.env.WORKFLOW_KIT_ROOT || join(packageRoot, '../workflow-kit'),
)
const sanityVersion = process.env.SANITY_VERSION || '^6.0.0'
const sanityUiVersion = process.env.SANITY_UI_VERSION || '^4.0.0'
const smokeRoot = mkdtempSync(join(tmpdir(), 'workflows-plugin-smoke-'))
const tarballRoot = join(smokeRoot, 'packages')

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    env: {...process.env, CI: '1'},
    stdio: 'inherit',
  })
}

function packPackage(packageDirectory, packageName, packedVersion) {
  const destination = join(tarballRoot, packageName)
  mkdirSync(destination, {recursive: true})
  run('pnpm', ['build'], packageDirectory)
  run('pnpm', ['pack', '--pack-destination', destination], packageDirectory)
  let tarballName = readdirSync(destination).find((name) => name.endsWith('.tgz'))
  if (!tarballName) throw new Error(`${packageName} pack did not create a tarball`)

  if (packedVersion) {
    const stagingRoot = join(destination, 'staging')
    mkdirSync(stagingRoot, {recursive: true})
    run('tar', ['-xzf', join(destination, tarballName), '-C', stagingRoot], destination)

    const stagedPackageJsonPath = join(stagingRoot, 'package', 'package.json')
    const stagedPackageJson = JSON.parse(readFileSync(stagedPackageJsonPath, 'utf8'))
    stagedPackageJson.version = packedVersion
    writeFileSync(stagedPackageJsonPath, JSON.stringify(stagedPackageJson, null, 2))
    rmSync(join(destination, tarballName))

    run(
      'npm',
      ['pack', join(stagingRoot, 'package'), '--pack-destination', destination, '--loglevel=error'],
      destination,
    )
    tarballName = readdirSync(destination).find((name) => name.endsWith('.tgz'))
    if (!tarballName) throw new Error(`${packageName} versioned pack did not create a tarball`)
  }

  return `file:${join(destination, tarballName)}`
}

try {
  // Match the version produced by workflow-kit's pending minor changeset so the
  // plugin's release dependency is tested before either package is published.
  const workflowKitTarball = packPackage(workflowKitRoot, 'workflow-kit', '0.6.0')
  const pluginTarball = packPackage(packageRoot, 'workflows-plugin')
  const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))

  writeFileSync(
    join(smokeRoot, 'package.json'),
    JSON.stringify(
      {
        name: 'workflows-plugin-compatibility-smoke',
        private: true,
        type: 'module',
        scripts: {
          build: 'sanity build',
        },
        dependencies: {
          [packageJson.name]: pluginTarball,
          '@sanity-labs/workflow-kit': workflowKitTarball,
          '@sanity/ui': sanityUiVersion,
          react: '19.2.8',
          'react-dom': '19.2.8',
          sanity: sanityVersion,
          'styled-components': '^6.4.0',
        },
      },
      null,
      2,
    ),
  )

  writeFileSync(
    join(smokeRoot, 'sanity.config.ts'),
    `import {workflowsPlugin} from '@sanity-labs/sanity-plugin-workflows'
import {defineConfig, defineField, defineType} from 'sanity'

export default defineConfig({
  projectId: 'ppsg7ml5',
  dataset: 'production',
  plugins: [workflowsPlugin()],
  schema: {
    types: [
      defineType({
        name: 'article',
        title: 'Article',
        type: 'document',
        fields: [defineField({name: 'title', type: 'string'})],
      }),
    ],
  },
})
`,
  )
  writeFileSync(
    join(smokeRoot, 'sanity.cli.ts'),
    `import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {projectId: 'ppsg7ml5', dataset: 'production'},
})
`,
  )

  run('npm', ['install', '--loglevel=error'], smokeRoot)
  run('npm', ['run', 'build'], smokeRoot)
} finally {
  rmSync(smokeRoot, {force: true, recursive: true})
}
