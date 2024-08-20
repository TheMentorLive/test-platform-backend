const LeaderboardSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
  },
  rankings: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      score: {
        type: Number,
        required: true,
      },
      rank: {
        type: Number,
        required: true,
      },
    },
  ],
},{ timestamps: true});

const Leaderboard = mongoose.model('Leaderboard', LeaderboardSchema);
