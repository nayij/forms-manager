import { ObjectId } from 'mongodb'

import { InvalidFormDefinitionError } from '~/src/api/forms/errors.js'
import { create as formDefinitionCreate } from '~/src/api/forms/form-definition-repository.js'
import { create as formMetadataCreate } from '~/src/api/forms/form-metadata-repository.js'
import { createForm } from '~/src/api/forms/service.js'
import * as formTemplates from '~/src/api/forms/templates.js'

jest.mock('~/src/api/forms/form-definition-repository.js')
jest.mock('~/src/api/forms/form-metadata-repository.js')
jest.mock('~/src/api/forms/templates.js')

const id = '661e4ca5039739ef2902b214'
const actualFormTemplates = jest.requireActual('~/src/api/forms/templates.js')
const mockFormMetadataImpl = (/** @type {FormConfigurationInput} */ input) => {
  const objId = new ObjectId(id)

  // Assign an _id property to the
  // input like the MongoClient would
  Object.assign(input, { _id: id })

  return Promise.resolve({
    acknowledged: true,
    insertedId: objId
  })
}

/**
 * Creates a new test form
 * @param {FormConfigurationInput} formConfigurationInput - the input request
 */
async function runFormCreationTest(formConfigurationInput) {
  jest
    .mocked(formTemplates.empty)
    .mockReturnValueOnce(actualFormTemplates.empty())
  jest.mocked(formMetadataCreate).mockImplementationOnce(mockFormMetadataImpl)
  jest.mocked(formDefinitionCreate).mockResolvedValueOnce()

  return createForm(formConfigurationInput)
}

describe('createForm', () => {
  test('should create a new form', async () => {
    const formConfigurationInput = {
      title: 'Test form',
      organisation: 'Defra',
      teamName: 'Defra Forms',
      teamEmail: 'defraforms@defra.gov.uk'
    }

    const expectedFormConfigurationOutput = {
      id,
      slug: 'test-form',
      title: 'Test form',
      organisation: 'Defra',
      teamName: 'Defra Forms',
      teamEmail: 'defraforms@defra.gov.uk'
    }

    const result = await runFormCreationTest(formConfigurationInput)

    expect(result).toEqual(expectedFormConfigurationOutput)
  })

  test('should create a new form without special characters in the name', async () => {
    const formConfigurationInput = {
      title: 'A !Super! Duper Form -    from Defra...',
      organisation: 'Defra',
      teamName: 'Defra Forms',
      teamEmail: 'defraforms@defra.gov.uk'
    }

    const expectedFormConfigurationOutput = {
      id,
      slug: 'a-super-duper-form-from-defra',
      title: 'A !Super! Duper Form -    from Defra...',
      organisation: 'Defra',
      teamName: 'Defra Forms',
      teamEmail: 'defraforms@defra.gov.uk'
    }

    const result = await runFormCreationTest(formConfigurationInput)

    expect(result).toEqual(expectedFormConfigurationOutput)
  })

  it('should throw an error when schema validation fails', async () => {
    // @ts-expect-error - Allow invalid form definition for test
    jest.mocked(formTemplates.empty).mockReturnValueOnce({})
    jest.mocked(formMetadataCreate).mockImplementationOnce(mockFormMetadataImpl)
    jest.mocked(formDefinitionCreate).mockResolvedValueOnce()

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
    jest.mocked(emptyForm).mockReturnValueOnce(actualFormTemplates.empty())
    jest.mocked(formMetadataCreate).mockRejectedValueOnce(new Error())
    jest.mocked(formDefinitionCreate).mockResolvedValueOnce()

    const formConfiguration = {
      title: 'My Form',
      organisation: '',
      teamName: '',
      teamEmail: ''
    }

    await expect(createForm(formConfiguration)).rejects.toThrow(Error)
  })

  it('should throw an error when writing form def fails', async () => {
    jest.mocked(emptyForm).mockReturnValueOnce(actualFormTemplates.empty())
    jest.mocked(formMetadataCreate).mockImplementationOnce(mockFormMetadataImpl)
    jest.mocked(formDefinitionCreate).mockRejectedValueOnce(new Error())

    const formConfiguration = {
      title: 'My Form',
      organisation: '',
      teamName: '',
      teamEmail: ''
    }

    await expect(createForm(formConfiguration)).rejects.toThrow(Error)
  })
})

/**
 * @typedef {import('../types.js').FormConfigurationInput} FormConfigurationInput
 */
