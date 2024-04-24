import Joi from 'joi'

// Mongo id
export const idStringSchema = Joi.string().hex().length(24)

// Mongo id object
export const idObjectSchema = Joi.object().keys({
  id: Joi.any(),
  _bsontype: Joi.allow('ObjectId')
})

// Alternative Mongo id object
export const idSchema = Joi.alternatives(idStringSchema, idObjectSchema)

// Retrieve form by ID schema
export const formByIdSchema = Joi.object()
  .keys({
    id: idStringSchema
  })
  .required()

// Create form payload schema
export const createFormSchema = Joi.object()
  .keys({
    title: Joi.string().max(250).trim().required(),
    organisation: Joi.string().max(100).trim().required(),
    teamName: Joi.string().max(100).trim().required(),
    teamEmail: Joi.string().email().trim().required()
  })
  .required()
