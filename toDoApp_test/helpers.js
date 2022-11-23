//random number generation

let result = 5;
while(true){
    const randomNum = Math.round(Math.random() * 5);
    console.log(randomNum);
    if(randomNum === 5) break;
    continue;
}

//delay the current execution

async function sleep(delay){
    return new Promise((rs,rj) => {
        setTimeout(rs, delay);
    });
}