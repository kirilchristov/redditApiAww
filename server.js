require("dotenv").config();
const express = require("express");
const app = express();
const request = require("request");
const PORT = process.env.PORT || 3000;

const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

let posts;
let after;
let savedToken;

const options = {
  method: "POST",
  url: "https://www.reddit.com/api/v1/access_token",
  headers: {
    "User-Agent": "my test bot 1.0",
    Authorization:
      "Basic " +
      new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
  },
  form: {
    grant_type: "password",
    username: USERNAME,
    password: PASSWORD,
  },
};

// To get the reddit token
async function getToken() {
  if (savedToken) {
    return savedToken;
  }
  const token = await new Promise((resolve, reject) => {
    request.post(options, (error, _, body) => {
      if (error) {
        reject(error);
      } else {
        const json = JSON.parse(body);
        resolve(json.access_token);
      }
    });
  });

  savedToken = token;
  return savedToken;
}

app.get("/", async (req, res) => {
  try {
    const accessToken = await getToken();
    // Use the access token to make another API call
    const response = await new Promise((resolve, reject) => {
      request.get(
        {
          url: "https://oauth.reddit.com/r/aww/new",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": "my test bot 1.0",
          },
        },
        (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            const result = JSON.parse(body);
            posts = result.data.children;
            after = result?.data?.after;
            resolve(body);
          }
        }
      );
    });

    res.send(response); // the resposne comes as a string
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
