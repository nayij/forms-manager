import { join } from 'node:path'

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  CopyObjectCommand
} from '@aws-sdk/client-s3'

import { FailedToReadFormError } from '~/src/api/forms/errors.js'
import { config } from '~/src/config/index.js'

const s3Region = config.get('s3Region')
const formBucketName = config.get('formDefinitionBucketName')

/**
 * Gets the path to a form definition file for a given form ID
 * @param {string} formId - the form ID
 * @param {'draft'|'live'} state - the form state
 */
function getFormDefinitionFilename(formId, state = 'draft') {
  const formDirectory = config.get('formDirectory')

  return join(formDirectory, state, `${formId}.json`)
}

/**
 * Adds a form to the Form Store
 * @param {string} id - id
 * @param {FormDefinition} formDefinition - form definition (JSON object)
 */
export async function create(id, formDefinition) {
  const formDefinitionFilename = getFormDefinitionFilename(id)

  // Convert form definition to JSON string
  const formDefinitionString = JSON.stringify(formDefinition)

  // Write formDefinition to file
  await uploadToS3(formDefinitionFilename, formDefinitionString)
}

/**
 * Copy the draft form to live in the Form Store
 * @param {string} id - id
 */
export async function createLiveFromDraft(id) {
  const draftDefinitionFilename = getFormDefinitionFilename(id)
  const liveDefinitionFilename = getFormDefinitionFilename(id, 'live')

  // Copy draft definition to live
  await copyObject(draftDefinitionFilename, liveDefinitionFilename)
}

/**
 * Retrieves the form definition for a given form ID
 * @param {string} formId - the ID of the form
 */
export async function get(formId) {
  const filename = getFormDefinitionFilename(formId)
  const body = await retrieveFromS3(filename)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Allow JSON type 'any'
  return /** @type {FormDefinition} */ (JSON.parse(body))
}

/**
 * Uploads fileContent to an S3 bucket as filename
 * @param {string} filename - the file name to upload
 * @param {string} fileContent - the content to upload
 */
function uploadToS3(filename, fileContent) {
  const command = new PutObjectCommand({
    Bucket: formBucketName,
    Key: filename,
    Body: fileContent
  })

  return getS3Client().send(command)
}

/**
 * Copy an S3 object
 * @param {string} source - the source file key
 * @param {string} destination - the destination file key
 */
function copyObject(source, destination) {
  const command = new CopyObjectCommand({
    Bucket: formBucketName,
    Key: destination,
    CopySource: `${formBucketName}/${source}`
  })

  return getS3Client().send(command)
}

/**
 * Retrieves filename content from an S3 bucket
 * @param {string} filename - the file name to read`
 * @throws {FailedToReadFormError} - if the file does not exist or is empty
 */
async function retrieveFromS3(filename) {
  const command = new GetObjectCommand({
    Bucket: formBucketName,
    Key: filename
  })

  try {
    const response = await getS3Client().send(command)

    if (!response.Body) {
      throw new FailedToReadFormError('Form definition does exist but is empty')
    }

    return response.Body.transformToString()
  } catch (err) {
    if (err instanceof NoSuchKey) {
      throw new FailedToReadFormError('Form definition does not exist on disk')
    }

    throw err
  }
}

/**
 * Retrieves an S3 client instance
 */
function getS3Client() {
  return new S3Client({
    region: s3Region,
    ...(config.get('s3Endpoint') && {
      endpoint: config.get('s3Endpoint'),
      forcePathStyle: true
    })
  })
}

/**
 * @typedef {import('@defra/forms-model').FormDefinition} FormDefinition
 */
