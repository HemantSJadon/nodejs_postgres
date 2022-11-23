const e = require("express");
const { json, request } = require("express");
const app = require("express")();
// import { nestCategories } from "./categoryNestingTest.js";
// const nest  = require('./categoryNestingTest.js');
const {nestCategories} = require('./categoryNestingTest');

app.use(json());
// app.post()

let users = [];
let categories = [];
let nextIds = {
    userId: 1,
    categoryId: 1
}
let loggedInUserIds = [];

app.post("/registerUser",async (req,res) => {
    const requestJson = req.body;
    let result = {};
    let isExisting = await checkIfUserExists(requestJson.email);
    if(isExisting){
        result.message = "user already exists. Please login with the email id to proceed."
        result.success= false;
    }
    else {
        result.userId = await getNextUserId();
         //Math.ceil(Math.random() * 10);
        result.email = requestJson.email;
        result.success = true;
        users.push({id : result.userId, email: result.email});
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
});

app.post("/login", async (req,res) => {
    const requestJson = req.body;
    let result = {};
    let user = await getUserForEmail(requestJson.email);
    if(user){
        result.success = true;
        result.userId = user.id;
        const isLoggedIn = await isUserLoggedIn(result.userId);
        if(!isLoggedIn) loggedInUserIds.push(result.userId);
    }
    else {
        result.success= false;
        result.message = "no user found for this email. please register user with this email to login"
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
})

app.post("/createCategory", async (req,res) => {
    const requestJson = req.body;
    let result = {};
    const {userId, parentCategoryId} = requestJson;
    const performInputValidation = async (userId, parentCategoryId) => {
        let validationResult = {};
        validationResult.isValid = true;
        const isLoggedIn = await isUserLoggedIn(userId);
        if(!isLoggedIn){
            validationResult.message = "user is not logged in. please login first to proceed.";
            validationResult.isValid = false;
        }
        if(validationResult.isValid){
            const parentCategoryValidityCheck = parentCategoryId ? await checkIfCategoryValid(parentCategoryId): {isValid: true};
            if(!parentCategoryValidityCheck.isValid){
                validationResult.message = "parent " + parentCategoryValidityCheck.message;
                validationResult.isValid = false;
            }
        }
        return validationResult;
    };
    const inputValidation = await performInputValidation(userId, parentCategoryId);
    if(inputValidation.isValid){
        result.categoryId = await createAndSaveANewCategory(requestJson);
        result.success = true;
    }
    else {
        result.success = false;
        result.message = inputValidation.message;
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
});

app.get("/getCategories", async (req,res) => {
    let result = {};
    //query parameters are passed as string type
    const userId = parseInt(req.query.userId);
    const isLoggedIn = await isUserLoggedIn(userId);
    if(!isLoggedIn){
        result.message = "user is not logged in. please login first to proceed.";
        result.success = false;
    }
    else {
        result.data = await getCategoriesWithNestedChildrenForUser(userId)
        // result.data = [];
        // let cat1 = {
        //     name : "work",
        //     id : 1,
        //     createdAt : new Date().toJSON(),
        //     children: []
        // };
        // let cat2 = {
        //     name : "personal",
        //     id: 2,
        //     createdAt: new Date().toJSON(),
        //     children: [
        //         {
        //             name : "blogs",
        //             id : 3,
        //             createdAt : new Date().toJSON(),
        //             children: []
        //         }
        //     ]
        // };
        // result.data.push(cat1);
        // result.data.push(cat2);
        result.success = true;
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
})






async function checkIfUserExists(email){
    return users.some(u => u.email === email);
}
async function getUserForEmail(email){
    return users.find(u => u.email === email);
}

async function getNextUserId(){
    return nextIds.userId++;
}

async function getNextCategoryId(){
    return nextIds.categoryId++;
}

async function isUserLoggedIn(userId){
    return loggedInUserIds.some(u => u === userId);
}

async function checkIfCategoryValid(categoryId){
    let result = {};
    let errMessage = '';
    const category = categories.find(c => c.id === categoryId);
    if(!category){
        errMessage += "category does not exist."
        result.isValid = false;
        result.message = errMessage
    }
    else if(category.isMerged){
        errMessage += "category is merged into another category."
        result.isValid = false;
        result.message = errMessage
    }
    else if(category.isDeleted){
        errMessage += "category has been deleted previously."
        result.isValid = false;
        result.message = errMessage
    }
    else{
        result.isValid = true;
    }
    return result;
}


async function createAndSaveANewCategory(categoryAttributes){
    const category = {};
    category.name = categoryAttributes.name;
    category.userId = categoryAttributes.userId;
    category.parentCatId = categoryAttributes.parentCategoryId;
    category.isMerged = false;
    category.isDeleted = false;
    category.createdAt = (new Date()).toJSON();
    category.id = await getNextCategoryId();
    categories.push(category);
    return category.id;
}

async function getCategoriesWithNestedChildrenForUser(userId){
    const allCategoriesForUser = categories.filter(c => c.userId === userId && !c.isDeleted && !c.isMerged).map(c => {
        return {
            name : c.name,
            id: c.id,
            createdAt: c.createdAt,
            parentId: c.parentCatId
        }
    });
    // const categories = [];
    // categories.push({id:1, name:"Cat1",createdAt: new Date().toJSON(), parentId: null});
    // categories.push({id:2, name:"Cat2",createdAt: new Date().toJSON(), parentId: 6});
    // categories.push({id:3, name:"Cat3",createdAt: new Date().toJSON(), parentId: 2});
    // categories.push({id:4, name:"Cat4",createdAt: new Date().toJSON(), parentId: null});
    // categories.push({id:5, name:"Cat5",createdAt: new Date().toJSON(), parentId: 3});
    // categories.push({id:6, name:"Cat6",createdAt: new Date().toJSON(), parentId: null});
    // categories.push({id:7, name:"Cat7",createdAt: new Date().toJSON(), parentId: 6});
    // categories.push({id:8, name:"Cat8",createdAt: new Date().toJSON(), parentId: 2});
    const nestedCats = nestCategories(allCategoriesForUser);
    return nestedCats;
    // console.log(JSON.stringify(nestedCats));
    
}

// getCategoriesWithNestedChildrenForUser(1);

app.get("/", (req,res) => {
    res.redirect("/getToDos");
})

app.get("/getToDos",(req,res) => {
    res.status(200).send("here are all my to-do tasks.");
})

const port = 8082;
app.listen(port, () => console.log(`to do app api server is listening on port ${port}... `) );