import { Db, MongoClient } from 'mongodb';
import express from 'express';
import cors from 'cors';
import joi from 'joi';
import dayjs from "dayjs";

 const data = new Date(100)
const server = express();
server.use(cors());
server.use(express.json());
  const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;


mongoClient.connect().then(() => {
  db = mongoClient.db('test')
})  
const userSchema = joi.object({
  name: joi.string().required().max(30)
})

const postMessages= joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required().valid('message', 'private_message')   
})

//------------------POST PARTCIPANTS ----------------
server.post('/participants', async  (req, res) => {
  const name = req.body.name
  
  const nameValido =  await db.collection("participants").findOne({name: name});
  
   if(nameValido) {
    res.sendStatus(409)
    return
  } 
   const validation = userSchema.validate(req.body, {abortEarly: false})
   if (validation.error){
    const erros = validation.error.details.map((err) => err.message)
    res.status(422).send(erros)
    return; 
   }
   
   db.collection('participants').insertOne({
    ...req.body, 
    ...{lastStatus: data}
    
  })
  res.send('ok')
});
//-----------------------------------------------

//----------------POST MESSAGES ----------------
server.post('/messages', async (req, res) => {
  const  from  = req.headers.user
  const mensPost = postMessages.validate(req.body, {abortEarly: false})
  if (mensPost.error) {
    const er = mensPost.error.details.map((i)=> i.message)
    res.status(422).send(er)
    return;
  }
  const fromValido =  await db.collection("participants").findOne({name: from});
  if(!fromValido){
    res.sendStatus(422)
    return
  }
  db.collection('messages').insertOne({
    ...req.body,
    ...{ from },
    ...{ time: dayjs().format("HH:mm:ss") }
  })
  res.send('ok')
 
}) 
//--------------------------------------------------

//----------------------POST STATUS ---------------------------------------
server.post('/status', async (req, res) => {
  const  user  = req.headers.user
  const statusValido =  await db.collection("participants").findOne({name: user});
  if(!statusValido){
    res.sendStatus(404)
    return
  }
   try {
    db.collection('status').insertOne({
      ...{ user }, 
      ...{ lastStatus: Date.now() }
    })
   } catch (error) { 
    res.status(500).send(error.message)
   }
   res.sendStatus(200)
   
});

//----------------------------------------------------------------------

//----------------GET PARTCIPANTS ----------------
server.get('/participants', (req, res) => {
  db.collection('participants').find().toArray().then(participants => {(participants)
    res.send(participants)
  }) 
});
//----------------------------------------------------------------

//---------------------GET MESSAGES------------------------
server.get('/messages', async (req, res) => {
  let limit =  req.query.limit
  let user = req.headers.name
  
  // msgs privada
  const chatFrom =  await db.collection("messages").find({to: user, type: 'private_message'}).toArray();
  const chatprivate = chatFrom.reverse();
  //msgs do user
  const toFrom =  await db.collection("messages").find({to: user}).toArray();
  const chatTo = toFrom.reverse();
  // msgs publicas
  const chatMessage =  await db.collection("messages").find({type: 'message'}).toArray();
  const messageChat = chatMessage.reverse()
  const messageReverse = messageChat.reverse()
  //msgs enviadas pelo user 
  const from =  await db.collection("messages").find({from: user}).toArray();
  const fromChat = from.reverse()
  console.log(chatMessage)
  const chatFiltro = [...fromChat, ...chatTo, ...chatprivate, ...messageChat]
  const chatReverse = chatFiltro.reverse()
  if(!fromChat.length && !chatprivate.length && !chatTo.length  ){ 
   
    res.send(messageReverse.slice(-limit).reverse())
    return
  }else{
      
    res.send(chatReverse.slice(-limit).reverse())
  }
   
  
})
//----------------------------------------------------------------

//---------------------DELET PARTCIPANTS ---------------------------------
server.delete('/participants', async (req, res) => {
  const  { type } = req.body
  try {
    await db.collection('participants').deleteOne({});
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(error.message)
  }
})

//----------------------------------------------------


//--------------------- delet messages  ---------------------------------
server.delete('/messages', async (req, res) => {
  const  { type } = req.body
  try {
    await db.collection('messages').deleteOne({});
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(error.message)
  }
 
})

//----------------------------------------------------


server.listen(5000, function() {
  console.log('ok')
});


