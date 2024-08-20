import mongoose from 'mongoose';
import { Submission } from '../models/submission.model.js';
import { Result } from '../models/results.model.js';
import { Test } from '../models/test.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const evaluateResult = async (submissionId) => {
  try {
    // Retrieve the submission
    const submission = await Submission.findById(submissionId).populate('testId');
    if (!submission) {
      throw new ApiError(404, 'Submission not found');
    }

    const { testId, answers } = submission;
    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      throw new ApiError(404, 'Test not found');
    }

    const questions = test.questions;
    const testType = test.type; // NEET or JEE
    let totalQuestions = questions.length;
    let correctAnswers = 0;
    let score = 0;

    questions.forEach(question => {
      const userAnswer = answers[question._id];
      if (userAnswer === undefined || userAnswer === null) {
        // Question was unattempted
        return;
      }

      const correctAnswersList = question.correctAnswers;
      if (Array.isArray(correctAnswersList)) {
        // Handle multiple correct answers
        if (correctAnswersList.includes(userAnswer)) {
          correctAnswers++;
          score += question.marks;
        } else if (testType === 'JEE' && correctAnswersList.length === 1 && correctAnswersList[0] === userAnswer) {
          // Negative marking for JEE
          score -= question.negativeMarks || 0;
        }
      } else {
        // Handle single correct answer
        if (userAnswer === correctAnswersList) {
          correctAnswers++;
          score += question.marks;
        } else if (testType === 'JEE' && userAnswer !== correctAnswersList) {
          // Negative marking for JEE
          score -= question.negativeMarks || 0;
        }
      }
    });

    // Determine if the user passed based on the test type
    const passingScore = test.passingScore || 0;
    const passed = score >= passingScore;

    // Create or update a result object
    const result = await Result.findOneAndUpdate(
      { submissionId },
      {
        totalQuestions,
        correctAnswers,
        score,
        passed,
        evaluatedAt: Date.now(),
      },
      { new: true, upsert: true }
    );

    return result;
  } catch (error) {
    throw new ApiError(500, 'Error evaluating result');
  }
};

const createResult = asyncHandler(async (req, res, next) => {
  const { testId } = req.body;
  const userId = req.user._id; // Assuming the user is authenticated

  if (!testId) {
    return next(new ApiError(400, 'Please provide a test ID'));
  }

  try {
    // Find the submission by testId and userId
    const submission = await Submission.findOne({ testId, user: userId });
    if (!submission) {
      return next(new ApiError(404, 'Submission not found for the provided test ID and user ID'));
    }

    const result = await evaluateResult(submission._id);
    return res.status(201).json(new ApiResponse(201, result, 'Result created/updated successfully'));
  } catch (error) {
    return next(error);
  }
});

const getAllResults = asyncHandler(async (req, res, next) => {
  const results = await Result.find();
  if (!results) {
    return next(new ApiError(404, 'No results found'));
  }

  return res.status(200).json(new ApiResponse(200, results, 'Results fetched successfully'));
});

const getResult = asyncHandler(async (req, res, next) => {
  const resultId = req.params.id;
  if (!resultId) {
    return next(new ApiError(400, 'Please provide a result ID'));
  }

  const result = await Result.findById(resultId);
  if (!result) {
    return next(new ApiError(404, 'Result not found'));
  }

  return res.status(200).json(new ApiResponse(200, result, 'Result fetched successfully'));
});

export { 
     createResult,
     getAllResults,
     getResult
};
