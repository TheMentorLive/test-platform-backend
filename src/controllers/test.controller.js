import { Test } from '../models/test.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const createTest = asyncHandler(async (req, res, next) => {
    const { title, questions, type, description, isPaid , price } = req.body;

    if(!title || !questions || !type || !description || isPaid === undefined) {
        return next(new ApiError(400, "Please provide all required fields"));   
    }

    const createdBy = req.user._id;

    const test = Test.create({
        title,
        description,
        questions,
        type,
        isPaid,
        price,
        createdBy
    });

    if(!test) {
        return next(new ApiError(400, "Test could not be created"));
    }

    return res
    .status(201)
    .json(new ApiResponse(201, test, "Test created successfully"));
});

const getAllTests = asyncHandler(async (req, res, next) => {
        // Aggregation pipeline
        const tests = await Test.aggregate([
            {
                $lookup: {
                    from: 'questionbanks', // Ensure this matches the actual collection name
                    localField: 'questions',
                    foreignField: '_id',
                    as: 'questionsDetails'
                }
            },
            {
                $addFields: {
                    numberOfQuestions: { $size: '$questionsDetails' } // Count the number of questions
                }
            },
            {
                $project: {
                    title: 1,
                    type: 1,
                    description: 1,
                    isPaid: 1,
                    price: 1,
                    numberOfQuestions: 1,
                    createdBy: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        if (!tests || tests.length === 0) {
            return next(new ApiError(404, "No tests found"));
        }

        return res
            .status(200)
            .json(new ApiResponse(200, tests, "Tests Fetched Successfully"));
});


const getNEETTests = asyncHandler(async (req, res, next) => {
    const tests = await Test.find({ type: "NEET" });
    if(!tests) {
        return next(new ApiError(404, "No tests found"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tests, "Tests Fecthed Successfully"));
});

const getJEETests = asyncHandler(async (req, res, next) => {
    const tests = await Test.find({ type: "JEE" });
    if(!tests) {
        return next(new ApiError(404, "No tests found"));
    }
    return res
    .status(200)
    .json(new ApiResponse(200, tests, "Tests Fecthed Successfully"));
});

const getTest = asyncHandler(async (req, res, next) => {
    const testId = req.params.id;

    if (!testId) {
        return next(new ApiError(400, "Please provide a test ID"));
    }

    // Fetch the test by its ID and populate the questions and options
    const test = await Test.findById(testId)
    .populate({
      path: 'questions',
      model: 'QuestionBank' // Populate only the questions without the createdBy field
    });
    
    if (!test) {
        return next(new ApiError(404, "Test not found"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, test, "Test fetched successfully"));
});

const deleteTest = asyncHandler(async (req, res, next) => {
    const testId = req.params.id;
    if (!testId) {
        return next(new ApiError(400, "Please provide a test ID"));
    }

    // Find and delete the test
    const test = await Test.findByIdAndDelete(testId);

    if (!test) {
        return next(new ApiError(404, "Test not found"));
    }

    // Delete related submissions
    await Submission.deleteMany({ testId });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Test and related submissions deleted successfully"));
});

export { 
    createTest,
    getAllTests,
    getTest,
    getNEETTests,
    getJEETests,
    deleteTest
};



