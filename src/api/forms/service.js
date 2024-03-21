import { readFile } from 'node:fs/promises'

import { Schema } from '@defra/forms-model'

import {
  FormAlreadyExistsError,
  InvalidFormDefinitionError,
  InvalidFormMetadataError
} from './errors.js'
import {
  createFormDefinition,
  getFormDefinition as getFormDefinitionFromRepository
} from './form-definition-repository.js'
import {
  createFormMetadata,
  listForms as listFormMetadataEntries,
  exists as formMetadataExists,
  getFormMetadata
} from './form-metadata-repository.js'

/**
 * Adds an empty form
 * @param {FormConfigurationInput} formConfigurationInput - the desired form configuration to save
 * @returns {Promise<FormConfiguration>} - the saved form configuration
 */
export async function createForm(formConfigurationInput) {
  const emptyForm = await retrieveEmptyForm()
  const formId = formTitleToId(formConfigurationInput.title)

  if (await formMetadataExists(formId)) {
    throw new FormAlreadyExistsError(formId)
  }

  const formConfiguration = { ...formConfigurationInput, id: formId }
  const shallowCloneForm = { ...emptyForm, name: formConfiguration.title }

  const validationResult = Schema.validate(shallowCloneForm)
  if (validationResult.error) {
    throw new InvalidFormDefinitionError(validationResult.error.toString())
  }

  try {
    await createFormDefinition(formConfiguration, shallowCloneForm)
    await createFormMetadata(formConfiguration)
    return formConfiguration
  } catch (error) {
    // @ts-expect-error it's an error
    throw new InvalidFormMetadataError(error)
  }
}

/**
 * Lists the available forms
 * @returns {Promise<FormConfiguration[]>} - form configuration
 */
export async function listForms() {
  return listFormMetadataEntries()
}

/**
 * Retrieves a form configuration
 * @param {string} formId - ID of the form
 * @returns {Promise<FormConfiguration>} - form configuration
 */
export async function getForm(formId) {
  return getFormMetadata(formId)
}

/**
 * Retrieves the form definition for a given form ID
 * @param {string} formId - the ID of the form
 * @returns {Promise<string>} - form definition JSON content
 */
export async function getFormDefinition(formId) {
  return getFormDefinitionFromRepository(formId)
}

/**
 * Given a form title, returns the ID of the form.
 * E.g. "Hello - world" -> "hello-world".
 * @param {string} formTitle - title of the form
 * @returns {string} - ID of the form
 */
function formTitleToId(formTitle) {
  return formTitle
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '') // remove any non-alphanumeric characters
    .replace(/\s+/g, ' ') // replace any whitespaces with a single space
    .replace(/ /g, '-') // replace any spaces with a hyphen
}

/**
 * Retrieves the empty form configuration
 * @returns {Promise<object>} - the empty form configuration
 */
async function retrieveEmptyForm() {
  const fileContent = await readFile(
    new URL('./empty-form.json', import.meta.url).pathname,
    'utf-8'
  )

  try {
    const emptyForm = JSON.parse(fileContent)

    const validationResult = Schema.validate(emptyForm)

    if (validationResult.error) {
      throw new InvalidFormDefinitionError(
        'Invalid form schema provided. Please check the empty-form.json file.'
      )
    }

    return emptyForm
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new InvalidFormDefinitionError(
        'Failed to parse empty-form.json as JSON. Please validate contents.'
      )
    }

    throw error
  }
}

/**
 * @typedef {import('../types.js').FormConfiguration} FormConfiguration
 * @typedef {import('../types.js').FormConfigurationInput} FormConfigurationInput
 */
