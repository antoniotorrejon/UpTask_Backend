import mongoose, { Schema, Document, Types } from "mongoose"

export interface Itoken extends Document{
    token: string
    user: Types.ObjectId
    createdAt: Date
}

const tokenSchema: Schema = new Schema({
    token: {
      type: String,
      required: true
    },
    user: {
      type: String,
      ref: 'User',
      required: true
    },
    expiresAt: {
      type: Date,
      default: () => Date.now() + 10 * 60 * 1000, // 10 minutos en el futuro
      expires: 0 // TTL de MongoDB, 0 porque ya calculas la expiración manualmente
    }
})

const Token = mongoose.model<Itoken>('Token', tokenSchema)

export default Token