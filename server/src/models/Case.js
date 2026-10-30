import mongoose from 'mongoose';

const signalSchema = new mongoose.Schema(
  {
    label: String,
    severity: { type: String, enum: ['low', 'medium', 'high'] },
    direction: { type: String, enum: ['authentic', 'suspicious'] },
    detail: String,
  },
  { _id: false }
);

const moduleSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video', 'text', 'profile'], required: true },
  score: { type: Number, min: 0, max: 100, required: true }, // 100 = looks authentic
  confidence: { type: Number, min: 0, max: 1, required: true },
  summary: String,
  signals: [signalSchema],
  metrics: mongoose.Schema.Types.Mixed, // OpenCV measurements for media modules
  inputNote: String, // e.g. "3 images", "6 video frames" (raw media is never stored)
  createdAt: { type: Date, default: Date.now },
});

const caseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    subject: { type: String, trim: true, maxlength: 200 },
    modules: [moduleSchema],
    trustScore: { type: Number, default: null },
    verdict: { type: String, default: 'Pending' },
    explanation: [String],
  },
  { timestamps: true }
);

export default mongoose.model('Case', caseSchema);
