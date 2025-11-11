const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config()
const app = express()
const port = 3000
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.qn8yxeg.mongodb.net/?appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    
    const db = client.db('transaction-db')
    const transactionCollection = db.collection('transaction')

    


    app.get('/transaction', async(req, res)=>{

        const result =await transactionCollection.find().toArray()


        res.send(result)
    })




    app.post('/transaction', async(req, res)=>{
        const data = req.body
        
        const result =await transactionCollection.insertOne(data)


        res.send(result)
    })



    






    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Server is running')
})

app.listen(port, () => {
  console.log(`server is listening on port ${port}`)
})