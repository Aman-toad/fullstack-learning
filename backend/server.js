import express from "express"

const app = express();

// app.get('/', (req, res) => {
//   res.send('server is ready');
// });

// get a list of 5 jokes

app.get('/api/jokes', (req, res) => {
  const jokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Why did the scarecrow win an award? Because he was outstanding in his field!",
    "What do you call fake spaghetti? An impasta!",
    "Why did the bicycle fall over? Because it was two-tired!",
    "What do you call cheese that isn't yours? Nacho cheese!"
  ];
  
  res.json(jokes);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`server at http://localhost:${port}`);
})