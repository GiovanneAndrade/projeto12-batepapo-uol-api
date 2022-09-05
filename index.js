import { MongoClient } from 'mongodb';
import express from 'express';
import cors from 'cors';
import joi from 'joi';
import dayjs from "dayjs";
import dotenv from 'dotenv';

dotenv.config();
 const data = new Date()
const server = express();
server.use(cors());
server.use(express.json());
  const mongoClient = new MongoClient(process.env.MONGO_URI);
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
  console.log(req.body.to)
  const mensPost = postMessages.validate(req.body, {abortEarly: false})
  if (mensPost.error) {
    const er = mensPost.error.details.map((i)=> i.message)
    res.status(422).send(er)
    return;
  }
  const fromValido =  await db.collection("participants").findOne({name: from});
  if(!fromValido ){
    res.sendStatus(422)
    return
  }if (from === req.body.to) {
    res.status("não e permitido enviar menssagens para si mesmo")
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

  const chatFrom =  await db.collection("messages").find({to: user, type: 'private_message'}).toArray();
  const chatprivate = chatFrom.reverse();

  const chatMessage =  await db.collection("messages").find({type: 'message'}).toArray();
  const messageChat = chatMessage.reverse()

  const from =  await db.collection("messages").find({from: user}, {type: 'private_message'}).toArray();
  const fromChat = from.reverse()

  const chatFiltro = [...fromChat, ...chatprivate, ...messageChat]
  
  if(!fromChat.length && !chatprivate.length && !messageChat.length ){ 
    res.send('não existe mensagens para ser exibidas')
    return
  }else{
      
    res.send(chatFiltro.slice(-limit))
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
 const checkTime = (15000)

setInterval( async (req,res) => {
  const time = Date.now() - (10000) 
  
  try {
    const usuariosInativos = await db.collection("participants").find({lastStatus: { $lte: time }}).toArray();
    
    if (usuariosInativos.length > 0) {
      const inactiveMessages = usuariosInativos.map(i => {
        return {
          from: i.name,
          to: 'Todos',
          text: 'sai da sala...',
          type: 'message',
          time: dayjs().format("HH:mm:ss")
        }
      });

      await db.collection("messages").insertMany(inactiveMessages);
      await db.collection("participants").deleteMany({lastStatus: { $lte: time }});
    }
    
  } catch (err) {
    res.status(500)
  }

},checkTime) 

server.listen(5000, function() {
  console.log('ok')
});


