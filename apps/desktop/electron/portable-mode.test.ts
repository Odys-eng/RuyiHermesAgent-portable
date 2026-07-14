import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'

import {
  applyPortableEnvironment,
  portableUpdateStatus,
  resolvePortableMode,
  shouldRegisterDeepLinkProtocol
} from './portable-mode'

test('portable mode is enabled only for an absolute Windows launcher directory', () => {
  assert.deepEqual(resolvePortableMode({ env: {}, platform: 'win32', pathModule: path.win32 }), { enabled: false })
  assert.deepEqual(
    resolvePortableMode({ env: { PORTABLE_EXECUTABLE_DIR: 'relative' }, platform: 'win32', pathModule: path.win32 }),
    { enabled: false }
  )
  assert.deepEqual(
    resolvePortableMode({ env: { PORTABLE_EXECUTABLE_DIR: 'D:\\Ruyi' }, platform: 'linux', pathModule: path.win32 }),
    { enabled: false }
  )
})

test('portable mode keeps desktop and Hermes state beside the launcher', () => {
  const mode = resolvePortableMode({
    env: { PORTABLE_EXECUTABLE_DIR: 'D:\\Tools\\RuyiHermesAgent' },
    platform: 'win32',
    pathModule: path.win32
  })

  assert.deepEqual(mode, {
    enabled: true,
    executableDir: 'D:\\Tools\\RuyiHermesAgent',
    dataDir: 'D:\\Tools\\RuyiHermesAgent\\data',
    hermesHome: 'D:\\Tools\\RuyiHermesAgent\\data\\hermes',
    userDataDir: 'D:\\Tools\\RuyiHermesAgent\\data\\RuyiHermesAgent'
  })
  assert.equal(shouldRegisterDeepLinkProtocol(mode), false)
})

test('portable forces HERMES_HOME to the adjacent data dir, overriding inherited values', () => {
  const mode = resolvePortableMode({
    env: { PORTABLE_EXECUTABLE_DIR: 'D:\\Tools' },
    platform: 'win32',
    pathModule: path.win32
  })
  const defaultEnv: NodeJS.ProcessEnv = {}
  // An inherited HERMES_HOME (from the process env or the Windows user-env
  // registry) must NOT divert a portable launch onto a global install — the
  // portable build is self-contained and always uses its own data dir.
  const inheritedEnv: NodeJS.ProcessEnv = { HERMES_HOME: 'E:\\HermesData' }

  applyPortableEnvironment(mode, defaultEnv)
  applyPortableEnvironment(mode, inheritedEnv)

  assert.equal(defaultEnv.HERMES_DESKTOP_PORTABLE, '1')
  assert.equal(defaultEnv.HERMES_HOME, 'D:\\Tools\\data\\hermes')
  assert.equal(inheritedEnv.HERMES_HOME, 'D:\\Tools\\data\\hermes')
})

test('portable builds direct updates to executable replacement', () => {
  const mode = resolvePortableMode({
    env: { PORTABLE_EXECUTABLE_DIR: 'D:\\Tools' },
    platform: 'win32',
    pathModule: path.win32
  })

  assert.deepEqual(portableUpdateStatus(mode, 123), {
    supported: false,
    reason: 'portable-build',
    message: 'Replace the portable executable to update. The adjacent data folder is preserved.',
    fetchedAt: 123
  })
  assert.equal(portableUpdateStatus({ enabled: false }), null)
})
