import { Submission } from '../models/submission.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createSubmission = asyncHandler(async (req, res, next) => {
    const { testId, answers } = req.body;
    const userId = req.user._id;

    try {
        // Validate required fields
        if (!testId || !answers || !userId) {
            return next(new ApiError(400, "Please provide all required fields"));
        }

        // Validate ObjectIds
        if (!isValidObjectId(testId) || !isValidObjectId(userId)) {
            return next(new ApiError(400, "Invalid testId or userId"));
        }

        // Validate answers
        for (const answer of answers) {
            if (!isValidObjectId(answer.questionId)) {
                return next(new ApiError(400, `Invalid questionId: ${answer.questionId}`));
            }
            for (const optionId of answer.selectedOptionIds) {
                if (!isValidObjectId(optionId)) {
                    return next(new ApiError(400, `Invalid optionId: ${optionId} in questionId: ${answer.questionId}`));
                }
            }
        }

        // Create the submission
        const submission = await Submission.create({
            userId,
            testId,
            answers
        });

        if (!submission) {
            return next(new ApiError(500, "Submission could not be created"));
        }

        // Return success response
        return res.status(201).json(new ApiResponse(201, submission, "Submission created successfully"));

    } catch (error) {
        // Handle unexpected errors
        return next(new ApiError(500, "An unexpected error occurred"));
    }
});

const getAllSubmissions = asyncHandler(async (req, res, next) => {
    const submissions = await Submission.find();
    if(!submissions) {
        return next(new ApiError(404, "No submissions found"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200, submissions, "Submissions Fecthed Successfully"));
});

const getSubmission = asyncHandler(async (req, res, next) => {
    const submissionId = req.params.id;
    if(!submissionId) {
        return next(new ApiError(400, "Please provide a submissionID"))
    }
 
    const submission = await Submission.findById(submissionId);
    if(!submission) {
        return next(new ApiError(404, "Submission not found"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200, submission, "Submission Fecthed Successfully"));
});

export {
    createSubmission,
    getAllSubmissions,
    getSubmission
}