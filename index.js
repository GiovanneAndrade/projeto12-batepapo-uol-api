import { Db, MongoClient } from 'mongodb';
import express from 'express';
import cors from 'cors';

const server = express();
server.use(cors());
server.use(express.json());
  const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;

mongoClient.connect().then(() => {
  db = mongoClient.db('test')
})  

server.post('/participants', (req, res) => {
   let  lastStatus = {lastStatus: Date.now()}
   
   db.collection('participants').insertOne({
    ...req.body, 
    ...lastStatus,
    
  })
  res.send('ok')
});

server.post('/messages', (req, res) => {
  
  const  from  = req.headers.user
  db.collection('messages').insertOne({
    ...req.body,
    ...{ from }
    //...(instalar a biblioteca dayjs) 
  })
  res.send('ok')
}) 

server.get('/participants', (req, res) => {
  db.collection('participants').find().toArray().then(participants => {console.log(participants)
    res.send(participants)
  }) 
});
server.get('/messages', (req, res) => {
  let limit =  req.query
  db.collection('messages').find().toArray().then(messages => {console.log(messages) 
    res.send(messages);
    
  })
})


server.listen(5000, function() {
  console.log("ok")
});


