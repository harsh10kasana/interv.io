const auth = require('../config/firebase');
const User = require('../models/user.model'); // No need for .js extension with require()

const googleAuth = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];

    const decodedToken = await auth.verifyIdToken(token);
    
    const { email, name } = decodedToken;

    let user = await User.findOne({ email });
    
    if (!user) {
      user = await User.create({ name, email });
    }

    res.status(200).json({ message: "Authenticated successfully", user });

  } catch (error) {
    console.error("Auth Error:", error); 

    res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = {
  googleAuth
};