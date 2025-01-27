/* eslint-env jest */

import {
  userConfig,
  userConfigClientSide,
  userConfigServerSide,
  setUpTest,
  tearDownTest,
} from './test-helpers'
import { localeSubpathOptions } from '../../src/config/default-config'

let mockIsNode

describe('create configuration in non-production environment', () => {
  let createConfig
  let evalFunc
  let pwd

  beforeEach(() => {
    ({ evalFunc, pwd } = setUpTest())
  })

  afterEach(() => {
    tearDownTest(evalFunc, pwd)
  })

  const mockIsNodeCreateConfig = (isNode) => {
    mockIsNode = isNode

    jest.resetModules()
    jest.mock('detect-node', () => mockIsNode)

    return require('../../src/config/create-config')
  }

  it('throws if userConfig.localeSubpaths is a boolean', () => {
    createConfig = mockIsNodeCreateConfig(true)

    expect(() => createConfig({ localeSubpaths: true })).toThrow(
      'The localeSubpaths option has been changed to a string: "none", "foreign", or "all"',
    )
  })

  it('throws if defaultNS does not exist', () => {
    createConfig = mockIsNodeCreateConfig(true)
    evalFunc.mockImplementation(() => ({
      readdirSync: jest.fn().mockImplementation(() => ['universal', 'file1', 'file2']),
      existsSync: jest.fn().mockImplementation(() => false),
    }))

    expect(() => createConfig({ localeSubpaths: 'all' })).toThrow(
      'Default namespace not found at /home/user/static/locales/en/common.json',
    )
  })

  describe('server-side', () => {
    beforeEach(() => {
      createConfig = mockIsNodeCreateConfig(true)
    })

    afterEach(() => {
      createConfig = undefined
    })

    it('creates default non-production configuration', () => {
      const config = createConfig({})

      expect(config.defaultLanguage).toEqual('en')
      expect(config.otherLanguages).toEqual([])
      expect(config.fallbackLng).toEqual(false)
      expect(config.load).toEqual('currentOnly')
      expect(config.localePath).toEqual('static/locales')
      expect(config.localeStructure).toEqual('{{lng}}/{{ns}}')
      expect(config.localeSubpaths).toEqual(localeSubpathOptions.NONE)
      expect(config.use).toEqual([])
      expect(config.defaultNS).toEqual('common')

      expect(config.interpolation.escapeValue).toEqual(false)
      expect(config.interpolation.formatSeparator).toEqual(',')
      expect(config.interpolation.format('format me', 'uppercase')).toEqual('FORMAT ME')
      expect(config.interpolation.format('format me')).toEqual('format me')

      expect(config.browserLanguageDetection).toEqual(true)

      expect(config.detection.order).toEqual(['cookie', 'header', 'querystring'])
      expect(config.detection.caches).toEqual(['cookie'])

      expect(config.react.wait).toEqual(true)

      expect(config.preload).toEqual(['en'])

      expect(config.ns).toEqual(['common', 'file1', 'file2'])

      expect(config.backend.loadPath).toEqual('/home/user/static/locales/{{lng}}/{{ns}}.json')
      expect(config.backend.addPath).toEqual('/home/user/static/locales/{{lng}}/{{ns}}.missing.json')
    })

    it('creates custom non-production configuration', () => {
      evalFunc.mockImplementation(() => ({
        readdirSync: jest.fn().mockImplementation(() => ['universal', 'file1', 'file2']),
        existsSync: jest.fn().mockImplementation(() => true),
      }))

      const config = createConfig(userConfigServerSide)

      expect(config.defaultLanguage).toEqual('de')
      expect(config.otherLanguages).toEqual(['fr', 'it'])
      expect(config.fallbackLng).toEqual('it')
      expect(config.load).toEqual('currentOnly')
      expect(config.localePath).toEqual('static/translations')
      expect(config.localeStructure).toEqual('{{ns}}/{{lng}}')
      expect(config.localeSubpaths).toEqual(localeSubpathOptions.FOREIGN)
      expect(config.defaultNS).toEqual('universal')
      expect(config.browserLanguageDetection).toEqual(false)
      expect(config.preload).toEqual(['fr', 'it', 'de'])

      expect(config.ns).toEqual(['universal', 'file1', 'file2'])

      expect(config.backend.loadPath).toEqual('/home/user/static/translations/{{ns}}/{{lng}}.json')
      expect(config.backend.addPath).toEqual('/home/user/static/translations/{{ns}}/{{lng}}.missing.json')
    })

    it('preserves config.ns, if provided in user configuration', () => {
      const mockReadDirSync = jest.fn()
      evalFunc.mockImplementation(() => ({
        readdirSync: mockReadDirSync,
        existsSync: jest.fn().mockImplementation(() => true),
      }))
      const config = createConfig({ ns: ['common', 'ns1', 'ns2'] })

      expect(mockReadDirSync).not.toBeCalled()
      expect(config.ns).toEqual(['common', 'ns1', 'ns2'])
    })

    describe('localeExtension config option', () => {
      it('is set to JSON by default', () => {
        const config = createConfig(userConfig)
        expect(config.backend.loadPath).toEqual('/home/user/static/translations/{{ns}}/{{lng}}.json')
        expect(config.backend.addPath).toEqual('/home/user/static/translations/{{ns}}/{{lng}}.missing.json')
      })
      it('accepts any string and modifies backend paths', () => {
        const config = createConfig({
          ...userConfig,
          localeExtension: 'test-extension',
        })
        expect(config.backend.loadPath).toEqual('/home/user/static/translations/{{ns}}/{{lng}}.test-extension')
        expect(config.backend.addPath).toEqual('/home/user/static/translations/{{ns}}/{{lng}}.missing.test-extension')
      })
    })
  })

  const runClientSideTests = () => {
    it('creates default non-production configuration if process.browser === true', () => {
      const config = createConfig({})

      expect(config.defaultLanguage).toEqual('en')
      expect(config.otherLanguages).toEqual([])
      expect(config.fallbackLng).toEqual(false)
      expect(config.load).toEqual('currentOnly')
      expect(config.localePath).toEqual('static/locales')
      expect(config.localeStructure).toEqual('{{lng}}/{{ns}}')
      expect(config.localeSubpaths).toEqual(localeSubpathOptions.NONE)
      expect(config.use).toEqual([])
      expect(config.defaultNS).toEqual('common')

      expect(config.interpolation.escapeValue).toEqual(false)
      expect(config.interpolation.formatSeparator).toEqual(',')
      expect(config.interpolation.format('format me', 'uppercase')).toEqual('FORMAT ME')
      expect(config.interpolation.format('format me')).toEqual('format me')

      expect(config.browserLanguageDetection).toEqual(true)

      expect(config.detection.order).toEqual(['cookie', 'header', 'querystring'])
      expect(config.detection.caches).toEqual(['cookie'])

      expect(config.react.wait).toEqual(true)

      expect(config.preload).toBeUndefined()

      expect(config.ns).toEqual(['common'])

      expect(config.backend.loadPath).toEqual('/static/locales/{{lng}}/{{ns}}.json')
      expect(config.backend.addPath).toEqual('/static/locales/{{lng}}/{{ns}}.missing.json')
    })

    it('creates custom client-side non-production configuration', () => {
      const config = createConfig(userConfigClientSide)

      expect(config.defaultLanguage).toEqual('de')
      expect(config.otherLanguages).toEqual(['fr', 'it'])
      expect(config.fallbackLng).toEqual('it')
      expect(config.load).toEqual('currentOnly')
      expect(config.localePath).toEqual('static/translations')
      expect(config.localeStructure).toEqual('{{ns}}/{{lng}}')
      expect(config.localeSubpaths).toEqual(localeSubpathOptions.FOREIGN)
      expect(config.defaultNS).toEqual('universal')
      expect(config.browserLanguageDetection).toEqual(false)

      expect(config.ns).toEqual(['universal'])

      expect(config.backend.loadPath).toEqual('/static/translations/{{ns}}/{{lng}}.json')
      expect(config.backend.addPath).toEqual('/static/translations/{{ns}}/{{lng}}.missing.json')
    })

    describe('localeExtension config option', () => {
      it('is set to JSON by default', () => {
        const config = createConfig(userConfig)
        expect(config.backend.loadPath).toEqual('/static/translations/{{ns}}/{{lng}}.json')
        expect(config.backend.addPath).toEqual('/static/translations/{{ns}}/{{lng}}.missing.json')
      })
      it('accepts any string and modifies backend paths', () => {
        const config = createConfig({
          ...userConfig,
          localeExtension: 'test-extension',
        })
        expect(config.backend.loadPath).toEqual('/static/translations/{{ns}}/{{lng}}.test-extension')
        expect(config.backend.addPath).toEqual('/static/translations/{{ns}}/{{lng}}.missing.test-extension')
      })
    })
  }

  // there are two definitions of being client side
  // 1. isNode is falsy; or
  // 2. isNode is truthy and process.browser is truthy
  describe('client-side (isNode is falsy)', () => {
    beforeEach(() => {
      delete process.browser
      createConfig = mockIsNodeCreateConfig(false)
    })

    afterEach(() => {
      createConfig = undefined
    })

    runClientSideTests()
  })

  describe('client-side (isNode is truthy and process.browser is truthy)', () => {
    beforeEach(() => {
      process.browser = true
      createConfig = mockIsNodeCreateConfig(true)
    })

    afterEach(() => {
      createConfig = undefined
      delete process.browser
    })

    runClientSideTests()
  })

  describe('https://github.com/isaachinman/next-i18next/issues/134', () => {
    describe('if user specifies a default language and not a fallbackLng', () => {
      let userConfigDeNoFallback

      beforeEach(() => {
        userConfigDeNoFallback = { ...userConfigClientSide, defaultLanguage: 'de' }
        delete userConfigDeNoFallback.fallbackLng
      })

      it('fallbackLng === false in development', () => {
        createConfig = mockIsNodeCreateConfig(true)

        const config = createConfig(userConfigDeNoFallback)

        expect(config.fallbackLng).toEqual(false)
      })

      it('fallbackLng === user-specified default language in production', () => {
        process.env.NODE_ENV = 'production'
        createConfig = mockIsNodeCreateConfig(true)

        const config = createConfig(userConfigDeNoFallback)

        expect(config.fallbackLng).toEqual('de')

        delete process.env.NODE_ENV
      })
    })
  })
})
