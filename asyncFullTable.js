const { Client } = require('pg');

const pgClient = new Client({
    user: "postgres",
    password: "postgres",
    host: "192.168.137.1", //fetch the ip address of the machine using ipconfig under wireless LAN adapter Local Area Connection* 12: in the subnet/private ip in the subnet
    port: 5432,
    // database: "postgres"
});

execute();

//async await in node use generators and yield with promises to implement asynchronous behaviour
async function execute() {
    try 
    {
        await pgClient.connect();
        console.log("connection to database successful ...");
        await pgClient.query("insert into grades_org(g,first_name) values($1,$2)", [89, "Badal"]);
        const results = await pgClient.query("select * from grades_org where first_name = $1 and g = $2 order by id desc limit 1", ["Badal", 89]);
        console.table(results.rows);
    }
    catch(ex)
    {
        console.log(`something went wrong : ${ex}`);
    }
    finally
    {
        await pgClient.end();
        console.log("connection successfully terminated...");
    }
}