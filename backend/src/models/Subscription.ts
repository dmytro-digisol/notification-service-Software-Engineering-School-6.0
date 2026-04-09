import type { Document } from "mongoose";
import { model, Schema } from "mongoose";

export interface ISubscription extends Document {
  email: string;
  repo: string;
  confirmed: boolean;
  token: string;
  lastSeenTag: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    email: { type: String, required: true },
    repo: { type: String, required: true },
    confirmed: { type: Boolean, default: false },
    token: { type: String, required: true },
    lastSeenTag: { type: String, default: null },
  },
  { timestamps: true },
);

subscriptionSchema.index({ email: 1, repo: 1 }, { unique: true });

export const Subscription = model<ISubscription>(
  "Subscription",
  subscriptionSchema,
);
