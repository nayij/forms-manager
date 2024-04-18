import {
  listForms,
  getForm,
  createForm,
  getFormDefinition
} from '~/src/api/forms/service.js'

/**
 * @satisfies {ServerRegisterPlugin}
 */
export const forms = {
  plugin: {
    name: 'forms',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/forms',
          handler() {
            return listForms()
          }
        },
        {
          method: 'GET',
          path: '/forms/{id}',
          /**
           * @param {RequestFormById} request
           */
          async handler(request) {
            return getForm(request.params.id)
          }
        },
        {
          method: 'POST',
          path: '/forms',
          /**
           * @param {RequestFormCreation} request
           */
          async handler(request) {
            const formConfiguration = await createForm(request.payload)

            return {
              id: formConfiguration.id,
              status: 'created'
            }
          }
        },
        {
          method: 'GET',
          path: '/forms/{id}/definition',
          /**
           * @param {RequestFormById} request
           */
          async handler(request) {
            return getFormDefinition(request.params.id)
          }
        }
      ])
    }
  }
}

/**
 * @typedef {import('../types.js').FormConfigurationInput} FormConfigurationInput
 * @typedef {import('../types.js').RequestFormById} RequestFormById
 * @typedef {import('../types.js').RequestFormCreation} RequestFormCreation
 * @typedef {import('@hapi/hapi').ServerRegisterPluginObject<void, void>} ServerRegisterPlugin
 */
