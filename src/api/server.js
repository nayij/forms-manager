import path from 'path'

import hapi from '@hapi/hapi'

import { config } from '~/src/config/index.js'
import { prepareDb } from '~/src/db.js'
import { failAction } from '~/src/helpers/fail-action.js'
import { logRequests } from '~/src/plugins/log-requests.js'
import { router } from '~/src/plugins/router.js'
import { transformErrors } from '~/src/plugins/transform-errors.js'
import { prepareSecureContext } from '~/src/secure-context.js'

const isProduction = config.get('isProduction')

/**
 * Creates the Hapi server
 */
export async function createServer() {
  const server = hapi.server({
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        },
        failAction
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    }
  })

  await server.register(logRequests)

  if (isProduction) {
    prepareSecureContext(server)
  }

  await prepareDb(server)
  await server.register(transformErrors)
  await server.register(router)

  return server
}
