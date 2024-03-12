import fs from 'fs/promises'
import { listForms } from './form-metadata-repository'

const formDirectory = '/path/to/dummy/directory'

jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
  readFile: jest.fn()
}))

jest.mock('~/src/config', () => ({
  config: {
    get: jest.fn(() => formDirectory)
  }
}))

describe('#listForms', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Should return an empty array if no forms found', async () => {
    fs.readdir.mockResolvedValue([])

    const result = await listForms(formDirectory)

    expect(result).toEqual([])
  })

  test('Should return an array of form metadata', async () => {
    const files = ['form1-metadata.json', 'form2-metadata.json']
    const form1Metadata = '{ "id": "form1", "name": "Form 1" }'
    const form2Metadata = '{ "id": "form2", "name": "Form 2" }'

    fs.readFile.mockResolvedValue(form1Metadata)
    fs.readFile.mockResolvedValue(form2Metadata)

    fs.readdir.mockResolvedValue(files)
    fs.readFile.mockResolvedValueOnce(form1Metadata)
    fs.readFile.mockResolvedValueOnce(form2Metadata)

    const result = await listForms(formDirectory)

    expect(result).toEqual([
      JSON.parse(form1Metadata),
      JSON.parse(form2Metadata)
    ])
    expect(fs.readdir).toHaveBeenCalledWith(formDirectory)
    expect(fs.readFile).toHaveBeenCalledWith(
      formDirectory + '/form1-metadata.json'
    )
    expect(fs.readFile).toHaveBeenCalledWith(
      formDirectory + '/form2-metadata.json'
    )
  })

  test('Should ignore files without "-metadata.json" suffix', async () => {
    const files = ['form1-metadata.json', 'form2.json']

    fs.readdir.mockResolvedValue(files)
    fs.readFile.mockResolvedValue('{ "id": "form1", "name": "Form 1" }')

    const result = await listForms(formDirectory)

    expect(result).toEqual([{ id: 'form1', name: 'Form 1' }])
    expect(fs.readdir).toHaveBeenCalledWith(formDirectory)
    expect(fs.readFile).toHaveBeenCalledWith(
      formDirectory + '/form1-metadata.json'
    )
    expect(fs.readFile).not.toHaveBeenCalledWith(
      formDirectory + '/form2-metadata.json'
    )
  })
})
