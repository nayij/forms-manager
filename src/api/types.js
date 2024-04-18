/**
 * @typedef {object} FormConfiguration
 * @property {string} linkIdentifier - The human-readable slug id of the form
 * @property {string} title - The human-readable title of the form
 * @property {string} organisation - The organisation this form belongs to
 * @property {string} teamName - The name of the team who own this form
 * @property {string} teamEmail - The email of the team who own this form
 */

/**
 * @typedef {Request<{ Server: { db: import('mongodb').Db } }>} RequestDefaults
 * @typedef {RequestDefaults & Request<{ Params: { id: string } }>} RequestFormById
 * @typedef {RequestDefaults & Request<{ Payload: FormConfigurationInput }>} RequestFormCreation
 * @typedef {Omit<FormConfiguration, 'linkIdentifier'>} FormConfigurationInput
 */

/**
 * @template {import('@hapi/hapi').ReqRef} [ReqRef=import('@hapi/hapi').ReqRefDefaults]
 * @typedef {import('@hapi/hapi').Request<ReqRef>} Request
 */
