// middlewares/authValidator.js
const { body } = require("express-validator");

//  تحقق من صحة بيانات التسجيل المدخلة
const registerValidation = [
  body("username")
    .notEmpty().withMessage("Username is required")
    .isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("gender").isIn(["male", "female"]).withMessage("Gender must be male or female"),
    body("dateOfBirth").notEmpty().withMessage("Date of birth is required"),

];

// تحقق من صحة بيانات تسجيل الدخول
const loginValidation = [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email"),
  body("password")
    .notEmpty().withMessage("Password is required")
];

module.exports = { registerValidation, loginValidation };
