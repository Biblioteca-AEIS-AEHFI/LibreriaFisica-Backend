import express, { type Application } from "express";
// const connection = require('./db')

const port = process.env.PORT;

const app: Application = express();

app.get('/', (req, res) => {
  res.send("Hello")
})

app.delete('/user/:id', (req, res) => {
  const userId = req.params.id;
  res.json({
    status: 200,
    message: `User with ID: ${userId} has been deleted`
  })

  // connection.query('DELETE FROM users WHERE id = ?', [userId], (error, results) => {
  //   if (error){
  //     return res.status(500).send(error)
  //   }

  //   return res.json({
  //     status: 200,
  //     message: `User with ID: ${userId} has been deleted`
  //   })

  // })

})

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
