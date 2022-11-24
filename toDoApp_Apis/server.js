// DEPENDENCIES
const e = require("express");
const { json, request } = require("express");
const app = require("express")();
const { nestCategories } = require('./categoryNestingTest');

// APP START AND MIDDLEWARE
startServer();
registerMiddleWares();

function startServer() {
    const port = 8082;
    app.listen(port, () => console.log(`to do app api server is listening on port ${port}... `));
}

function registerMiddleWares(){ 
    app.use(json());
}

// DATA
let users = [];
let categories = [];
let impacts = [{ id: 1, title: "High" }, { id: 2, title: "Med" }, { id: 3, title: "Low" }];
let toDos = [];
let nextIds = {
    userId: 1,
    categoryId: 1,
    toDoId: 1
}
let loggedInUserIds = [];

// APIs

// user registration and logins

app.post("/registerUser", async (req, res) => {
    const requestJson = req.body;
    let result = {};
    let isExisting = await checkIfUserExists(requestJson.email);
    if (isExisting) {
        result.message = "user already exists. Please login with the email id to proceed."
        result.success = false;
    }
    else {
        result.userId = await getNextUserId();
        //Math.ceil(Math.random() * 10);
        result.email = requestJson.email;
        result.success = true;
        users.push({ id: result.userId, email: result.email });
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
});

app.post("/login", async (req, res) => {
    const requestJson = req.body;
    let result = {};
    let user = await getUserForEmail(requestJson.email);
    if (user) {
        result.success = true;
        result.userId = user.id;
        const isLoggedIn = await isUserLoggedIn(result.userId);
        if (!isLoggedIn) loggedInUserIds.push(result.userId);
    }
    else {
        result.success = false;
        result.message = "no user found for this email. please register user with this email to login"
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
})

// category management

app.post("/createCategory", async (req, res) => {
    const requestJson = req.body;
    let result = {};
    const { userId, parentCategoryId } = requestJson;
    const performInputValidation = async (userId, parentCategoryId) => {
        let validationResult = {};
        validationResult.isValid = true;
        const isLoggedIn = await isUserLoggedIn(userId);
        if (!isLoggedIn) {
            validationResult.message = "user is not logged in. please login first to proceed.";
            validationResult.isValid = false;
        }
        if (validationResult.isValid) {
            const parentCategoryValidityCheck = parentCategoryId ? await checkIfCategoryValid(parentCategoryId, userId) : { isValid: true };
            if (!parentCategoryValidityCheck.isValid) {
                validationResult.message = "parent " + parentCategoryValidityCheck.message;
                validationResult.isValid = false;
            }
        }
        return validationResult;
    };
    const inputValidation = await performInputValidation(userId, parentCategoryId);
    if (inputValidation.isValid) {
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

app.post("/createCategories", async (req, res) => {
    const requestJson = req.body;
    let result = {};
    const { userId, parentCategoryId, categories } = requestJson;
    const performInputValidation = async (userId, parentCategoryId) => {
        let validationResult = {};
        validationResult.isValid = true;
        const isLoggedIn = await isUserLoggedIn(userId);
        if (!isLoggedIn) {
            validationResult.message = "user is not logged in. please login first to proceed.";
            validationResult.isValid = false;
        }
        if (validationResult.isValid) {
            const parentCategoryValidityCheck = parentCategoryId ? await checkIfCategoryValid(parentCategoryId, userId) : { isValid: true };
            if (!parentCategoryValidityCheck.isValid) {
                validationResult.message = "parent " + parentCategoryValidityCheck.message;
                validationResult.isValid = false;
            }
        }
        return validationResult;
    };
    const inputValidation = await performInputValidation(userId, parentCategoryId);
    if (!inputValidation.isValid) {
        result.success = false;
        result.message = inputValidation.message;
    }
    else if (!categories || categories.length === 0) {
        result.success = false;
        result.message = "categories to insert not found!";
    }
    else {
        result = [];
        categories.forEach(c => {
            c.userId = userId;
            c.parentCategoryId = parentCategoryId;
        })
        for (let category of categories) {
            let catResult = {};
            const newCatId = await createAndSaveANewCategory(category);
            catResult.name = category.name;
            catResult.success = true;
            catResult.categoryId = newCatId;
            result.push(catResult);
        }
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
});

app.get("/getCategories", async (req, res) => {
    let result = {};
    //query parameters are passed as string type
    const userId = parseInt(req.query.userId);
    const isLoggedIn = await isUserLoggedIn(userId);
    if (!isLoggedIn) {
        result.message = "user is not logged in. please login first to proceed.";
        result.success = false;
    }
    else {
        result.data = await getCategoriesWithNestedChildrenForUser(userId);
        result.success = true;
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
})

app.get("/getCategoriesUnderParent", async (req, res) => {
    //check security : passing "1bj" as userId parses it as 1 > why? 
    const userId = !isNaN(parseInt(req.query.userId)) && isFinite(parseInt(req.query.userId)) ? parseInt(req.query.userId) : -1;
    // console.log(req.query.parentCategoryId);
    const parentCategoryId = req.query.parentCategoryId === "null" || !req.query.parentCategoryId ? null : (!isNaN(parseInt(req.query.parentCategoryId)) && isFinite(parseInt(req.query.parentCategoryId)) ? parseInt(req.query.parentCategoryId) : -1);
    console.log(parentCategoryId);
    let result = {};
    const performInputValidation = async (userId, parentCategoryId) => {
        let validationResult = {};
        validationResult.isValid = true;
        const isLoggedIn = await isUserLoggedIn(userId);
        if (!isLoggedIn) {
            validationResult.message = "user is not logged in. please login first to proceed.";
            validationResult.isValid = false;
        }
        if (validationResult.isValid) {
            const parentCategoryValidityCheck = parentCategoryId ? await checkIfCategoryValid(parentCategoryId, userId) : { isValid: true };
            if (!parentCategoryValidityCheck.isValid) {
                validationResult.message = "parent " + parentCategoryValidityCheck.message;
                validationResult.isValid = false;
            }
        }
        return validationResult;
    };
    const inputValidation = await performInputValidation(userId, parentCategoryId);
    if (inputValidation.isValid) {
        result.data = await getChildrenCategoriesUnderParent(parentCategoryId, userId);
        result.success = true;
    }
    else {
        result.success = false;
        result.message = inputValidation.message;
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
})

app.delete("/deleteCategory", async (req, res) => {
    let result = {};
    const requestJson = req.body;
    const { userId, id } = requestJson;
    const performInputValidation = async (userId, id) => {
        let validationResult = {};
        validationResult.isValid = true;
        const isLoggedIn = await isUserLoggedIn(userId);
        if (!isLoggedIn) {
            validationResult.message = "user is not logged in. please login first to proceed.";
            validationResult.isValid = false;
        }
        if (validationResult.isValid) {
            const parentCategoryValidityCheck = parentCategoryId ? await checkIfCategoryValid(parentCategoryId, userId) : { isValid: true };
            if (!parentCategoryValidityCheck.isValid) {
                validationResult.message = parentCategoryValidityCheck.message;
                validationResult.isValid = false;
            }
        }
        return validationResult;
    };
    const inputValidation = await performInputValidation(userId, id);
    if (inputValidation.isValid) {
        result.categoryId = await createAndSaveANewCategory(requestJson);
        result.success = true;
    }
    else {
        result.success = false;
        result.message = inputValidation.message;
    }

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));

})

// impact management

app.get("/getImpacts", async (req, res) => {
    let result = {};
    const userId = !isNaN(parseInt(req.query.userId)) && isFinite(parseInt(req.query.userId)) ? parseInt(req.query.userId) : -1;
    //check if the user is logged in
    const isLoggedIn = await isUserLoggedIn(userId);
    if (!isLoggedIn) {
        result.message = "user is not logged in. please login first to proceed.";
        result.success = false;
    }
    else {
        result.success = true;
        result.data = impacts;
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
})

// to-do management

app.post("/createToDo", async (req, res) => {
    let result = {};
    const requestJson = req.body;
    // const {title, catId, impactId, userId, deadlineUTC} = requestJson;
    const performInputValidation = async (inputs) => {
        const { userId, categoryId, impactId, deadlineUTC } = inputs;
        let validationResult = {};
        validationResult.isValid = true;
        const isLoggedIn = await isUserLoggedIn(userId);
        if (!isLoggedIn) {
            validationResult.message = "user is not logged in. please login first to proceed.";
            validationResult.isValid = false;
        }
        if (validationResult.isValid) {
            const categoryValidation = categoryId ? await checkIfCategoryValid(categoryId, userId) : { isValid: true };
            if (!categoryValidation.isValid) {
                validationResult.message = categoryValidation.message;
                validationResult.isValid = false;
            }
        }
        if (validationResult.isValid) {
            if (!impactId) {
                validationResult.message = "task impact not set!";
                validationResult.isValid = false;
            }
            else {
                const impactValidation = await checkIfImpactValid(impactId);
                if (!impactValidation.isValid) {
                    validationResult.isValid = false;
                    validationResult.message = impactValidation.message;
                }
            }
        }
        if (validationResult.isValid) {
            if (!deadlineUTC) {
                validationResult.isValid = false;
                validationResult.message = "deadline not set!";
            }
        }
        return validationResult;
    };
    const inputValidation = await performInputValidation(requestJson);
    if (inputValidation.isValid) {
        result.success = true;
        result.id = await createAndSaveANewToDo(requestJson);
    }
    else {
        result.success = false;
        result.message = inputValidation.message;
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
})

app.post("/updateToDo", async (req, res) => {
    let result = {};
    const requestJson = req.body;
    // const {id, userId, catId, impactId, deadlineUTC} = requestJson;
    const performInputValidation = async (inputs) => {
        const { id,userId, catId, impactId } = inputs;
        let validationResult = {};
        validationResult.isValid = true;
        const isLoggedIn = await isUserLoggedIn(userId);
        if (!isLoggedIn) {
            validationResult.message = "user is not logged in. please login first to proceed.";
            validationResult.isValid = false;
        }
        if(validationResult.isValid){
            if(id === undefined){
                validationResult.message = "task id is missing!";
                validationResult.isValid = false;
            }
            else {
                const activeTaskExists = toDos.some(t => t.id === id && t.userId === userId && t.isActive && !t.isDeleted && !t.isCompleted)
                if(!activeTaskExists){
                    validationResult.message = "no active task found!!";
                    validationResult.isValid = false;
                }
            }

        }
        if (validationResult.isValid) {
            if (catId !== undefined) {
                const categoryValidation = catId ? await checkIfCategoryValid(catId, userId) : { isValid: true };
                if (!categoryValidation.isValid) {
                    validationResult.message = categoryValidation.message;
                    validationResult.isValid = false;
                }
            }
        }
        if (validationResult.isValid) {
            if (impactId !== undefined) {
                const impactValidation = await checkIfImpactValid(impactId);
                if (!impactValidation.isValid) {
                    validationResult.isValid = false;
                    validationResult.message = impactValidation.message;
                }
            }
        }
        return validationResult;
    };
    const inputValidation = await performInputValidation(requestJson);
    if (inputValidation.isValid) {
        let updatedValues = await updateAndSaveAToDo(requestJson.id, requestJson.userId, requestJson);
        result.success = true;
        result.id = requestJson.id;
        result.updatedValues = updatedValues;
    }
    else {
        result.success = false;
        result.message = inputValidation.message;
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
})

app.get("/getAllActiveToDos", async (req, res) => {
    let result = {};
    const userId = !isNaN(parseInt(req.query.userId)) && isFinite(parseInt(req.query.userId)) ? parseInt(req.query.userId) : -1;
    const isLoggedIn = await isUserLoggedIn(userId);
    if (!isLoggedIn) {
        result.success = false;
        result.message = "user is not logged in. please login first to proceed.";
    }
    else {
        result.success = true;
        result.data = await getAllActiveToDos(userId);
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result));
})

// SERVICES

// user service

async function checkIfUserExists(email) {
    return users.some(u => u.email === email);
}

async function getUserForEmail(email) {
    return users.find(u => u.email === email);
}

async function getNextUserId() {
    return nextIds.userId++;
}

async function isUserLoggedIn(userId) {
    return loggedInUserIds.some(u => u === userId);
}

// category service

async function getNextCategoryId() {
    return nextIds.categoryId++;
}

async function checkIfCategoryValid(categoryId, userId) {
    let result = {};
    let errMessage = '';
    if (categoryId !== null) {
        const category = categories.find(c => c.id === categoryId && c.userId === userId);
        if (!category) {
            errMessage += "category does not exist."
            result.isValid = false;
            result.message = errMessage
        }
        else if (category.isMerged) {
            errMessage += "category is merged into another category."
            result.isValid = false;
            result.message = errMessage
        }
        else if (category.isDeleted) {
            errMessage += "category has been deleted previously."
            result.isValid = false;
            result.message = errMessage
        }
        else {
            result.isValid = true;
        }
    }
    else result.isValid = true;
    return result;
}

async function createAndSaveANewCategory(categoryAttributes) {
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

async function getCategoriesWithNestedChildrenForUser(userId) {
    const allCategoriesForUser = categories.filter(c => c.userId === userId && !c.isDeleted && !c.isMerged).map(c => {
        return {
            name: c.name,
            id: c.id,
            createdAt: c.createdAt,
            parentId: c.parentCatId
        }
    });
    const nestedCats = nestCategories(allCategoriesForUser);
    return nestedCats;

}

async function getChildrenCategoriesUnderParent(parentCategoryId, userId) {
    let children = categories.filter(c => c.userId === userId && c.parentCatId === parentCategoryId).map(c => {
        return {
            name: c.name,
            id: c.id,
            createdAt: c.createdAt
        }
    });
    return children;
}

// impact service

async function checkIfImpactValid(impactId) {
    let validationResult = {};
    const impact = impacts.some(i => i.id === impactId);
    if (!impact) {
        validationResult.message = "invalid impact!";
        validationResult.isValid = false;
    }
    else validationResult.isValid = true;
    return validationResult;
}

// todo service

async function createAndSaveANewToDo(toDoAttributes) {
    const toDo = {
        title: toDoAttributes.title,
        userId: toDoAttributes.userId,
        createdCatId: toDoAttributes.catId,
        createdImpactId: toDoAttributes.impactId,
        currentCatId: toDoAttributes.catId,
        currentImpactId: toDoAttributes.impactId,
        deadline: toDoAttributes.deadlineUTC,
        isActive: true,
        isDeleted: false,
        isCompleted: false,
        isCompletedB4Deadline: false,
        isCurrentDeadlineCrossed: false,
        deadlinesCrossed: 0,
        deadlinesUpdated: 0,
        deadlinesUpdatedAfterCrossed: 0,
        createdAt: new Date().toJSON()
    }
    toDo.id = nextIds.toDoId++;
    toDos.push(toDo);
    return toDo.id;
}

async function updateAndSaveAToDo(toDoId, userId, updateAttributes) {
    let updatedValues = {};
    const toDo = toDos.find(t => t.id === toDoId && t.userId === userId && t.isActive && !t.isDeleted && !t.isCompleted);
    if (toDo) {
        let isUpdated = false;
        const { catId, impactId, deadlineUTC } = updateAttributes;
        if (catId !== undefined) {
            toDo.currentCatId = catId;
            updatedValues.catId = catId;
            isUpdated = true;
        };
        if (impactId !== undefined) {
            toDo.currentImpactId = impactId;
            updatedValues.impactId = impactId;
            isUpdated = true;
        };
        if (deadlineUTC !== undefined) {
            toDo.deadline = deadlineUTC;
            toDo.deadlinesUpdated++;
            if (toDo.isCurrentDeadlineCrossed) {
                toDo.deadlinesUpdatedAfterCrossed++;
                toDo.isCurrentDeadlineCrossed = false;
            }
            updatedValues.deadlineUTC = deadlineUTC;
            isUpdated = true;
        }
        if(isUpdated){
            toDo.updatedAt = new Date().toJSON();
        }
    }

    return updatedValues;
}

async function getAllActiveToDos(userId, toDate = undefined) {
    const allActiveToDos = toDos.filter(t => t.userId === userId && t.isActive && !t.isDeleted && !t.isCompleted)
        .map(t => {
            return {
                id: t.id,
                title: t.title,
                catId: t.currentCatId,
                impactId: t.currentImpactId,
                deadlineUTC: t.deadline,
                isCurrentDeadlineCrossed: t.isCurrentDeadlineCrossed,
                deadlinesCrossed: t.deadlinesCrossed,
                deadlinesUpdated: t.deadlinesUpdated,
                deadlinesUpdatedAfterCrossed: t.deadlinesUpdatedAfterCrossed,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt
            }
        });
    return allActiveToDos;
}