const auth = require('../config/firebase');
const User = require('../models/user.model');

const requireAuth= async (req,res,next)=>{
    try{
        const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return res.status(401).json({ error: 'No token provided' });
            }
            
            const token = authHeader.split('Bearer ')[1];
        
            const decodedToken = await auth.verifyIdToken(token);
            
            const { email, name } = decodedToken;
        
            let user = await User.findOne({ email });

            if (!user) {
      return res.status(404).json({ success: false, error: "User not found in database" });
    }
    req.user = {
      id: user._id, 
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
    next(); 
    

    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }

}
module.exports=requireAuth