const categories = [];

categories.push({name:"cat1", id: 1, parentId: null});
categories.push({name:"cat2", id: 2, parentId: 1});

categories.forEach(c => c.parent = "parent");

function getChildren(parentId){
    return categories.filter(c => c.parentId === parentId);
}

// console.log(JSON.stringify(getChildren(null)));

const value = parseInt('1');
console.log(isNaN(value));
console.log(typeof value);
console.log(value * 2);