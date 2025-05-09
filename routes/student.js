var express = require('express');
var router = express.Router();
const studentModel = require('../models/student.modal');
const multer = require('multer');
const {body, validationResult} = require('express-validator');
const path = require('path');
const {unlink} = require('fs');

// thiết lập folder lưu image
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'public/images');
	},
	filename: (req, file, cb) => {
		cb(null, `img-${Date.now()}${path.extname(file.originalname)}`);
	},
});
const fileFilter = (req, file, cb) => {
	if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
		cb(null, true);
	} else {
		cb(new Error('Only .png, .jpg and .jpeg format allowed!'), false);
	}
};
const upload = multer({
	storage: storage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB = 5 * 1024 * 1024 bytes
		mimetypes: ['image/png', 'image/jpg', 'image/jpeg'],
	},
	fileFilter: fileFilter,
});

/* GET users listing. */
router.get('/', async (req, res) => {
	const students = await studentModel.find();
	return res.render('student/index', {students});
});

router.get('/create', (req, res) => {
	return res.render('student/create');
});
router.post(
	'/create',
	[
		upload.single('image'),
		body('name').notEmpty().withMessage('Name is required'),
		body('age').isInt({gt: 0}).withMessage('Age must be greater than 0'),
		body('email').isEmail().withMessage('Email is invalid'),
		body('bio').notEmpty().withMessage('Bio is required'),
		// body('image').isEmpty().withMessage('Image is required'),
	],
	async (req, res) => {
		const errors = validationResult(req);
		var {name, age, email, bio} = req.body;
		const photoUrl = req.file ? req.file.filename : '';
		// const student = {name, age, email, bio, photoUrl};
		// await studentModel.create(student);
		const student = new studentModel({name, age, email, bio, photoUrl});
		if (!errors.isEmpty()) {
			// return res.render(`student/update`, {errors: errors.errors, student});
			return res.render('student/create', {errors: errors.errors, student});
		}
		if (!req.file) {
			res.render('student/create', {errors: [{msg: 'Image is required', path: 'image'}]});
		}
		await student.save();
		return res.redirect('/student');
	}
);

router.get('/update/:id', async (req, res) => {
	const id = req.params.id;
	const student = await studentModel.findById(id);
	if (!student) return res.redirect('/student');
	return res.render('student/update', {student});
});
router.post(
	'/update/:id',
	[
		upload.single('image'),
		body('name').notEmpty().withMessage('Name is required'),
		body('age').isInt({gt: 0}).withMessage('Age must be greater than 0'),
		body('email').isEmail().withMessage('Email is invalid'),
		body('bio').notEmpty().withMessage('Bio is required'),
		// body('image').isEmpty().withMessage('Image is required'),
	],
	async (req, res) => {
		const id = req.params.id;
		const student = await studentModel.findById(id);
		const errors = validationResult(req);
		if (req.file) {
			unlink(`./public/images/${student.photoUrl}`, (err) => {});
			const photoUrl = req.file ? req.file.filename : '';
			student.photoUrl = photoUrl;
		}
		var {name, age, email, bio} = req.body;
		// const student = {name, age, email, bio, photoUrl};
		student.name = name;
		student.age = age;
		student.email = email;
		student.bio = bio;
		if (!errors.isEmpty()) {
			return res.render(`student/update`, {errors: errors.errors, student});
		}
		await student.save();
		return res.redirect('/student');
	}
);

router.get('/search', async (req, res) => {
	const students = await studentModel.find({name: {$regex: req.query.keyword}});
	// const students = await studentModel.find({name: `/^${req.query.keyword}/`});
	return res.render('student/index', {students});
});

router.get('/delete/:id', async (req, res) => {
	const id = req.params.id;
	const student = await studentModel.findById(id);
	if (!student) return res.redirect('/student');
	unlink(`./public/images/${student.photoUrl}`, (err) => {});
	await studentModel.findByIdAndDelete(id);
	return res.redirect('/student');
});

module.exports = router;
