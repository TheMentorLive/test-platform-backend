import express, { urlencoded } from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import session from "express-session";
import passport from "passport";

import userRouter from './routes/user.route.js';
import questionBankRouter from './routes/questionBank.route.js';
import testsRouter from './routes/tests.route.js';
import submissionRouter from './routes/submission.route.js';
import resultsRouter from './routes/results.route.js';
import paymentRouter from './routes/payment.route.js';


const app = express()

app.use(cors({

  origin: 'https://www.genailearning.in',
  // origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );

app.use(passport.initialize())
app.use(passport.session())


app.use('/api/v1/users', userRouter)
app.use('/api/v1/questions', questionBankRouter)
app.use('/api/v1/tests', testsRouter)
app.use('/api/v1/submission', submissionRouter)
app.use('/api/v1/results',resultsRouter);
app.use('/api/v1/payment',paymentRouter);






export { app } 
