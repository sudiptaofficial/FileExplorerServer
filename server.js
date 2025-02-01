const express = require("express");
const mongoose = require("mongoose");
const dotEnv = require('dotenv');
require("./config");
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json())


const port = process.env.PORT || 5000;

//Server Connection
app.listen(port,()=>{
    console.log(`Server running on port ${port}`)
})

//Database Connection
mongoose.connect(process.env.DB_URL, {})
    .then(() => console.log("Database Connected"))
    .catch(err => console.error(err))
