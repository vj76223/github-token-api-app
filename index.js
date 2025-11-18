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
  const { username, from, to } = req.body;

  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  // Validate date range (optional)
  if (from && isNaN(Date.parse(from))) {
    return res.status(400).json({ error: "'from' must be a valid ISO date" });
  }
  if (to && isNaN(Date.parse(to))) {
    return res.status(400).json({ error: "'to' must be a valid ISO date" });
  }

  const query = `
    query($login: String!, $from: DateTime, $to: DateTime) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
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
        variables: { 
          login: username,
          from: from || null,
          to: to || null,
        },
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


// app.post("/api/activity", async (req, res) => {
//   const { username, from, to, year } = req.body;

//   if (!username) {
//     return res.status(400).json({ error: "username is required" });
//   }

//   // ===========================
//   // SMART DATE LOGIC
//   // ===========================

//   let fromISO = null;
//   let toISO = null;

//   // CASE 1: user passes from + to
//   if (from && to) {
//     fromISO = new Date(from).toISOString();
//     toISO = new Date(to).toISOString();
//   }
//   // CASE 2: user passes only "year"
//   else if (year) {
//     fromISO = new Date(`${year}-01-01T00:00:00Z`).toISOString();
//     toISO = new Date(`${year}-12-31T23:59:59Z`).toISOString();
//   }
//   // CASE 3: nothing provided → default last 12 months
//   else {
//     const now = new Date();
//     const lastYear = new Date();
//     lastYear.setFullYear(now.getFullYear() - 1);

//     fromISO = lastYear.toISOString();
//     toISO = now.toISOString();
//   }

//   const query = `
//     query($login: String!, $from: DateTime!, $to: DateTime!) {
//       user(login: $login) {
//         contributionsCollection(from: $from, to: $to) {
//           totalCommitContributions
//           totalPullRequestContributions
//           totalPullRequestReviewContributions
//           totalIssueContributions
//         }
//       }
//     }
//   `;

//   try {
//     const r = await axios.post(
//       "https://api.github.com/graphql",
//       {
//         query,
//         variables: { login: username, from: fromISO, to: toISO },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
//         },
//       }
//     );

//     const c = r.data.data.user?.contributionsCollection;

//     if (!c) {
//       return res.json({
//         totals: { commits: 0, prs: 0, reviews: 0, issues: 0 },
//         percentages: { commits: 0, prs: 0, reviews: 0, issues: 0 },
//       });
//     }

//     const totals = {
//       commits: c.totalCommitContributions,
//       prs: c.totalPullRequestContributions,
//       reviews: c.totalPullRequestReviewContributions,
//       issues: c.totalIssueContributions,
//     };

//     const sum = totals.commits + totals.prs + totals.reviews + totals.issues;

//     const percentages =
//       sum > 0
//         ? {
//             commits: Math.round((totals.commits / sum) * 100),
//             prs: Math.round((totals.prs / sum) * 100),
//             reviews: Math.round((totals.reviews / sum) * 100),
//             issues: Math.round((totals.issues / sum) * 100),
//           }
//         : {
//             commits: 0,
//             prs: 0,
//             reviews: 0,
//             issues: 0,
//           };

//     res.json({ totals, percentages, from: fromISO, to: toISO });
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(500).json({ error: "GitHub request failed" });
//   }
// });

app.get("/", (_, res) => {
  res.send("GitHub GraphQL Server Running");
});

// REQUIRED FOR RENDER
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
