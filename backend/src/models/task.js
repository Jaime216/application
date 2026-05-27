const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Task (Tarea) schema
 * - subject: referencia obligatoria a Subject (ObjectId)
 * - dueDate: fecha de entrega (required)
 * - status: 'pendiente' | 'en_progreso' | 'entregada'
 * - isProject: boolean para diferenciar entregas grandes
 */
const STATUS = ['pendiente', 'en_progreso', 'en progreso', 'entregada'];

const TaskSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: STATUS, default: 'pendiente' },
  isProject: { type: Boolean, default: false },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
