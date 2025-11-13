const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
const serviceAccount = require("./sarverKey.json");
require("dotenv").config();
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.qn8yxeg.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "Unauthorized access. Token not found",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const decode = await admin.auth().verifyIdToken(token);
    req.token_email = decode.email;
    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized" });
  }
};


async function run() {
  try {
    // await client.connect();
    const db = client.db("transaction-db");
    const transactionCollection = db.collection("transaction");


    app.get("/transaction", verifyToken, async (req, res) => {
      const result = await transactionCollection.find().toArray();
      res.send(result);
    });

    app.post("/transaction", verifyToken, async (req, res) => {
      const data = req.body;
      data.amount = Number(data.amount);
      const result = await transactionCollection.insertOne(data);
      res.send(result);
    });

    app.get("/transaction/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await transactionCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send({ success: true, result });
    });

 
    app.put("/transaction/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const update = { $set: data };
      const result = await transactionCollection.updateOne(filter, update);
      res.send({ success: true, result });
    });

    app.delete("/transaction/:id",verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await transactionCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send({ success: true, result });
    });

  
    app.get("/my-transaction", verifyToken, async (req, res) => {
      const email = req.query.email;
      const result = await transactionCollection.find({ email }).toArray();
      res.send(result);
    });



    app.get("/my-transaction-summary", verifyToken, async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).send({ success: false, message: "Email is required" });
  }

  try {
    const transactions = await transactionCollection.find({ email }).toArray();

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      if (t.type === "Income") totalIncome += t.amount;
      if (t.type === "Expense") totalExpense += t.amount;
    });

    const totalBalance = totalIncome - totalExpense;

    res.send({
      success: true,
      totalBalance,
      totalIncome,
      totalExpense,
      transactions, 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Server Error" });
  }
});








   
    // await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB successfully!");
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Server is running");
});
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
