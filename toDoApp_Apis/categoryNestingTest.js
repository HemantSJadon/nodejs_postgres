const categories = [];
categories.push({id:1, name:"Cat1", parentId: null});
categories.push({id:2, name:"Cat2", parentId: 6});
categories.push({id:3, name:"Cat3", parentId: 2});
categories.push({id:4, name:"Cat4", parentId: null});
categories.push({id:5, name:"Cat5", parentId: 3});
categories.push({id:6, name:"Cat6", parentId: null});
categories.push({id:7, name:"Cat7", parentId: 6});
categories.push({id:8, name:"Cat8", parentId: 2});

function nestCategories(categories){
    let result = [];
    const childParentMap = new Map();
    categories.forEach(c => {
        childParentMap.set(c.id,c.parentId)
    });
    const isAdded = new Set();
    let prev = null;
    for(let keyValuePair of childParentMap){
        let key = keyValuePair[0], value = keyValuePair[1];
        if(isAdded.has(key)) continue;
        const familyTree = [];
        familyTree.push(key);
        while(value){
            familyTree.push(value);
            value = childParentMap.get(value);
        }
        let current = familyTree.shift();
        const currentCat = categories.find(c => c.id === current);
        let runningSubTree = {
            name: currentCat.name,
            id: currentCat.id,
            children: []
        }
        isAdded.add(current);
        let parentsToSearch = [];
        let locationToAddChild = null;
        while(familyTree.length > 0){
            current = familyTree.shift();
            if(isAdded.has(current)){
                parentsToSearch.push(current);
                continue;
            }
            const currentCat = categories.find(c => c.id === current);
            runningSubTree = {
                name: currentCat.name,
                id: currentCat.id,
                children: [runningSubTree]
            };
            isAdded.add(current);
            
        }
        while(parentsToSearch.length > 0){
            let currParentToSearch = parentsToSearch.pop();
            if(!locationToAddChild){
                locationToAddChild = result.find(r => r.id === currParentToSearch);
            }
            else{
                locationToAddChild = locationToAddChild.children.find(r => r.id === currParentToSearch);
            }
        }
        if(!locationToAddChild){
            result.push(runningSubTree);
        }
        else{
            locationToAddChild.children.push(runningSubTree);
        }
    }
    return result;
}

function testIterationOnMap(){
    const testMap = new Map();
    testMap.set(5,"cat5");
    testMap.set(7,"cat7");
    for(let keyValuePair in testMap){
        console.log(keyValuePair.key + " " + keyValuePair.value);
    }
}

// testIterationOnMap();

console.log(JSON.stringify(nestCategories(categories)));
