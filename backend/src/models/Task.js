import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false }
  },
  { _id: true }
);

const collaboratorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true, lowercase: true },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending"
    },
    invitedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null }
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo"
    },
    reminderAt: { type: Date, default: null },
    reminderNotifiedAt: { type: Date, default: null },
    subtasks: { type: [subtaskSchema], default: [] },
    collaborators: { type: [collaboratorSchema], default: [] }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

export const Task = mongoose.model("Task", taskSchema);
