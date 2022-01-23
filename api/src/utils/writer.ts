export const ObjectToUint = (object: any) => {
  var stringFroce = Buffer.from(encodeURIComponent(unescape(JSON.stringify(object))), "utf-8").toString("base64"),
    charList = stringFroce.split(""),
    uintArray = [];
  for (var i = 0; i < charList.length; i++) {
    uintArray.push(charList[i].charCodeAt(0));
  }
  return new Uint8Array(uintArray);
};

export const uintToObject = (uintArray: any) => {
  var encodedString = String.fromCharCode.apply(
      null,
      (new Uint8Array(uintArray) as unknown) as number[],
    ),
    decodedString = decodeURIComponent(
      escape(Buffer.from(encodedString, "base64").toString("utf-8")),
    );

  return JSON.parse(decodedString);
};
