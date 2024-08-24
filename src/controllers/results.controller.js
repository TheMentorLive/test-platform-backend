import mongoose from "mongoose";
import { Result } from "../models/results.model.js";
import { Submission } from "../models/submission.model.js";
import { Test } from "../models/test.model.js";
import { QuestionBank } from "../models/questionBank.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Calculate and create result for a submission
export const getResultBySubmission = asyncHandler(async (req, res, next) => {
  const { submissionId } = req.params;
  if (!submissionId) {
    throw new ApiError(400, "Submission ID is required");
  }

  // Check if the result already exists
  let result = await Result.findOne({ submissionId }).populate('submissionId');
  
  if (!result) {
    // If not found, calculate the result
    const submission = await Submission.findById(submissionId)
      .populate('testId')
      .populate({
        path: 'answers.questionId',
        populate: {
          path: 'options'
        }
      });

    if (!submission) {
      throw new ApiError(404, "Submission not found");
    }

    const test = submission.testId;
    const totalQuestions = test.questions.length;

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let skippedQuestions = 0;
    let score = 0;
    const maxScore = totalQuestions; // Assuming 1 point per question

    submission.answers.forEach((answer) => {
      const question = answer.questionId;

      if (answer.selectedOptionIds.length === 0) {
        skippedQuestions += 1;
      } else {
        const correctOptions = question.options.filter(option => option.isCorrect).map(option => option._id.toString());
        const selectedOptions = answer.selectedOptionIds.map(optionId => optionId.toString());

        if (correctOptions.sort().join(',') === selectedOptions.sort().join(',')) {
          correctAnswers += 1;
          score += 1; // Assuming 1 point per correct question
        } else {
          incorrectAnswers += 1;
        }
      }
    });

    const accuracy = (correctAnswers / (totalQuestions - skippedQuestions)) * 100;
    const percentage = (score / maxScore) * 100;
    const passed = percentage >= 40; // Example: passing threshold is 40%

    result = new Result({
      submissionId: submission._id,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      skippedQuestions,
      accuracy,
      score,
      maxScore,
      percentage,
      passed,
    });

    await result.save();
  }

  return res.status(200).json(new ApiResponse(200, result, "Result retrieved successfully"));
});



// Get result by ID
export const getResult = asyncHandler(async (req, res, next) => {
  const { resultId } = req.params;

  if (!resultId) {
    throw new ApiError(400, "Result ID is required");
  }

  const result = await Result.findById(resultId).populate('submissionId');

  if (!result) {
    throw new ApiError(404, "Result not found");
  }

  return res.status(200).json(new ApiResponse(200, result, "Result retrieved successfully"));
});


export const getTestSummary = asyncHandler(async (req, res, next) => {
  const { submissionId } = req.params;

  if (!submissionId) {
    throw new ApiError(400, "Submission ID is required");
  }

  const submission = await Submission.findById(submissionId)
    .populate({
      path: 'answers.questionId',
      populate: {
        path: 'options'
      }
    });

  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  const detailedSummary = submission.answers.map(answer => {
    const question = answer.questionId;
    const correctOptions = question.options.filter(option => option.isCorrect).map(option => ({
      _id: option._id,
      optionText: option.optionText,
    }));

    const selectedOptions = answer.selectedOptionIds.map(optionId => {
      const selectedOption = question.options.find(option => option._id.toString() === optionId.toString());
      return {
        _id: selectedOption._id,
        optionText: selectedOption.optionText,
      };
    });

    return {
      questionText: question.questionText,
      options: question.options.map(option => ({
        _id: option._id,
        optionText: option.optionText,
      })),
      selectedOptions,
      correctOptions,
      explanation: question.explanation,
      difficultyLevel: question.difficultyLevel,
      topic: question.topic,
    };
  });

  return res
  .status(200)
  .json(new ApiResponse(200, detailedSummary, "Detailed test summary retrieved successfully"));
});
// List all results
export const getResultsByTestId = asyncHandler(async (req, res, next) => {
  const { testId } = req.params;

  if (!testId) {
    throw new ApiError(400, "Test ID is required");
  }

  // Find all submissions for the given testId and populate the user details
  const submissions = await Submission.find({ testId })
    .select('_id userId')
    .populate('userId', 'name email'); // Populate the userId with name and email

  const submissionIds = submissions.map(submission => submission._id);

  // Find all results related to these submissions
  const results = await Result.find({ submissionId: { $in: submissionIds } })
    .populate({
      path: 'submissionId',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    });

  if (results.length === 0) {
    throw new ApiError(404, "No results found for the specified test");
  }

  // Transform the results to include user details directly in the response
  const resultsWithUserDetails = results.map(result => ({
    _id: result._id,
    totalQuestions: result.totalQuestions,
    correctAnswers: result.correctAnswers,
    incorrectAnswers: result.incorrectAnswers,
    skippedQuestions: result.skippedQuestions,
    accuracy: result.accuracy,
    score: result.score,
    maxScore: result.maxScore,
    percentage: result.percentage,
    passed: result.passed,
    evaluatedAt: result.evaluatedAt,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    name: result.submissionId.userId.name, // Include user's name
    email: result.submissionId.userId.email, // Include user's email
  }));

  return res.status(200).json(new ApiResponse(200, resultsWithUserDetails, "Results retrieved successfully"));
});