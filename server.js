const express = require("express");
const mongoose = require("mongoose");
require("./config");

const app = express();

const port = process.env.PORT;

//Server Connection
app.listen(port,()=>{
    console.log(`Server running on port ${port}`)
})

//Database Connection
mongoose.connect(process.env.DB_URL, {})
    .then(() => console.log("Database Connected"))
    .catch(err => console.error(err))
