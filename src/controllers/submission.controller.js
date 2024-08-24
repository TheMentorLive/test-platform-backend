import { Submission } from '../models/submission.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createSubmission = asyncHandler(async (req, res, next) => {
    const { testId, answers } = req.body;
    const userId = req.user._id;

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
        return res
        .status(201)
        .json(new ApiResponse(201,{submissionId : submission._id}, "Submission created successfully"));
});

const getSubmissionsForUser = asyncHandler(async (req, res, next) => {
    const userId = req.user._id; // Assuming the user ID is available in req.user
  
    // Find all submissions for the given userId and populate the test details
    const submissions = await Submission.find({ userId })
      .populate('testId', 'title') // Populate testId with the test title
  
    if (submissions.length === 0) {
      return res
      .status(200)
      .json(new ApiResponse(200, [], "No submissions found for the user"));
    }
  
    // Transform the submissions to include only the submission ID, test ID, and test name
    const submissionsWithDetails = submissions.map(submission => ({
      submissionId: submission._id,
      testId: submission.testId._id, // Include test ID
      testName: submission.testId.title, // Include test name
    }));
  
    return res
    .status(200)
    .json(new ApiResponse(200, submissionsWithDetails, "Submissions retrieved successfully"));
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
    getSubmissionsForUser,
    getSubmission
}