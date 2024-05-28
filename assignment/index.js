const bcrypt = require('bcrypt');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

//e.g using for registration
app.post('/register', async(req,res) => {
  let existing = (await client.db("Assignment").collection("users").findOne({
    name: req.body.username,
  })) || (await client.db("Assignment").collection("users").findOne({
    email: req.body.email,
  }));

  if (existing) {
    res.status(400).send("username or email already exist")
  } else {
    const hash = bcrypt.hashSync(req.body.password, 10);
    let count = await client.db("Assignment").collection("users").countDocuments();
    let resq = await client.db("Assignment").collection("users").insertOne({
        name: req.body.name,
        player_id: count,
        password: hash,
        email: req.body.email,
        gender: req.body.gender,
        collection: [],
        money: 0,
        points: 0,
        achievements: ["Welcome warrior!"],
        friends: { friendList: [], sentRequests: [], needAcceptRequests: [] },
        starterPackRetrieved: false,
    });
    res.send({message:"User registered successfully! Start your battle journey!",resq});
    }
})

app.patch('/register/starterpack/:username', async(req, res) => {
  let user = await client.db("Assignment").collection("users").findOne({
    name: req.params.username
  });

  if(user){
    if(user.starterPackRetrieved){
      res.status(400).send('Starter pack already retrieved');
    } else {
      let starter_pack = await client.db("Assignment").collection("users").updateOne({
        name: req.params.username
      },{
        $set:{
          characters: "Darius",
          money: 1000,
          starterPackRetrieved: true
        }
      });
      res.send('Starter pack given');
    }
  } else {
    res.status(400).send('User not found');
  }
})

app.post('/register/achievements/:username', async(req, res) => {
  try {
    let user = await client.db("Assignment").collection("users").findOne({
      name: req.params.username
    });

    if(user){
      if(user.achievements){
        res.status(400).send('Achievements already retrieved');
      } else {
        await client.db("Assignment").collection("users").updateOne({
          name: req.params.username
        },{
          $set:{
            achievements: {
              battlesWon: 0,
              battlesLost: 0
            }
          }
        });
        res.send('Achievements given');
      }
    } else {
      res.status(400).send('User not found');
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
})

app.post('/chest' ,async(req,res) => {
  let existing = await client.db("Assignment").collection("chests").findOne({
    chest: req.body.chest_name
});
  if (existing) {
    res.status(400).send("Chest already exist")
  } else {
    let chest = await client.db("Assignment").collection("chests").insertOne({
      chest: req.body.chest_name,
      price: req.body.price,
      characters: [],
      Max_power_level: req.body.Max_power_level
    });
    res.send(chest);
    }
  }
)

app.post('/character' ,async(req,res) => {
  let existing = await client.db("Assignment").collection("characters").findOne({
    name: req.body.character_name
});
  if (existing) {
    res.status(400).send("Character already exist")
  } else {
    let character = await client.db("Assignment").collection("characters").insertOne({
      name: req.body.character_name,
      health: req.body.health,
      attack: req.body.attack,
      defense: req.body.defense,
      type: req.body.type
    });
    res.send(character);
    }
  }
)

app.post('/login',async(req,res) => { 
  let resp = (await client.db("Assignment").collection("users").findOne({
    name: req.body.username
})    
)||(
    await client.db("Assignment").collection("users").findOne({
    email: req.body.email
    }));

console.log(resp);
console.log(req.body);

  if(!resp){
    res.send('User not found');
  }else{
   // Check if password is provided
if (req.body.password) {
  if (bcrypt.compareSync(req.body.password, resp.password)) {
    res.send('Login successful');
  } else {
    res.send('Wrong Password');
  }
} else {
  // Handle case where password is not provided
  // This is where you might decide to return an error or a specific message
  res.send('Password field is missing');
}
  }
})

//get read user profile
app.get('/read/:id',async(req,res) => {
  
  let rep = await client.db("Assignment").collection("users").findOne({
    //username: req.params.username
    _id: new ObjectId(req.params.id)
  
  });
    
    res.send(rep);
    console.log(req.params);
    //console.log(rep);
})

app.get('/leaderboard',async(req,res)=>{
  let leaderboard = await client.db("Assignment").collection("users").find().sort({
    PlayerPowerLevel: -1
  }).toArray();

  res.send(leaderboard);
})

app.patch('/chest_update/:chestname',async(req,res) => {
  let existing_chest = await client.db("Assignment").collection("chests").findOne({
    chest: req.params.chestname
  });

  if(existing_chest){
    let new_chest = await client.db("Assignment").collection("chests").updateOne({
      chest: req.params.chestname
    },{
      $set:{
        chest: req.body.chest_name,
        price: req.body.price
      }
    });
    console.log(existing_chest);
    console.log(new_chest);
    res.send('Chest updated successfully');
  }else{
    res.send('Chest not found');
  }
})

app.patch('/add_character_to_chest/:chestId',async(req,res) => {
  const Character = req.body.character_name;

  const existingChest = await client.db("Assignment").collection("chests").findOne({
    _id: new ObjectId(req.params.chestId)
  });

  const existingCharacter = await client.db("Assignment").collection("characters").findOne({
    name: Character
  });

  if(Array.isArray(Character)){

    if (!existingCharacter && !existingChest) {
         res.status(400).send("Chest or character does not exist")
    } else {
          let character_power_level = 0;

          for (const character of Character) {
            let individual_character_power = await client.db("Assignment").collection("characters").findOne({
              name: character
            });
            character_power_level += individual_character_power.character_power;
          }
          
          if(existingChest.total_power_level){
            character_power_level = character_power_level + existingChest.total_power_level;
          };

          let chest = await client.db("Assignment").collection("chests").updateOne({
            _id: new ObjectId(req.params.chestId)
          },{
            $set:{
              total_power_level: character_power_level
            },
            $addToSet:{
              characters:{
                $each:Character
              }
            }
          });
          res.send({message: 'Characters added to chest'});
          }
  }else{
        if (!existingChest && !existingCharacter) {
          res.status(400).send("Chest or Character does not exist")
        } else {
          let character_power_level = 0;
            let individual_character_power = await client.db("Assignment").collection("characters").findOne({
              name: req.body.character_name
            });
            character_power_level += individual_character_power.character_power;
        
          let chest = await client.db("Assignment").collection("chests").updateOne({
            _id: new ObjectId(req.params.chestId)
          },{
            $set:{
              total_power_level: character_power_level
            },
            $addToSet:{
              //chest: req.body.chest_name,
              characters:req.body.character_name
            }
          });
          res.send({message: 'Character added to chest'});
          }
  }
  }
)

app.patch('/characterupdate/:charactername',async(req,res) => {
  let existing = await client.db("Assignment").collection("characters").findOne({
    name: req.params.charactername
  });
  if (!existing) {
    res.status(400).send("Character does not exist")
  } else {
    let character = await client.db("Assignment").collection("characters").updateOne({
      name: req.params.charactername
    },{
      $set:{
        health: req.body.health,
        attack: req.body.attack,
        defense: req.body.defense,
        type: req.body.type,
        character_power: req.body.character_power
      }
    });
    res.send(character);
    }
  }
)

app.post('/sendfriendrequest/:username', async(req, res) => {
  const friend = req.body.friend;

  let existing = await client.db("Assignment").collection("users").findOne({
    name: friend
  });

  if (existing) {
    let friend_request = await client.db("Assignment").collection("users").updateOne({
      name: req.params.username
    },{
      $addToSet: {
        friendRequestsSent: friend
      }
    });

    let friend_request_received = await client.db("Assignment").collection("users").updateOne({
      name: friend
    },{
      $addToSet: {
        friendRequestsReceived: req.params.username
      }
    });

    res.send("Friend request sent");
  } else {
    res.status(400).send("User does not exist")
  }
})

app.patch('/respondtofriendrequest/:username', async(req, res) => {
  const friend = req.body.friend;
  const action = req.body.action; // 'accept' or 'reject'

  let existing = await client.db("Assignment").collection("users").findOne({
    name: friend,
    friendRequestsReceived: req.params.username
  });

  if (existing) {
    if (action === 'accept') {
      let friend_addition = await client.db("Assignment").collection("users").updateOne({
        name: req.params.username
      },{
        $pull: {
          friendRequestsSent: friend
        },
        $addToSet: {
          friends: friend
        }
      });

      let friend_addition2 = await client.db("Assignment").collection("users").updateOne({
        name: friend
      },{
        $pull: {
          friendRequestsReceived: req.params.username
        },
        $addToSet: {
          friends: req.params.username
        }
      });

      res.send("Friend request accepted");
    } else if (action === 'reject') {
      let friend_rejection = await client.db("Assignment").collection("users").updateOne({
        name: req.params.username
      },{
        $pull: {
          friendRequestsReceived: friend
        }
      });

      let friend_rejection2 = await client.db("Assignment").collection("users").updateOne({
        name: friend
      },{
        $pull: {
          friendRequestsSent: req.params.username
        }
      });

      res.send("Friend request rejected");
    } else {
      res.status(400).send("Invalid action");
    }
  } else {
    res.status(400).send("Friend request not found")
  }
})

//forgot password and update password
app.patch('/forgotpassword/:username', async(req, res) => {
  const newpassword = req.body.newpassword;

  let existing = await client.db("Assignment").collection("users").findOne({
    name: req.params.username
  });

  if (existing) {
    const hash = bcrypt.hashSync(newpassword, 10);
    let password_update = await client.db("Assignment").collection("users").updateOne({
      name: req.params.username
    },{
      $set:{
        password: hash
      }
    });

    res.send("Password updated successfully");
  } else {
    res.status(400).send("User does not exist")
  }
})

/*
app.patch('/addfriend/:username',async(req,res) => {
    // Assuming req.body.friends is an array of friend names
  const friends = req.body.friend;

  // Check if friends array is provided and not empty
  if (!Array.isArray(friends) || friends.length === 0) {

      let existing = await client.db("Assignment").collection("users").findOne({
        name: req.body.friend
      });

      if (existing) {
        //if array of friends not provded
        let friend_addition = await client.db("Assignment").collection("users").updateOne({
          name: req.params.username
        },{
          $addToSet: {
            friends:  req.body.friend
          }
        });

        let friend_addition2 = await client.db("Assignment").collection("users").updateOne({
          name:req.body.friend
        },{
          $addToSet: {
            friends: req.params.username
          }
        });
        
        res.send("friend added successfully");
        console.log(friend_addition,friend_addition2);
        
      } else {
        res.status(400).send("User does not exist")
      }
      
  }else{
     //array of friends is present
      for (const friend of friends) {
        let existing = await client.db("Assignment").collection("users").findOne({
          name: friend
        });

        if (!existing) {
          return res.status(400).send(`User ${friend} does not exist`);
        }

        let friend_addition = await client.db("Assignment").collection("users").updateOne({
          name: req.params.username
        }, {
          $addToSet: {
            friends: friend
          }
      });
        let friend_addition2 = await client.db("Assignment").collection("users").updateOne({
            name:friend
          },{
            $addToSet: {
              friends: req.params.username
            }
        });
    }
    
    // Send a response after all friends have been added
    res.send({ message: 'Friends added successfully' });
  }
})
*/

app.patch('/removefriend/:username',async(req,res) => {
    // Assuming req.body.friends is an array of friend names
    const friends_removed = req.body.friend_to_be_removed;

    // Check if friends array is provided and not empty
    if (!Array.isArray(friends_removed) || friends_removed.length === 0) {
        //if array of friends not provded
        let existing = await client.db("Assignment").collection("users").findOne({
          name: req.body.friend_to_be_removed
        });
  
        if (existing) {
          
          let removing_friend = await client.db("Assignment").collection("users").updateOne({
            name: req.params.username
          },{
            $pull: {
              friends:  req.body.friend_to_be_removed
            }
          });
  
          let removing_friend2 = await client.db("Assignment").collection("users").updateOne({
            name:req.body.friend_to_be_removed
          },{
            $pull: {
              friends: req.params.username
            }
          });
          
          res.send("friend removed successfully");
          console.log(removing_friend,removing_friend2);
          
        } else {
          res.status(400).send("User does not exist")
        }
        
    }else{
       //array of friends is present
        for (const friends of friends_removed) {
          let existing = await client.db("Assignment").collection("users").findOne({
            name: friends
          });
  
          if (!existing) {
            return res.status(400).send(`User ${friends_removed} does not exist`);
          }
  
          let removing_friend = await client.db("Assignment").collection("users").updateOne({
            name: req.params.username
          }, {
            $pull: {
              friends: friends
            }
        });
          let removing_friend2 = await client.db("Assignment").collection("users").updateOne({
              name:friends
            },{
              $pull: {
                friends: req.params.username
              }
          });
      }
      
      // Send a response after all friends have been added
      res.send({ message: 'Friends removed successfully' });
    }
})

//update user profile
app.patch('/update/:id',async(req,res) => {
      //might need to update the part if they want to change the password , must hash the new password
      let require = await client.db("Assignment").collection("users").updateOne({
        _id: new ObjectId(req.params.id)
      },{
        $set:{
          name: req.body.username,
          email: req.body.email,
          gender: req.body.gender
        }
      });

      res.send(require);
    console.log(req.body);
})

app.patch('/buying_chest/:username',async(req,res) => {
  let user_existing = (await client.db("Assignment").collection("users").findOne({
    name: req.params.username
  
}))||(await client.db("Assignment").collection("users").findOne({
  email: req.params.username
}));

  let chest_existing = await client.db("Assignment").collection("chests").findOne({
    chest: req.body.collection  
  })
  console.log(user_existing,chest_existing);

  if(user_existing.money<chest_existing.price){
    res.send('Not enough money to buy chest. Please compete more battles to earn more money');
  }else{
    if (user_existing && chest_existing){
      let buying = await client.db("Assignment").collection("users").updateOne({$or:[{
        //filter by username or email
        name: req.params.username
      },{
        email: req.params.username
      }]
    },{
        //operation
        $addToSet:{
          collection: req.body.collection
        },
        $inc:{
          PlayerPowerLevel: chest_existing.total_power_level,
          money: -chest_existing.price
        }
        
      });
      res.send('Chest bought successfully');
      console.log(buying);
      console.log(req.body);
    }else{
      res.status(400).send('User or chest not found');
    }
  }
})

app.patch('/money_generator/:username',async(req,res) => {
  const min = 1000;
  const max = 2000;
  const newMoneyAmount = Math.floor(Math.random() * (max - min + 1)) + min;

  let user_existing = await client.db("Assignment").collection("users").findOne({
    name:req.params.username
  });

  if(user_existing){ 
    let money = await client.db("Assignment").collection("users").updateOne({
      name: req.params.username
    },{
      $set:{
        money: newMoneyAmount
      }
    });
    res.send(`Amount: RM ${newMoneyAmount} is given to ${req.params.username}`);
    console.log(money);
  }else{
    res.status(400).send('User not found');
  }
})

//select 5 characters to battle
// app.post('/battle/choosecharacter', async(req,res)=>{
//   try {
//     const characterIds = req.body.characterIds;

//     if (!Array.isArray(characterIds) || characterIds.length !== 5) {
//       return res.status(400).send('Exactly 5 characters must be selected');
//     }

//     const characters = await client.db("Assignment").collection("characters").find({
//       _id: { $in: characterIds }
//     }).toArray();

//     if (characters.length !== 5) {
//       return res.status(400).send('One or more selected characters do not exist');
//     }

//     // Save the selected characters for the fight
//     // This could be saved in a "fights" collection in the database
//     const fightId = await client.db("Assignment").collection("fights").insertOne({
//       characters: characterIds,
//       status: 'pending'
//     });

//     res.send(`Fight created with ID: ${fightId}`);
//   } catch (error) {
//     res.status(500).send('Server error');
//   }
// })

//choose one character to battle
app.post('/battle/choosecharacter', async(req, res) => {
  const characterId = req.body.characterId;

  // Validate characterId
  if (!characterId) {
    return res.status(400).send("characterId is required");
  }

  // Fetch the character from the database
  const character = await client.db("Assignment").collection("characters").findOne({ id: characterId });

  // Check if the character exists
  if (!character) {
    return res.status(404).send("Character not found");
  }

  // Check if the character is available for battle
  if (!character.isAvailable) {
    return res.status(400).send("Character is not available for battle");
  }

  // If everything is okay, proceed with the battle setup
  // This could involve adding the character to a "currentBattle" collection in your database,
  // or updating the character's status to "inBattle", etc.

  res.send({ message: "Character chosen successfully!", character });
});

//battle history
app.get('/battlehistory/:username',async(req,res) => {
  let battle_history = await client.db("Assignment").collection("battles").find({
    $or: [
      { user1: req.params.username },
      { user2: req.params.username }
    ]
  }).toArray();

  res.send(battle_history);
})

function calculateHealth(character, opponent) {
  const damage = (opponent.attack*opponent.speed) * (1-(character.defense/(character.defense+100)));
  return character.health - damage;
}

//battle between 2 users to decide who wins, the winner will get 1000 money and the loser will get 200 money
//the loser is the one whose health become 0 first
app.patch('/battle/:user1/:user2', async(req, res) => {
  let user1 = await client.db("Assignment").collection("users").findOne({
    name: req.params.user1
  });
  let user2 = await client.db("Assignment").collection("users").findOne({
    name: req.params.user2
  });

  // Check if both users exist
  if (!user1 || !user2) {
    return res.status(404).send("User not found");
  }

  // Initialize turn counts
  let user1Turns = 0;
  let user2Turns = 0;

  // Battle loop
  while (user1.health > 0 && user2.health > 0) {
    // Calculate the health for both users after the attack
    user1.health = calculateHealth(user1, user2);
    user2.health = calculateHealth(user2, user1);

    // Increment turn counts
    user1Turns++;
    user2Turns++;
  }

  // Determine the winner and the loser based on who reached 0 health first
  let winner = (user1.health > 0) ? user1 : user2;
  let loser = (user1.health > 0) ? user2 : user1;

  // Update the users' money
  winner.money += 1000;
  loser.money += 200;

  // Update the users in the database
  await client.db("Assignment").collection("users").updateOne({ name: winner.name }, { $set: { money: winner.money } });
  await client.db("Assignment").collection("users").updateOne({ name: loser.name }, { $set: { money: loser.money } });

  res.send({ message: `${winner.name} has won the battle in ${winner === user1 ? user1Turns : user2Turns} turns!`, winner, loser });
});



// app.post('/battle/:fightId', async(req, res) => {
//   try {
//     const fight = await client.db("Assignment").collection("fights").findOne({
//       _id: req.params.fightId
//     });

//     if (!fight || fight.status !== 'pending') {
//       return res.status(400).send('Fight not found or already completed');
//     }

//     const characters = await client.db("Assignment").collection("characters").find({
//       _id: { $in: fight.characters }
//     }).toArray();

//     const userCharacters = characters.slice(0, 5);
//     const opponentCharacters = characters.slice(5, 10);

//     let userWins = 0;
//     let opponentWins = 0;

//     for (let i = 0; i < 5; i++) {
//       if (userCharacters[i].attack > opponentCharacters[i].attack) {
//         userWins++;
//       } else {
//         opponentWins++;
//       }
//     }

//     let winner, loser;
//     if (userWins >= 3) {
//       winner = userCharacters[0].userId;
//       loser = opponentCharacters[0].userId;
//     } else {
//       winner = opponentCharacters[0].userId;
//       loser = userCharacters[0].userId;
//     }

//     await client.db("Assignment").collection("users").updateOne({ _id: winner }, { $inc: { money: 1000 } });
//     await client.db("Assignment").collection("users").updateOne({ _id: loser }, { $inc: { money: 200 } });

//     await client.db("Assignment").collection("fights").updateOne({ _id: req.params.fightId }, { $set: { status: 'completed' } });

//     res.send(`Battle completed. Winner: ${winner}`);
//   } catch (error) {
//     res.status(500).send('Server error');
//   }
// })

//function to calculate characters health after being attacked by opponent's characters

//calculate health of character after being attacked by opponent's character and the character that health=0 loses




/*
app.patch('/battle/:name1/:name2',async(req,res) => {
    let user1 = await client.db("Assignment").collection("users").findOne({
      name:req.params.name1
    });
    let user2 = await client.db("Assignment").collection("users").findOne({
      name:req.params.name2
    });

    if(user1 && user2){
      if(user1.PlayerPowerLevel > user2.PlayerPowerLevel){
        res.send(`${req.params.name1} has won the battle!!`);

        user1 = await client.db("Assignment").collection("users").updateOne({
          name: req.params.name1
        },{
          $inc:{
            money: 1000
          }
        });
        user1 = await client.db("Assignment").collection("users").updateOne({
          name: req.params.name2
        },{
          $inc:{
            money: 200
          }
        });

      }else{
        res.send(`${req.params.name2} has won the battle!!`);

        user1 = await client.db("Assignment").collection("users").updateOne({
          name: req.params.name1
        },{
          $inc:{
            money: 200
          }
        });
        user1 = await client.db("Assignment").collection("users").updateOne({
          name: req.params.name2
        },{
          $inc:{
            money: 1000
          }
        });
      }
    }else{
      res.status(400).send(`User:${req.params.name1} and User: ${req.params.name2} not found`);
    }
})
*/

//delete user profile
app.delete('/delete/:id',async(req,res) => {
  let delete_req = await client.db("Assignment").collection("users").deleteOne({
    _id: new ObjectId(req.params.id)
  });
  res.send(delete_req);
  console.log(req.params);  
})

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`)
})

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
    await client.connect();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);
