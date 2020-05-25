const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const util = require("util");
const sqlite = require("sqlite3");
const db = new sqlite.Database("./form.db");
const request = require("request");
const mandrill = require("node-mandrill")("LTLcM4NJlH6an6d09yvcbA");
const schedule = require("node-schedule");

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
  request.post(
    {
      uri: "http://localhost:5002/api/posts",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        name: req.body.name,
        email: req.body.email,
        interest: req.body.interest,
      },
      json: true,
    },
    function (err, response, body) {
      if (err) {
        const values = {
          $name: req.body.name,
          $email: req.body.email,
          $interest: req.body.interest,
        };
        db.run(
          `INSERT INTO posts 
            (name, email, interest) 
            VALUES($name, $email, $interest)`,
          values,
          function (err, result) {
            res.json({ msg: "Post added to DB" });
          }
        );
        mandrill(
          "messages/send.json",
          {
            key: "LTLcM4NJlH6an6d09yvcbA",
            message: {
              to: [
                {
                  email: "marcus.a.sandberg@outlook.com",
                  name: "Marcus Sandberg",
                },
              ],
              from_email: "info@wiberg.media",
              subject: "test",
              text: "test123",
            },
          },
          function (error, response) {
            if (error) {
              console.log(error);
            } else {
              console.log(response);
            }
          }
        );
      }
    }
  );
});

let resend_data = schedule.scheduleJob("*/30 * * * * *", async () => {
  console.log("Retrying API");
  let posts = await db.all("SELECT * FROM posts");
  if (posts.lenght != 0) {
    for (post of posts) {
      request.post(
        {
          uri: "http://localhost:5002/api/posts",
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            name: post.name,
            email: post.email,
            interest: post.interest,
          },
          json: true,
        },
        async (err, response, body) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Sent " + post + " to main DB");
            let del = await db.all(`DELETE FROM posts WHERE id=?`, post.id);
          }
        }
      );
    }
  }
});

const port = 5001;
app.listen(port, () => console.log(`Server started on port: ${port}`));
