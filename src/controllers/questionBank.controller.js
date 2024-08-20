import { QuestionBank } from '../models/questionBank.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';


const createQuestion = asyncHandler(async (req, res, next) => {
    const {
        subject,
        questionText,
        options,
        explanation,
        difficultyLevel,
        topic
    } = req.body;
    console.log("req.body",req.body);
    const createdBy = req.user._id;

    const optionsSchema = options.map(option => ({
        optionText: option.optionText,
        isCorrect: option.isCorrect
    }));

    const question = new QuestionBank({
        subject,
        questionText,
        options: optionsSchema,
        explanation,
        difficultyLevel,
        createdBy,
        topic
    });

    await question.save();

    if(!question) {
        return next(new ApiError(400, "Question could not be created"));
    }

    return res
    .status(201)
    .json(new ApiResponse(201, question, "Question created successfully"));
});

const getQuestions = asyncHandler(async (req, res, next) => {
    const questions = await QuestionBank.find();
    if(!questions) {
        return next(new ApiError(404, "No questions found"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200, questions, "Questions Fecthed Successfully"));
});

const getQuestion = asyncHandler(async (req, res, next) => {
    const question = await QuestionBank.findById(req.params.id);
    if(!question) {
        return next(new ApiError(404, "Question not found"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200, question, "Question Fetched Successfully"));
});

const updateQuestion = asyncHandler(async (req, res, next) => {
    const question = await QuestionBank.findById(req.params.id);
    if(!question) {
        return next(new ApiError(404, "Question not found"));
    }

    const {
        subject,
        questionText,
        options,
        explanation,
        difficultyLevel,
        topic
    } = req.body;

    if(options) {
    const optionsSchema = options?.map(option => ({
        optionText: option.optionText,
        isCorrect: option.isCorrect
    }));
    question.options = optionsSchema;
  }

    if(subject) question.subject = subject;
    if(questionText) question.questionText = questionText;
    if(explanation) question.explanation = explanation;
    if(difficultyLevel) question.difficultyLevel = difficultyLevel;
    if(topic) question.topic = topic;

    await question.save();

    if(!question) {
        return next(new ApiError(400, "Question could not be updated"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200, question, "Question updated successfully"));
});

const deleteQuestion = asyncHandler(async (req, res, next) => {
    if(!req.params.id) {
        return next(new ApiError(400, "Question ID is required"));
    }
    const question = await QuestionBank.findById(req.params.id);
    if(!question) {
        return next(new ApiError(404, "Question not found"));
    }

    await question.deleteOne({ _id: question._id });
    console.log("question deleted");
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Question deleted successfully"));
});


export {
    createQuestion,
    getQuestions,
    getQuestion,
    updateQuestion,
    deleteQuestion
}