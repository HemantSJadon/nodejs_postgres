const app = require("express")();

app.post()

app.get("/", (req,res) => {
    res.redirect("/getToDos");
})

app.get("/getToDos",(req,res) => {
    res.status(200).send("here are all my to-do tasks.");
})

const port = 8082;
app.listen(port, () => console.log(`to do app api server is listening on port ${port}... `) );