import { readFile } from 'node:fs/promises'

import {
  FailedCreationOperationError,
  FormAlreadyExistsError,
  InvalidFormDefinitionError
} from '~/src/api/forms/errors.js'
import { create as formDefinitionCreate } from '~/src/api/forms/form-definition-repository.js'
import {
  exists as formMetadataExists,
  create as formMetadataCreate
} from '~/src/api/forms/form-metadata-repository.js'
import { createForm } from '~/src/api/forms/service.js'

jest.mock('node:fs/promises')
jest.mock('~/src/api/forms/form-definition-repository.js')
jest.mock('~/src/api/forms/form-metadata-repository.js')

beforeEach(() => {
  jest.resetAllMocks()
})

/**
 * Creates a new test form
 * @param {FormConfigurationInput} formConfigurationInput - the input request
 * @returns {Promise<FormConfiguration>} - the output form
 */
async function runFormCreationTest(formConfigurationInput) {
  jest.mocked(formMetadataExists).mockResolvedValueOnce(false)
  jest.mocked(formMetadataCreate).mockResolvedValueOnce(Promise.resolve())
  // @ts-expect-error unused response type so ignore type for now
  jest.mocked(formDefinitionCreate).mockResolvedValueOnce(Promise.resolve())

  return createForm(formConfigurationInput)
}

describe('createForm', () => {
  test('should create a new form', async () => {
    const formDefinitionBuffer = Buffer.from(
      JSON.stringify(getValidFormDefinition()),
      'utf-8'
    )

    jest.mocked(readFile).mockResolvedValueOnce(formDefinitionBuffer)

    const formConfigurationInput = {
      title: 'My Form',
      organisation: '',
      teamName: '',
      teamEmail: ''
    }

    const expectedFormConfigurationOutput = {
      id: 'my-form',
      title: 'My Form',
      organisation: '',
      teamName: '',
      teamEmail: ''
    }

    const result = await runFormCreationTest(formConfigurationInput)

    expect(result).toEqual(expectedFormConfigurationOutput)
  })

  test('should create a new form without special characters in the name', async () => {
    const formDefinitionBuffer = Buffer.from(
      JSON.stringify(getValidFormDefinition()),
      'utf-8'
    )

    jest.mocked(readFile).mockResolvedValueOnce(formDefinitionBuffer)

    const formConfigurationInput = {
      title: 'A !Super! Duper Form -    from Defra...',
      organisation: '',
      teamName: '',
      teamEmail: ''
    }

    const expectedFormConfigurationOutput = {
      id: 'a-super-duper-form-from-defra',
      title: 'A !Super! Duper Form -    from Defra...',
      organisation: '',
      teamName: '',
      teamEmail: ''
    }

    const result = await runFormCreationTest(formConfigurationInput)

    expect(result).toEqual(expectedFormConfigurationOutput)
  })

  it('should throw an error if form with the same ID already exists', async () => {
    const formDefinitionBuffer = Buffer.from(
      JSON.stringify(getValidFormDefinition()),
      'utf-8'
    )

    jest.mocked(formMetadataExists).mockResolvedValueOnce(true)
    jest.mocked(formMetadataCreate).mockResolvedValueOnce(Promise.resolve())
    // @ts-expect-error unused response type so ignore type for now
    jest.mocked(formDefinitionCreate).mockResolvedValueOnce(Promise.resolve())
    jest.mocked(readFile).mockResolvedValueOnce(formDefinitionBuffer)

    const formConfiguration = {
      title: 'My Form',
      organisation: '',
      teamName: '',
      teamEmail: ''
    }

    await expect(createForm(formConfiguration)).rejects.toThrow(
      FormAlreadyExistsError
    )
  })

  it('should throw an error when schema validation fails', async () => {
    const formDefinitionBuffer = Buffer.from(
      JSON.stringify(getInvalidFormDefinition()),
      'utf-8'
    )

    jest.mocked(formMetadataExists).mockResolvedValueOnce(false)
    jest.mocked(formMetadataCreate).mockResolvedValueOnce(Promise.resolve())
    // @ts-expect-error unused response type so ignore type for now
    jest.mocked(formDefinitionCreate).mockResolvedValueOnce(Promise.resolve())
    jest.mocked(readFile).mockResolvedValueOnce(formDefinitionBuffer)

    const formConfiguration = {
      title: 'My Form',
      organisation: '',
      teamName: '',
      teamEmail: ''
    }

    await expect(createForm(formConfiguration)).rejects.toThrow(
      InvalidFormDefinitionError
    )
  })

  it('should throw an error when writing for metadata fails', async () => {
    const formDefinitionBuffer = Buffer.from(
      JSON.stringify(getValidFormDefinition()),
      'utf-8'
    )

    jest.mocked(formMetadataExists).mockResolvedValueOnce(false)
    jest.mocked(readFile).mockResolvedValueOnce(formDefinitionBuffer)
    jest.mocked(formMetadataCreate).mockImplementation(() => {
      throw new Error()
    })
    // @ts-expect-error unused response type so ignore type for now
    jest.mocked(formDefinitionCreate).mockResolvedValueOnce(Promise.resolve())

    const formConfiguration = {
      title: 'My Form',
      organisation: '',
      teamName: '',
      teamEmail: ''
    }

    await expect(createForm(formConfiguration)).rejects.toThrow(
      FailedCreationOperationError
    )
  })

  it('should throw an error when writing form def fails', async () => {
    const formDefinitionBuffer = Buffer.from(
      JSON.stringify(getValidFormDefinition()),
      'utf-8'
    )

    jest.mocked(formMetadataExists).mockResolvedValueOnce(false)
    jest.mocked(readFile).mockResolvedValueOnce(formDefinitionBuffer)
    jest.mocked(formDefinitionCreate).mockImplementation(() => {
      throw new Error()
    })

    const formConfiguration = {
      title: 'My Form',
      organisation: '',
      teamName: '',
      teamEmail: ''
    }

    await expect(createForm(formConfiguration)).rejects.toThrow(
      FailedCreationOperationError
    )
  })
})

/**
 * Returns a form definition that is valid
 * @returns {FormDefinition} - the valid form definition
 */
function getValidFormDefinition() {
  return {
    name: '',
    startPage: '/page-one',
    pages: [
      {
        path: '/page-one',
        title: 'Page one',
        components: [
          {
            type: 'TextField',
            name: 'textField',
            title: 'This is your first field',
            hint: 'Help text',
            options: {},
            schema: {}
          }
        ]
      }
    ],
    conditions: [],
    sections: [],
    lists: []
  }
}

/**
 * Returns a form definition that is not valid
 * @returns {Partial<FormDefinition>} - the invalid form definition
 */
function getInvalidFormDefinition() {
  return {
    name: ''
  }
}

/**
 * @typedef {import('../types.js').FormConfiguration} FormConfiguration
 * @typedef {import('../types.js').FormConfigurationInput} FormConfigurationInput
 * @typedef {import('@defra/forms-model').FormDefinition} FormDefinition
 */
