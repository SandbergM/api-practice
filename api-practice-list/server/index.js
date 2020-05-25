const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const util = require("util");
const sqlite = require("sqlite3");
const db = new sqlite.Database("./list.db");

db.all = util.promisify(db.all);

const app = express();

//Middleware
app.use(bodyParser.json());
app.use(cors());
// Get

app.get("/api/posts", async (req, res) => {
  let posts = await db.all("SELECT * FROM posts");
  res.json({
    posts: posts,
  });
});

// Post
app.post("/api/posts", async (req, res) => {
  const values = {
    $name: req.body.name,
    $email: req.body.email,
    $interest: req.body.interest,
  };
  try {
    db.run(
      `INSERT INTO posts 
            (name, email, interest) 
            VALUES($name, $email, $interest)`,
      values,
      function (err, result) {
        res.json({ message: "Post added to DB" });
      }
    );
  } catch (e) {
    console.error(e);
    res.json({ message: "failed" });
  }
});

const port = 5002;
app.listen(port, () => console.log(`Server started on port: ${port}`));
