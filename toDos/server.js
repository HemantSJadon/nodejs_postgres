const {Client, Pool} = require('pg');

const pgPool = new Pool({
    user: "postgres",
    password: "postgres",
    host: "192.168.137.1",
    port: 5432,
    database : "todoapp",
    keepAlive: true
});

executeFlow();

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
    let isSuccess;
    try {
        const result = await client.query("insert into testTable(text) values ($1)",[toDoText]);
        console.log(`entered ${result.rowCount} records...`);
        isSuccess = true;
    } catch (error) {
        isSuccess = false; 
    }
    await client.release();
    console.log("successfully released the postgres client back to the pool");
    return isSuccess;
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
