export const parseTimeStamp = (time: number) => {
  return new Date(time).toLocaleString().split(",")[0];
};

export const sortable = (myObj: any) => {
  return Object.keys(myObj)
    .sort((a, b) => myObj[a] - myObj[b])
    .reduce(
      (_sortedObj, key) => ({
        ..._sortedObj,
        [key]: myObj[key],
      }),
      {},
    );
};

export const handleTimeTaken = (commandFullLine: string[]) => {
  let time = null;
  if ("2" in commandFullLine) {
    let timeTaken = commandFullLine[2],
      type: any = timeTaken.match(/([a-zA-Z]{1})$/g),
      howMuch = timeTaken.replace(/[a-zA-Z]+$/g, "");
    if (type && type[0] && howMuch.match(/^[0-9]+$/) && parseInt(howMuch) > 0) {
      type = type[0];
      if (type === "h" || type === "m" || type === "d") {
        time = timeTaken;
      }
    }
  }
  return time;
};
