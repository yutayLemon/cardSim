function intervalOverlap(int1,int2){
    let start = Math.max(int1[0],int2[0]);
    let end = Math.min(int1[1],int2[1]);

    let val = end-start;
    if(val > 0){
        return {result:true,val:val}
    }else{
        return {result:false};
    }
}
