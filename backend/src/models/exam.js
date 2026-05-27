const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Exam (Examen) schema
 * - subject: referencia obligatoria a Subject (ObjectId)
 * - date: fecha del examen
 * - maxScore: nota máxima posible (required, >= 0)
 * - score: nota obtenida (>= 0, <= maxScore si maxScore definido)
 */
const ExamSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: Date, required: true },
  maxScore: { type: Number, required: true, min: 0 },
  score: {
    type: Number,
    min: 0,
    validate: {
      validator: function (v) {
        // allow null/undefined for score (not yet graded)
        if (v === null || v === undefined) return true;
        if (this.maxScore === undefined || this.maxScore === null) return v >= 0;
        return v >= 0 && v <= this.maxScore;
      },
      message: (props) => `score inválida (${props.value}) para maxScore configurada`,
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('Exam', ExamSchema);
