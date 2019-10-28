const expToFunc = (hasExpression) => {
  if (hasExpression.expFunc == null) {
    hasExpression.expFunc = toFunc(hasExpression.expression);
  };
};

const toFunc = (str) => {
  if (!str) {
    return () => 0;
  } else if (typeof (str) == "number") {
    return () => str;
  } else if (!Number.isNaN(Number(str))) {
    const value = Number(str);
    return () => value;
  } else {
    check(str);
    return new Function(["$rand", "$rank", "$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8"], "return " + str);
  }
};

const check = (str) => {
  // 危険なコードをブロックしたい気持ち
  assert(str.indexOf("=") < 0);
  assert(str.indexOf("{") < 0);
  assert(str.indexOf("}") < 0);
  assert(str.indexOf(":") < 0);
  assert(str.indexOf("window") < 0);
  assert(str.indexOf("location") < 0);
  assert(str.indexOf("navigator") < 0);
  assert(str.indexOf("document") < 0);
};

const assert = (bool) => {
  if (!bool) throw "AssertionError";
};

export { expToFunc }