const {Client} = require('pg');

const pgClient = new Client({
    user : "postgres",
    password: "postgres",
    host: "192.168.137.1", //fetch the ip address of the machine using ipconfig under wireless LAN adapter Local Area Connection* 12: in the subnet/private ip in the subnet
    port: 5432,
    // database: "postgres"
});

pgClient.connect()
.then(() => console.log("connection to database successful ..."))
.then(() => pgClient.query("select * from grades_org where first_name = $1",["Gaurav"])/*return a promise with results object*/)
.then(results => {
    // for(let prop in results){
    //     console.log(prop);
    // }
    console.log(typeof results.rows);
    console.table(results.rows);
})
.catch((err) => console.log(err.message))
.finally(
    () => pgClient.end().then(() => console.log("connection successfully terminated..."))
    .catch((err) => console.log(err.message))
);