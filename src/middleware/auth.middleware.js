import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

const authenticateUser = async(req, res, next) => {
  try {
    // Get the token from cookies or headers
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
     throw new ApiError(401, "No token provided. Please log in.");
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, "Invalid token. User not found.");
    }

    // Attach the user to the request object
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid token. Please log in again.");
  }
};

export { authenticateUser };
