const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

const jwt = require('jsonwebtoken');
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

app.post('/login',async(req,res) => {
  //username:req.body.username
  //password:req.body.password

  //Step 1: Check username if exists
  let result = await client.db('classCRUD').collection('user').findOne({
    username: req.body.username
  })
  // if (result){
  //   res.status(400).send('Username already exists')
  //}
  if (!result) {
    res.send('Username not found')
  } else {
    //Step 2: Check if password is correct
    if(bcrypt.compareSync(req.body.password, result.password) == true){
      var token = jwt.sign({
        _id: result._id,
        username: result.username,
        password: result.password
        }, 'mysecretpasskey')//{ expiresIn: 10 * 60 });// set the time for the token to expire
      res.send(token)
    } else {
      // password incorrect
      res.status(401).send('Wrong password')
    }
    
  }
  console.log(result)

})

//app.post('/user', verifyToken, async(req,res) => {

//})

//get user profile
app.get('/readprofile/:id', async(req,res) => {
  //findOne
  const token = req.headers.authorization.split(" ")[1]
  let decoded = jwt.verify(token, 'mysecretpasskey');

  if (decoded){
    if (decoded._id == req.params.id){//if the user is accessing their own profile
      let result = await client.db('classCRUD').collection('user').findOne({
      _id: new ObjectId(req.params.id)
    })
    res.send(result)
    }else{
    res.status(401).send('Unauthorized access')
  }
  }else{
    res.status(401).send('Unauthorized')
  }
})

/*
app.get('/readprofile/:name',async(req,res) => {
  //findOne
  let result = await client.db('classCRUD').collection('user').findOne({
    _username: req.params.name
    //email: req.params.email
  })
  res.send(result)
})*/

//update user account
app.patch('/updateaccount/:id',async(req,res) => {
  //updateOne
  let result = await client.db('classCRUD').collection('user').updateOne(
    {
      _id: new ObjectId(req.params.id)
    },
    {
      $set: {
        name: req.body.name
      }
    }
  )
  res.send(result)
})

//delete user account
app.delete('/deleteaccount/:id',async(req,res) => {
  //deleteOne
  let result = await client.db('classCRUD').collection('user').deleteOne(
    {
      _id: new ObjectId(req.params.id)
    }
  )
  res.send(result)
})

app.post('/buy',async(req,res) => {
  const token = req.headers.authorization.split(" ")[1]

  var decoded = jwt.verify(token, 'mysecretpasskey');
  console.log(decoded) // bar
})


app.get('/')

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`)
})
//connect to MongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://Wong_Hui_Chin:yyywhceggy@cluster0.ucgr9bl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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
    console.log('Connected successfully to MongoDB')
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
