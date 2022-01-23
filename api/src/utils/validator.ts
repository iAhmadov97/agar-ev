export const validatorURL = (target: string, itsImage?: boolean): boolean => {
  let reg = itsImage ? /^(https?)+\:\/\/+.*[\/.](gif|jpg|jpeg|png)$/i : /^(https?)+\:\/\/.*/;
  if (target && target.match(reg)) {
    return true;
  } else {
    return false;
  }
};

export const validatorText = (target: string, itsTag?: boolean) => {
  let readyTarget = target && (itsTag ? target.length > 0 : target.length >= 5);
  if (readyTarget) {
    return true;
  } else return false;
};
