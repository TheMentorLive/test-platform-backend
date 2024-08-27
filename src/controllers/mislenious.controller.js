import { GetInTouch } from "../models/getInTouch.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createGetInTouch = asyncHandler(async (req, res, next) => {
    const { fullName, email, message } = req.body;
    if (!fullName || !email) {
        return next(new ApiError(400, 'Please provide fullName and email'));
    }
    const getInTouch = await GetInTouch.create({
        fullName,
        email,
        message
    });
    return res
        .status(201)
        .json(new ApiResponse(201, getInTouch, "Message sent successfully"));
});

export { createGetInTouch }