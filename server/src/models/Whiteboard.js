import mongoose from 'mongoose';

const PointSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  { _id: false }
);

const ElementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['stroke', 'line', 'rectangle', 'circle', 'text', 'eraser', 'image']
    },
    // For freehand drawing & eraser:
    points: [PointSchema],
    // For geometric shapes:
    startX: { type: Number },
    startY: { type: Number },
    endX: { type: Number },
    endY: { type: Number },
    // For image tool:
    src: { type: String },
    width: { type: Number },
    height: { type: Number },
    // For text tool:
    text: { type: String, maxlength: 2000 },
    x: { type: Number },
    y: { type: Number },
    fontSize: { type: Number, default: 20 },
    // Common styles:
    color: { type: String, default: '#1e1b4b' },
    size: { type: Number, default: 3, min: 1, max: 80 },
    // Authorship & metadata:
    userId: { type: String },
    userName: { type: String, default: 'Anonymous' },
    timestamp: { type: Number, default: () => Date.now() }
  },
  { _id: false }
);

const WhiteboardSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 64,
      index: true
    },
    title: {
      type: String,
      default: 'Untitled Whiteboard',
      trim: true,
      maxlength: 100
    },
    elements: [ElementSchema],
    creatorSessionId: {
      type: String,
      default: ''
    },
    version: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

// Prevent re-compilation in development reloads
export const Whiteboard = mongoose.models.Whiteboard || mongoose.model('Whiteboard', WhiteboardSchema);
export default Whiteboard;
