const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

const bcrypt = require('bcrypt');
app.use(express.json())

//new user registration
app.post('/register',async(req,res) => {
  //console.log(req.body)
  //insertOne
  const hash = bcrypt.hashSync(req.body.password, 10);

 let result = await client.db('classCRUD').collection('user').insertOne(
    {
      username: req.body.username,
      password: hash,//mi ma bian luan ma
      name: req.body.name,
      email: req.body.email
    }
  )
  res.send(result)
})

//get user profile
app.get('/readprofile/:id/:email',async(req,res) => {
  //findOne
  let result = await client.db('classCRUD').collection('user').findOne({
    username: req.params.id,
    email: req.params.email
  })
  res.send(result)
})

//update user account
app.patch('/updateaccount',(req,res) => {
  //updateOne
  console.log('update user profile')
})

//delete user account
app.delete('/deleteaccount',(req,res) => {
  //deleteOne
  console.log('delete user profile')
})

app.get('/')

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`)
})

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://Wong_Hui_Chin:Y0304h1023@cluster0.ucgr9bl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // Send a ping to confirm a successful connection
    await client.connect();
    //let result = await client.db('BERRDB').collection('students').deleteOne(
    //  { _id: new ObjectId('660517558d711e579b1621ff')},
    //)
    //console.log('Connected successfully to MongoDB')
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
