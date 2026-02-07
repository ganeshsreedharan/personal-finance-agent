import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { ATTACHMENT_SOURCE } from '../../config/constants.js';

/**
 * Attachment Zod schema for validation
 */
export const AttachmentSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.string().min(1, 'User ID is required'),
  transactionId: z.instanceof(ObjectId).optional(),
  filename: z.string().min(1, 'Filename is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().positive('Size must be positive'),
  gridFsId: z.instanceof(ObjectId),
  uploadedAt: z.date().default(() => new Date()),
  source: z.enum([
    ATTACHMENT_SOURCE.PHOTO,
    ATTACHMENT_SOURCE.PDF,
    ATTACHMENT_SOURCE.DOCUMENT,
  ]),
});

/**
 * TypeScript type inferred from schema
 */
export type Attachment = z.infer<typeof AttachmentSchema>;

/**
 * Input schema for creating attachments
 */
export const CreateAttachmentSchema = AttachmentSchema.omit({
  _id: true,
  uploadedAt: true,
});

export type CreateAttachmentInput = z.infer<typeof CreateAttachmentSchema>;

/**
 * Attachment document interface for MongoDB
 */
export interface AttachmentDocument {
  _id?: ObjectId;
  userId: string;
  transactionId?: ObjectId;
  filename: string;
  mimeType: string;
  size: number;
  gridFsId: ObjectId;
  uploadedAt: Date;
  source: string;
}

/**
 * Helper to convert Attachment to MongoDB document
 */
export const toAttachmentDocument = (attachment: Attachment): AttachmentDocument =>
  attachment as AttachmentDocument;

/**
 * Helper to parse MongoDB document to Attachment
 */
export const fromAttachmentDocument = (doc: AttachmentDocument): Attachment =>
  AttachmentSchema.parse(doc);
