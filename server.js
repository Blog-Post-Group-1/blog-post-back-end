'use strict';

//import the express framework
const express = require('express');
//import cors
const cors = require('cors');
//import axios
const axios = require('axios');
//Database - > importing the pg 
const pg = require('pg');

var bodyParser = require('body-parser')



const server = express();

//server open for all clients requests
server.use(cors());

// Load the environment variables into your Node.js
require('dotenv').config();

//Set Port Number
const PORT = process.env.PORT || 5500;
//create obj from Client
const client = new pg.Client(process.env.DATABASE_URL);


// parse application/x-www-form-urlencoded
server.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
server.use(bodyParser.json())

//Routes
server.get('/', startHandler)
server.get('/home', homeHandler)
server.get('/getUserPosts/:id', getUserPostsHandler)
server.get('/getPostById/:id', getPostByIdHandler)
server.post('/addUsers', addUsersHandler)
// server.get('/getUsers', getUsersHandler)
server.post('/addPost', savePostHandler)
server.get('/getAllPosts', getAllPostsHandler)
server.put('/updateComment/:id',updateCommentId)
server.get('/getAllComment/:id', getAllCommentHandler)
server.post('/saveComment', saveCommentHandler)
server.delete('/deleteComment/:id', deleteCommentHandler)
//API Route
server.get('/topHeadlines',topHeadlinesAPIHandler)





// Functions Handlers

function startHandler(req, res) {
    res.send("Hello from the Start route");
}

function homeHandler(req, res) {
    res.send("Hello from the home route");
}

function addUsersHandler(req, res) {
    const user = req.body;
    const sql = `INSERT INTO Users (userFullName, dateOfBirth, email, userPassword, imageURL, bio) VALUES ($1, $2, $3,$4,$5,$6) RETURNING *`;
    const values = [user.userFullName, user.dateOfBirth, user.email, user.userPassword, user.imageURL, user.bio];
    client.query(sql, values)
        .then((data) => {
            res.send(data.rows);
        })
        .catch(error => {
            res.send('error');
        });
}


// function getUsersHandler(req, res) {
//     const sql = `SELECT * FROM Users;`
//     client.query(sql)
//         .then((data) => {
//             res.send(data.rows);
//         })
//         .catch(error => {
//             res.send('error');
//         });
// }

function savePostHandler(req, res) {
    const Post = req.body;
    const sql = `INSERT INTO Posts (userId, title, content,imageURL) VALUES ($1, $2, $3,$4) RETURNING *;`
    const values = [Post.userId, Post.title, Post.content, Post.imageURL];
    client.query(sql, values)
        .then((data) => {
            res.send("your data was added !");
        })
        .catch(error => {
            // console.log(error);
            errorHandler(error, req, res);
        });
}

// (GET) /getAllPosts: get list of all blog posts created by all users. (Database Join between Posts and User )
//  (postId ,userId ,imageURL ,title ,content ,numberOfLikes,Created_at , userFullName , imageURL AS userImageURL) sorted by created_at
function getAllPostsHandler(req, res) {
    const sql = 'SELECT Posts.postId ,Users.userId ,Users.userFullName, Users.imageURL , Posts.postId  , Posts.imageURL , Posts.title , Posts.content  , Posts.numberOfLikes , Posts.Created_at  FROM Users INNER JOIN Posts ON Users.userId=Posts.userId  ORDER BY Created_at DESC ;'
    client.query(sql)
        .then((data) => {
            res.send(data.rows);
        })
        .catch(error => {
            res.send('error');
        });
}


function getUserPostsHandler(req, res) {
    const id = req.params.id;
    const sql = `SELECT Users.userId ,
                        Posts.postId ,
                        Users.userFullName ,
                        Users.imageURL AS userImageURL ,
                        Posts.imageURL,
                        Posts.title ,
                        Posts.content ,
                        Posts.numberOfLikes ,
                        Posts.Created_at 
                FROM Posts
                INNER JOIN Users ON Posts.userId =Users.userId 
                WHERE Posts.userId=${id}
                ORDER BY Posts.Created_at DESC;`;

    client.query(sql)
        .then((data) => {
            res.send(data.rows);
        })
        .catch((err) => {
            errorHandler(err, req, res);
        })
}

function getPostByIdHandler(req, res) {
    const id = req.params.id;
    const sql = `SELECT Users.userId ,
                        Posts.postId ,
                        Users.userFullName ,
                        Users.imageURL AS userImageURL ,
                        Posts.imageURL,
                        Posts.title ,
                        Posts.content ,
                        Posts.numberOfLikes ,
                        Posts.Created_at  
                FROM Posts 
                INNER JOIN Users ON Posts.userId = Users.userId
                WHERE postId=${id}`;
    client.query(sql)
        .then((data) => {
            res.send(data.rows);
        })
        .catch((err) => {
            errorHandler(err, req, res);
        })

}

// NewsAPI  constructor 

function News (title,description,url,urlToImage)
{
this.title = title ;
this.description = description ;
this.url = url ;
this.urlToImage = urlToImage ;
}

function updateCommentId(req, res) {
    const id = req.params.id;
    const comm = req.body.Content;
    const sql = `UPDATE Comments SET Created_at = CURRENT_DATE, Content = $1 WHERE commentId = $2`;
    const values = [comm, id];
  
    client
      .query(sql, values)
      .then((data) => {
        res.send(data.rows);
      })
      .catch((err) => {
        errorHandler(err, req, res);
      });
  }


  function topHeadlinesAPIHandler (req,res){

    try {
        const APIKey = process.env.news_API_key;
        const URL = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${APIKey}`;
        axios.get(URL)
          .then((newsResult) => {
            let mapResult = newsResult.data.articles.map((item) => {
              return new News(item.title, item.description, item.url, item.urlToImage);
            });
            res.send(mapResult);
          })
          .catch((err) => {
            console.log("sorry", err);
            res.status(500).send(err);
          })
      }
    
      catch (error) {
        errorHandler(error, req, res);
      }
}


function getAllCommentHandler(req, res) {
    const id = req.params.id;
    const sql = `SELECT Comments.userId,
                        Comments.Content,
                        Comments.Created_at
                FROM Comments
                INNER JOIN Users ON Comments.userId = Users.userId
                WHERE Comments.postId=${id}
                ORDER BY Comments.Created_at DESC;`;
    client.query(sql)
        .then((data) => {
            res.send(data.rows);

        })
        .catch((err) => {
            errorHandler(err, req, res);
        })

}

function saveCommentHandler(req, res) {
    const newComment = req.body;
    const sql = `INSERT INTO Comments (postId, userId ,Content) VALUES ($1,$2,$3) RETURNING *;`;
    const values = [newComment.postId, newComment.userId, newComment.Content];
    client.query(sql, values)
        .then((data) => {
            res.send("your data was added !");
        })
        .catch((err) => {
            errorHandler(err, req, res);
        })
    // res.send("Hello from the home route");
}

function deleteCommentHandler(req, res) {
    const id = req.params.id;
    if (!isNaN(id)) {
        const sql = `DELETE FROM Comments WHERE commentId=${id}`;
        client.query(sql)
            .then((data) => {
                res.send("your data was deleted successful");
            })
            .catch((err) => {
                errorHandler(err, req, res);
            })
    }
    else {
        res.send("Id Must Be Numaric");
    }

}

// 404 errors
server.get('*', (req, res) => {
    const errorObj = {
        status: 404,
        responseText: 'Sorry, page not found'
    }
    res.status(404).send(errorObj);
})


//middleware function
function errorHandler(err, req, res) {
    const errorObj = {
        status: 500,
        massage: err
    }
    res.status(500).send(errorObj);
}

// server errors
server.use(errorHandler)


//connect the server with Blogify database
// http://localhost:3000 => (Ip = localhost) (port = 3000)
client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`listening on ${PORT} : I am ready`);
        });
    })