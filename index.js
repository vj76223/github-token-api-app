import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// GraphQL endpoint
const GH_GRAPHQL_URL = "https://api.github.com/graphql";

// ====== ROUTE: Get Contribution Graph ======
app.post("/api/contributions", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
                weekday
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      GH_GRAPHQL_URL,
      {
        query,
        variables: { login: username },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "GitHub GraphQL request failed" });
  }
});

app.get("/", (_, res) => {
  res.send("GitHub GraphQL Server Running");
});

// REQUIRED FOR RENDER
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
