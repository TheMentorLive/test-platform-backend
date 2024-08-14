import express, { urlencoded } from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import session from "express-session";
import passport from "passport";

import userRouter from './routes/user.route.js';


const app = express()

app.use(cors({

  origin: 'https://www.genailearning.in',
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





export { app } 
