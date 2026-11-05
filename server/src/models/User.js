import mongoose from 'mongoose';

const SavedBoardSnapshotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    roomId: { type: String, required: true },
    title: { type: String, default: 'Saved Board Snapshot' },
    elements: { type: Array, default: [] },
    thumbnail: { type: String, default: '' },
    savedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    password: {
      type: String,
      required: true
    },
    savedBoards: [SavedBoardSnapshotSchema]
  },
  {
    timestamps: true
  }
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
