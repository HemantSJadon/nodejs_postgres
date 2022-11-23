//creates current date time in UTC
const date = new Date();


console.log(date);

console.log(date.toString());
console.log(date.toISOString());
console.log(date.toUTCString());
console.log(date.toLocaleString());

//transforms in JSON string format, can be saved 
const date_json = date.toJSON();
console.log(date_json);

//changes the string to date UTC
const date2 = new Date(date_json);

//UTC date can be converted to local date time of the server
console.log(date2.toLocaleString());