const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
	name: {type: String, required: true},
	age: Number,
	email: String,
	bio: String,
	photoUrl: String,
	createdAt: {type: Date, default: Date.now},
});

module.exports = mongoose.model('students', studentSchema);
