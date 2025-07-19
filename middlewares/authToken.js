const jwt = require("jsonwebtoken");

// jwt لحماية المسارات باستخدام 
const authToken = (req, res, next) => {
  const token = req.cookies.token; 
  console.log("Token from cookie (authToken middleware):", token);

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("Token verified, user:", decoded);
    next();
  } catch (error) {
    console.log("Invalid token error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authToken;
