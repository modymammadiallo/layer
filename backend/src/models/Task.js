import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false }
  },
  { _id: true }
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
    subtasks: { type: [subtaskSchema], default: [] }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

export const Task = mongoose.model("Task", taskSchema);
