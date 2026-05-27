const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Subject (Asignatura) schema
 * - name: nombre de la asignatura (required)
 * - color: color hex para UI (required, formato #rrggbb)
 * - teacher: nombre del profesor
 */
const SubjectSchema = new Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  color: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (v) => /^#([0-9A-Fa-f]{6})$/.test(v),
      message: (props) => `${props.value} no es un color HEX válido (#rrggbb)`,
    },
  },
  teacher: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);
