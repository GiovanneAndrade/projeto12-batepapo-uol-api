import { Db, MongoClient } from 'mongodb';
import express from 'express';
import cors from 'cors';
import joi from 'joi';

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
server.post('/participants', (req, res) => {
   let  lastStatus = {lastStatus: Date.now()}
   const validation = userSchema.validate(req.body, {abortEarly: false})
   if (validation.error){
    const erros = validation.error.details.map((err) => err.message)
    res.status(422).send(erros)
    return; 
   }
   db.collection('participants').insertOne({
    ...req.body, 
    ...lastStatus,
    
  })
  res.send(201)
});
//-----------------------------------------------

//----------------POST MESSAGES ----------------
server.post('/messages', (req, res) => {
  const  from  = req.headers.user
  const mensPost = postMessages.validate(req.body, {abortEarly: false})
  if (mensPost.error) {
    const er = mensPost.error.details.map((i)=> i.message)
    res.status(422).send(er)
    return;
  }
  db.collection('messages').insertOne({
    ...req.body,
    ...{ from }
    //...(instalar a biblioteca dayjs) 
  })
  res.send('ok')
}) 
//--------------------------------------------------

//----------------GET PARTCIPANTS ----------------
server.get('/participants', (req, res) => {
  db.collection('participants').find().toArray().then(participants => {console.log(participants)
    res.send(participants)
  }) 
});
//----------------------------------------------------------------

//---------------------GET MESSAGES------------------------
server.get('/messages', (req, res) => {
  let limit =  req.query
  db.collection('messages').find().toArray().then(messages => {console.log(messages) 
    res.send(messages);
  })
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
  console.log("ok")
});


