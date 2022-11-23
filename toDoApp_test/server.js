const { json } = require('express');
const { Pool} = require('pg');
const app = require("express")();

//to parse incoming requests with json payloads
app.use(json());
// app.use(function (req, res, next) {
//     res.setHeader(
//       'Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; frame-src 'self';connect-src *"
//     );
    
//     next();
//   });

// app.get("/",(req,res) => {
//     res.redirect("/getToDos");
// });

app.get("/",(req,res) => res.sendFile(`${__dirname}/index.html`));

app.get("/getToDos",async (req,res)=> {
    const toDos = await readToDos();
    console.log(req.headers);
    res.setHeader("Content-Type","application/json");
    res.setHeader("X-Content-Type-Options","nosniff");
    // 'Content-Security-Policy-Report-Only', "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; frame-src 'self'"
    console.log(res.getHeaders());
    res.send(JSON.stringify(toDos));
})

app.post("/createToDo",async (req,res) => {
    const requestJson = req.body;
    let result = await createToDo(requestJson.toDo);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
});

app.delete("/deleteToDo", async (req,res) => {
    const requestJson = req.body;
    const ids = requestJson.ids;
    let result = [];
    for(let id of ids){
        try {
            await deleteToDo(id);
            result.push({id,success: true});
        } catch (error) {
            result.push({id, success: false});
        }
    }
    res.setHeader("Content-Type","application/json");
    res.send(JSON.stringify(result));
});

const port = 8082;
app.listen(port, () => console.log(`to do app test server is listening on port ${port}... `) );

const pgPool = new Pool({
    user: "postgres",
    password: "postgres",
    host: "192.168.137.1",
    port: 5432,
    database : "todoapp",
    keepAlive: true
});

// executeFlow();

async function executeFlow(){
    //use this section to insert a record
    /* const isCreated = await createToDo("write night pages");
    console.log(`task created:${isCreated}`);
    */

    // await sleep(2000); 
    let allToDos = await readToDos();
    const randomRecordToDelete = allToDos[Math.round(Math.random() * (allToDos.length -1))];
    //use this section to delete a to do by it's id
    console.log(`deleting the to-do: id ${randomRecordToDelete.id} - ${randomRecordToDelete.text}` )
    const isDeleted = await deleteToDo(randomRecordToDelete.id);
    console.log(`deletion successful: ${isDeleted}`);
    //use this section to read all created to-dos
    allToDos = await readToDos();
    console.log("here are all the to-do created toDate...");
    console.log(allToDos);

    //terminate the connection pool
    console.log("done with flow...");
    await pgPool.end();
    console.log("successfully terminated the pool...");
}
//createToDo("get a gift").then(() => console.log("task created...")).then(() => readToDos().then(() => console.log("done..")));


async function readToDos(){
    const client = await pgPool.connect();
    console.log("successfully fetched a postgres client from the pool...");
    let result;
    try 
    {
        result = (await client.query("select * from testTable")).rows;

    } 
    catch (error) {
        result = [];
    }
    await client.release();
    console.log("successfully released the postgres client back to the pool");
    return result;
}

async function createToDo(toDoText){
    const client = await pgPool.connect();
    console.log("successfully fetched a postgres client from the pool...");
    let created = {};
    try {
        const result = await client.query("insert into testTable(text) values ($1) returning id",[toDoText]);
        console.log(`entered ${result.rowCount} records...`);
        created.isSuccess = true;
        created.id = result.rows[0].id;
        // isSuccess = true;
        
    } catch (error) {
        console.log(error);
        created.isSuccess = false; 
    }
    await client.release();
    console.log("successfully released the postgres client back to the pool");
    return created;
}

async function deleteToDo(id){
    const client = await pgPool.connect();
    console.log("successfully fetched a postgres client from the pool...");
    let isSuccess;
    try {
        const result = await client.query("delete from testtable where id = $1",[id]);
        isSuccess = true;
    } catch (error) {
        isSuccess = false;
    }
    await client.release();
    console.log("successfully released the postgres client back to the pool");
    return isSuccess;

}

async function sleep(delay){
    return new Promise((rs,rj) => {
        setTimeout(rs, delay);
    });
}
